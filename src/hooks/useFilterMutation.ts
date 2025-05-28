import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { UseFilterPilotResult } from '../types';
import { useRef, useCallback } from 'react';

interface UseFilterMutationOptions<TData, TFilters, TMutationData, TMutationVariables> {
  filterPilot: UseFilterPilotResult<TData, TFilters>;
  mutationFn: (variables: TMutationVariables) => Promise<TMutationData>;
  onSuccess?: (data: TMutationData, variables: TMutationVariables, context: any) => void;
  onError?: (error: Error, variables: TMutationVariables, context: any) => void;
  onSettled?: (data: TMutationData | undefined, error: Error | null, variables: TMutationVariables, context: any) => void;
  invalidateOnSuccess?: boolean;
  optimisticUpdate?: (variables: TMutationVariables) => TData[];
  // Allow passing additional mutation options
  mutationOptions?: Omit<UseMutationOptions<TMutationData, Error, TMutationVariables>, 'mutationFn' | 'onMutate' | 'onError' | 'onSuccess' | 'onSettled'>;
}

/**
 * Hook for mutations that work with filter pilot
 * Automatically invalidates queries and handles optimistic updates
 */
export function useFilterMutation<TData, TFilters, TMutationData, TMutationVariables>(
  options: UseFilterMutationOptions<TData, TFilters, TMutationData, TMutationVariables>
) {
  const queryClient = useQueryClient();
  const { 
    filterPilot, 
    mutationFn, 
    onSuccess, 
    onError, 
    onSettled,
    invalidateOnSuccess = true, 
    optimisticUpdate,
    mutationOptions = {}
  } = options;
  
  // Use refs to prevent race conditions
  const pendingMutationsRef = useRef(new Set<string>());
  const invalidationTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Stable query key getter
  const getQueryKey = useCallback(() => {
    return filterPilot.getQueryKey();
  }, [filterPilot]);

  // Debounced invalidation to prevent multiple invalidations
  const debouncedInvalidate = useCallback(() => {
    if (invalidationTimeoutRef.current) {
      clearTimeout(invalidationTimeoutRef.current);
    }
    
    invalidationTimeoutRef.current = setTimeout(() => {
      const queryKey = getQueryKey();
      queryClient.invalidateQueries({ 
        queryKey: queryKey.slice(0, -1), // Remove the last element (urlSyncTrigger) for broader invalidation
        exact: false,
        refetchType: 'active'
      });
    }, 50); // Small delay to batch invalidations
  }, [queryClient, getQueryKey]);

  return useMutation<TMutationData, Error, TMutationVariables, { 
    previousData?: any; 
    mutationId?: string;
    wasOptimistic?: boolean;
  }>({
    mutationFn: async (variables) => {
      // Generate unique mutation ID
      const mutationId = `mutation_${Date.now()}_${Math.random()}`;
      pendingMutationsRef.current.add(mutationId);
      
      try {
        const result = await mutationFn(variables);
        return result;
      } finally {
        pendingMutationsRef.current.delete(mutationId);
      }
    },
    onMutate: async (variables) => {
      const mutationId = `mutation_${Date.now()}_${Math.random()}`;
      const queryKey = getQueryKey();
      
      if (optimisticUpdate) {
        try {
          // Cancel outgoing refetches to prevent race conditions
          await queryClient.cancelQueries({ 
            queryKey: queryKey.slice(0, -1), // Match without urlSyncTrigger 
            exact: false 
          });
          
          // Snapshot previous value
          const previousData = queryClient.getQueryData(queryKey);
          
          // Only apply optimistic update if no other mutations are pending
          if (pendingMutationsRef.current.size <= 1) {
            // Optimistically update
            queryClient.setQueryData(queryKey, (old: any) => {
              if (!old?.data) return old;
              
              const newData = optimisticUpdate(variables);
              return {
                ...old,
                data: newData,
                // Update totalRecords for create/delete operations
                totalRecords: old.totalRecords + (
                  newData.length > (old.data?.length || 0) ? 1 : 
                  newData.length < (old.data?.length || 0) ? -1 : 0
                )
              };
            });
          }
          
          return { 
            previousData, 
            mutationId,
            wasOptimistic: pendingMutationsRef.current.size <= 1
          };
        } catch (error) {
          console.warn('Optimistic update failed:', error);
          return { mutationId, wasOptimistic: false };
        }
      }
      
      return { mutationId, wasOptimistic: false };
    },
    onError: (error, variables, context) => {
      // Rollback on error only if we applied optimistic update
      if (context?.previousData && context?.wasOptimistic) {
        const queryKey = getQueryKey();
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      // Always invalidate on error to ensure consistency
      if (invalidateOnSuccess) {
        debouncedInvalidate();
      }
      
      onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      // Always invalidate on success to get fresh data
      if (invalidateOnSuccess) {
        debouncedInvalidate();
      }
      
      onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Cleanup
      if (context?.mutationId) {
        pendingMutationsRef.current.delete(context.mutationId);
      }
      
      // Additional safety invalidation for settled mutations
      if (invalidateOnSuccess && !error) {
        // Delay a bit more to ensure all state updates are complete
        setTimeout(() => {
          debouncedInvalidate();
        }, 100);
      }
      
      onSettled?.(data, error, variables, context);
    },
    // Prevent retries for mutations to avoid duplicate operations
    retry: false,
    // Add network-only mode to ensure fresh data
    networkMode: 'online',
    ...mutationOptions,
  });
}