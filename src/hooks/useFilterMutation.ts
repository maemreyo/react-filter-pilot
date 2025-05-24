import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { UseFilterPilotResult } from '../types';

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
  
  return useMutation<TMutationData, Error, TMutationVariables, { previousData?: any }>({
    mutationFn,
    onMutate: async (variables) => {
      if (optimisticUpdate) {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: filterPilot.getQueryKey() });
        
        // Snapshot previous value
        const previousData = queryClient.getQueryData(filterPilot.getQueryKey());
        
        // Optimistically update
        queryClient.setQueryData(filterPilot.getQueryKey(), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: optimisticUpdate(variables),
          };
        });
        
        return { previousData };
      }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(filterPilot.getQueryKey(), context.previousData);
      }
      onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (invalidateOnSuccess) {
        queryClient.invalidateQueries({ queryKey: filterPilot.getQueryKey() });
      }
      onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      if (onSettled) {
        onSettled(data, error, variables, context);
      }
    },
    ...mutationOptions,
  });
}