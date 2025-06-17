import { useMutation, useQueryClient, UseMutationOptions, Query } from '@tanstack/react-query';
import { UseFilterPilotResult } from '../types';
import { useRef, useCallback } from 'react';

interface UseFilterMutationOptions<TData, TFilters, TMutationData, TMutationVariables> {
  filterPilot: UseFilterPilotResult<TData, TFilters>;
  mutationFn: (variables: TMutationVariables) => Promise<TMutationData>;
  onSuccess?: (data: TMutationData, variables: TMutationVariables, context: any) => void;
  onError?: (error: Error, variables: TMutationVariables, context: any) => void;
  onSettled?: (
    data: TMutationData | undefined,
    error: Error | null,
    variables: TMutationVariables,
    context: any
  ) => void;
  invalidateOnSuccess?: boolean;
  optimisticUpdate?: (variables: TMutationVariables) => TData[];
  // New parameters for multi-query update
  updateAllQueries?: boolean;
  queryFilter?: (query: Query) => boolean;
  findItemFn?: (item: TData, variables: TMutationVariables) => boolean;
  updateItemFn?: (item: TData, variables: TMutationVariables, data?: TMutationData) => TData;
  maxQueriesUpdated?: number;
  debug?: boolean;
  // Allow passing additional mutation options
  mutationOptions?: Omit<
    UseMutationOptions<TMutationData, Error, TMutationVariables>,
    'mutationFn' | 'onMutate' | 'onError' | 'onSuccess' | 'onSettled'
  >;
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
    updateAllQueries = false,
    queryFilter,
    findItemFn,
    updateItemFn,
    maxQueriesUpdated = 10,
    debug = false,
    mutationOptions = {},
  } = options;

  // Use refs to prevent race conditions
  const pendingMutationsRef = useRef(new Set<string>());
  const invalidationTimeoutRef = useRef<NodeJS.Timeout>();
  const mutationQueueRef = useRef<Array<() => Promise<any>>>([]);
  const isProcessingRef = useRef(false);

  // Stable query key getter
  const getQueryKey = useCallback(() => {
    return filterPilot.getQueryKey();
  }, [filterPilot]);

  // Process mutation queue
  const processMutationQueue = useCallback(async () => {
    if (isProcessingRef.current || mutationQueueRef.current.length === 0) return;

    isProcessingRef.current = true;

    try {
      const nextMutation = mutationQueueRef.current.shift();
      await nextMutation?.();
    } finally {
      isProcessingRef.current = false;
      if (mutationQueueRef.current.length > 0) {
        processMutationQueue();
      }
    }
  }, []);

  // Queue mutation
  const queueMutation = useCallback(
    (mutationFn: () => Promise<any>) => {
      mutationQueueRef.current.push(mutationFn);
      processMutationQueue();
    },
    [processMutationQueue]
  );

  // Find relevant queries
  const findRelevantQueries = useCallback(
    (baseKey: unknown) => {
      const queryCache = queryClient.getQueryCache();
      let allQueries = queryCache.findAll({
        predicate: (query) => {
          const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
          return key === baseKey;
        },
      });

      // Apply custom filter if provided
      if (queryFilter) {
        allQueries = allQueries.filter(queryFilter);
      }

      // Limit number of queries to update
      if (allQueries.length > maxQueriesUpdated) {
        if (debug) {
          console.warn(
            `Found ${allQueries.length} queries, but will only update ${maxQueriesUpdated}`
          );
        }
        allQueries = allQueries.slice(0, maxQueriesUpdated);
      }

      return allQueries;
    },
    [queryClient, queryFilter, maxQueriesUpdated, debug]
  );

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
        refetchType: 'active',
      });
    }, 50); // Small delay to batch invalidations
  }, [queryClient, getQueryKey]);

  return useMutation<
    TMutationData,
    Error,
    TMutationVariables,
    {
      previousData?: any;
      previousDataMap?: Record<string, any>;
      mutationId?: string;
      wasOptimistic?: boolean;
    }
  >({
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

      if (debug) {
        console.group('Optimistic Update');
        console.log('Variables:', variables);
        console.log('Query Key:', queryKey);
      }

      if (optimisticUpdate || (updateAllQueries && findItemFn && updateItemFn)) {
        try {
          // Cancel outgoing refetches to prevent race conditions
          await queryClient.cancelQueries({
            queryKey: queryKey.slice(0, -1), // Match without urlSyncTrigger
            exact: false,
          });

          // Snapshot previous value
          const previousData = queryClient.getQueryData(queryKey);
          const previousDataMap: Record<string, { queryKey: unknown; data: any }> = {};

          // Only apply optimistic update if no other mutations are pending
          if (pendingMutationsRef.current.size <= 1) {
            if (optimisticUpdate) {
              // Optimistically update current query
              queryClient.setQueryData(queryKey, (old: any) => {
                if (!old?.data) return old;

                const newData = optimisticUpdate(variables);
                return {
                  ...old,
                  data: newData,
                  // Update totalRecords for create/delete operations
                  totalRecords:
                    old.totalRecords +
                    (newData.length > (old.data?.length || 0)
                      ? 1
                      : newData.length < (old.data?.length || 0)
                        ? -1
                        : 0),
                };
              });
            }

            // Update all queries if requested
            if (updateAllQueries && findItemFn && updateItemFn) {
              const baseKey = Array.isArray(queryKey) ? queryKey[0] : queryKey;
              const allQueries = findRelevantQueries(baseKey);

              if (debug) {
                console.log('Found queries:', allQueries.length);
              }

              let updatedQueries = 0;

              for (const query of allQueries) {
                const otherQueryKey = query.queryKey;
                const otherQueryData = queryClient.getQueryData(otherQueryKey) as any;

                if (otherQueryData?.data) {
                  // Store original data for rollback
                  previousDataMap[query.queryHash] = {
                    queryKey: otherQueryKey,
                    data: otherQueryData,
                  };

                  // Update data
                  queryClient.setQueryData(otherQueryKey, (old: any) => {
                    if (!old?.data) return old;

                    const updatedData = old.data.map((item: TData) => {
                      if (findItemFn(item, variables)) {
                        return updateItemFn(item, variables);
                      }
                      return item;
                    });

                    updatedQueries++;

                    return {
                      ...old,
                      data: updatedData,
                    };
                  });
                }
              }

              if (debug) {
                console.log('Updated queries:', updatedQueries);
              }
            }
          }

          if (debug) {
            console.groupEnd();
          }

          return {
            previousData,
            previousDataMap,
            mutationId,
            wasOptimistic: pendingMutationsRef.current.size <= 1,
          };
        } catch (error) {
          if (debug) {
            console.warn('Optimistic update failed:', error);
            console.groupEnd();
          }
          return { mutationId, wasOptimistic: false };
        }
      }

      if (debug) {
        console.groupEnd();
      }

      return { mutationId, wasOptimistic: false };
    },
    onError: (error, variables, context) => {
      // Rollback on error only if we applied optimistic update
      if (context?.wasOptimistic) {
        // Rollback main query
        if (context?.previousData) {
          const queryKey = getQueryKey();
          queryClient.setQueryData(queryKey, context.previousData);
        }

        // Rollback other queries
        if (context?.previousDataMap) {
          for (const queryHash in context.previousDataMap) {
            const { queryKey, data } = context.previousDataMap[queryHash];
            queryClient.setQueryData(queryKey, data);
          }
        }
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

/**
 * Interface for useItemMutation options
 */
interface ItemMutationOptions<TData, TFilters, TMutationData, TMutationVariables>
  extends Omit<
    UseFilterMutationOptions<TData, TFilters, TMutationData, TMutationVariables>,
    'findItemFn' | 'updateItemFn' | 'updateAllQueries'
  > {
  itemIdField?: string;
}

/**
 * Helper hook for item-based mutations
 * Simplifies the process of updating a specific item across all queries
 *
 * @example
 * // Update a notification as read across all pages
 * const markAsRead = useItemMutation({
 *   filterPilot,
 *   mutationFn: (id) => api.markNotificationAsRead(id),
 *   itemIdField: 'id',
 * });
 *
 * // Usage
 * markAsRead.mutate(notificationId);
 */
export function useItemMutation<TData, TFilters, TMutationData, TMutationVariables>({
  filterPilot,
  mutationFn,
  itemIdField = 'id',
  ...options
}: ItemMutationOptions<TData, TFilters, TMutationData, TMutationVariables>) {
  return useFilterMutation({
    filterPilot,
    mutationFn,
    updateAllQueries: true,
    findItemFn: (item: any, variables: TMutationVariables) => item[itemIdField] === variables,
    updateItemFn: (item: any, variables: TMutationVariables, data?: TMutationData) => ({
      ...item,
      ...data,
    }),
    ...options,
  });
}
