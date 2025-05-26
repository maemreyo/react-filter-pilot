import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UseFilterPilotOptions,
  UseFilterPilotResult,
  PaginationState,
  SortState,
  FilterPreset,
  FetchParams,
  FetchResult,
} from '../types';
import {
  getDefaultFilters,
  isFilterActive,
  mergeFilters,
  parseUrlParams,
  buildUrlParams,
  transformFilterValue,
} from '../utils';
import { useDefaultUrlHandler } from './useUrlHandler';
import { useFetchControl } from './useAdvancedFetchControl';

export function useFilterPilot<TData, TFilters = Record<string, any>>(
  options: UseFilterPilotOptions<TData, TFilters>
): UseFilterPilotResult<TData, TFilters> {
  const {
    filterConfigs,
    paginationConfig = {},
    sortConfig = {},
    fetchConfig,
    urlHandler: providedUrlHandler,
    initialFiltersProvider,
    enablePresets = false,
  } = options;

  // URL handler
  const defaultUrlHandler = useDefaultUrlHandler();
  const urlHandler = providedUrlHandler || defaultUrlHandler;

  // Default values
  const defaultFilters = useMemo(
    () => getDefaultFilters(filterConfigs) as TFilters,
    [filterConfigs]
  );

  const defaultPagination: PaginationState = {
    page: paginationConfig.initialPage || 1,
    pageSize: paginationConfig.initialPageSize || 10,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const defaultSort: SortState | undefined = sortConfig.initialSortField
    ? {
        field: sortConfig.initialSortField,
        direction: sortConfig.initialSortDirection || 'asc',
      }
    : undefined;

  // State
  const [filters, setFiltersState] = useState<TFilters>(defaultFilters);
  const [pagination, setPaginationState] = useState<PaginationState>(defaultPagination);
  const [sort, setSortState] = useState<SortState | undefined>(defaultSort);
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  // Refs for debounced values
  const debouncedFilters = useRef<TFilters>(filters);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Track URL sync trigger separately
  const [urlSyncTrigger, setUrlSyncTrigger] = useState(0);

  // Initialize from URL on mount
  useEffect(() => {
    const initializeFromUrl = async () => {
      const urlParams = urlHandler.getParams();
      const urlFilters = parseUrlParams(urlParams, filterConfigs);

      // Get initial filters from provider if available
      let initialFilters = defaultFilters;
      if (initialFiltersProvider) {
        try {
          const providedFilters = await initialFiltersProvider();
          // @ts-ignore
          initialFilters = mergeFilters(providedFilters, defaultFilters) as TFilters;
        } catch (error) {
          console.error('Error loading initial filters:', error);
        }
      }

      // Merge URL filters with initial filters
      // @ts-ignore
      const finalFilters = mergeFilters(urlFilters, initialFilters) as TFilters;
      setFiltersState(finalFilters);
      debouncedFilters.current = finalFilters;

      // Initialize pagination from URL
      if (paginationConfig.syncWithUrl !== false) {
        const page = parseInt(urlParams.get('page') || '1', 10);
        const pageSize = parseInt(
          urlParams.get('pageSize') || String(defaultPagination.pageSize),
          10
        );
        setPaginationState((prev) => ({ ...prev, page, pageSize }));
      }

      // Initialize sort from URL
      if (sortConfig.syncWithUrl !== false) {
        const sortField = urlParams.get('sortBy');
        const sortDirection = urlParams.get('sortOrder') as 'asc' | 'desc' | null;
        if (sortField) {
          setSortState({
            field: sortField,
            direction: sortDirection || 'asc',
          });
        }
      }
    };

    initializeFromUrl();
  }, []); // Only run on mount

  // Sync to URL when state changes
  useEffect(() => {
    // Skip on initial mount
    if (urlSyncTrigger === 0) return;

    const params = urlHandler.getParams();
    // @ts-ignore
    const filterParams = buildUrlParams(debouncedFilters.current, filterConfigs);

    // Clear existing filter params
    filterConfigs.forEach((config) => {
      const urlKey = config.urlKey || config.name;
      params.delete(urlKey);
    });

    // Set new filter params - chỉ đồng bộ các filter có syncWithUrl !== false
    filterParams.forEach((value, key) => {
      const config = filterConfigs.find((c) => c.urlKey === key || c.name === key);
      if (config?.syncWithUrl !== false) {
        params.set(key, value);
      }
    });

    // Add pagination params
    if (paginationConfig.syncWithUrl !== false) {
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));
    }

    // Add sort params
    if (sortConfig.syncWithUrl !== false && sort) {
      params.set('sortBy', sort.field);
      params.set('sortOrder', sort.direction);
    } else if (sortConfig.syncWithUrl !== false) {
      params.delete('sortBy');
      params.delete('sortOrder');
    }

    urlHandler.setParams(params);
  }, [
    urlSyncTrigger,
    pagination,
    sort,
    filterConfigs,
    paginationConfig.syncWithUrl,
    sortConfig.syncWithUrl,
    urlHandler,
  ]);

  // Query key
  const queryKey = useMemo(() => {
    // Only include urlSyncTrigger if filters actually changed
    const key = [
      fetchConfig.queryKey || 'filterPilot',
      'filters',
      debouncedFilters.current,
      'pagination',
      pagination,
      'sort',
      sort,
    ];

    // Add a stable identifier instead of urlSyncTrigger
    // This prevents query key from changing on every sync
    return key;
  }, [debouncedFilters.current, pagination, sort, fetchConfig.queryKey]);

  // Fetch control
  const { shouldFetch, fetchReason, controlledFetch } = useFetchControl(
    debouncedFilters.current,
    options.fetchControl
  );

  // Fetch function
  const fetchData = useCallback(async () => {
    const params: FetchParams<TFilters> = {
      filters: debouncedFilters.current,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
      sort,
    };

    // Transform filters for API
    const transformedParams = { ...params };
    transformedParams.filters = {} as TFilters;

    Object.entries(params.filters as Record<string, any>).forEach(([key, value]) => {
      const config = filterConfigs.find((c) => c.name === key);
      const transformedValue = transformFilterValue(value, config?.transformForApi);
      (transformedParams.filters as any)[key] = transformedValue;
    });

    // Wrap with fetch control
    return controlledFetch(() => fetchConfig.fetchFn(transformedParams));
  }, [pagination, sort, filterConfigs, fetchConfig.fetchFn, controlledFetch]);

  // Query
  const query = useQuery<FetchResult<TData>, Error, FetchResult<TData>, unknown[]>({
    queryKey,
    queryFn: fetchData,
    enabled: fetchConfig.enabled !== false && shouldFetch,
    staleTime: fetchConfig.staleTime,
    gcTime: fetchConfig.gcTime || fetchConfig.cacheTime,
    refetchOnWindowFocus: fetchConfig.refetchOnWindowFocus,
    refetchInterval: fetchConfig.refetchInterval,
    refetchIntervalInBackground: fetchConfig.refetchIntervalInBackground,
    select: fetchConfig.select,
    placeholderData: fetchConfig.placeholderData,
    initialData: fetchConfig.initialData,
    initialDataUpdatedAt: fetchConfig.initialDataUpdatedAt,
    retry: fetchConfig.retry,
    retryDelay: fetchConfig.retryDelay,
    networkMode: fetchConfig.networkMode,
    meta: fetchConfig.meta,
    queryKeyHashFn: fetchConfig.queryKeyHashFn,
    structuralSharing: fetchConfig.structuralSharing,
  });

  // Handle success/error with useEffect to support both v4 and v5
  useEffect(() => {
    if (query.isSuccess && query.data) {
      setPaginationState((prev) => ({
        ...prev,
        totalRecords: query.data.totalRecords,
        totalPages: Math.ceil(query.data.totalRecords / prev.pageSize),
        hasNextPage: prev.page < Math.ceil(query.data.totalRecords / prev.pageSize),
        hasPreviousPage: prev.page > 1,
      }));

      fetchConfig.onSuccess?.(query.data);
    }
  }, [query.isSuccess, query.data]);

  useEffect(() => {
    if (query.isError && query.error) {
      fetchConfig.onError?.(query.error);
    }
  }, [query.isError, query.error]);

  // Filter functions
  const setFilterValue = useCallback(
    (name: keyof TFilters, value: any) => {
      const config = filterConfigs.find((c) => c.name === String(name));

      // Batch state updates using React 18's automatic batching
      // or use unstable_batchedUpdates for older versions
      setFiltersState((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Handle debouncing
      if (config?.debounceMs) {
        // Clear existing timer
        if (debounceTimers.current[String(name)]) {
          clearTimeout(debounceTimers.current[String(name)]);
        }

        // Set new timer
        debounceTimers.current[String(name)] = setTimeout(() => {
          // Use functional update to avoid closure issues
          debouncedFilters.current = {
            ...debouncedFilters.current,
            [name]: value,
          };

          // Batch these updates together
          setUrlSyncTrigger((prev) => prev + 1);

          // Reset pagination if configured
          if (paginationConfig.resetOnFilterChange !== false) {
            // Nếu có resetPageOnFilterChange, kiểm tra xem filter này có cần reset page không
            if (
              !paginationConfig.resetPageOnFilterChange ||
              paginationConfig.resetPageOnFilterChange(String(name))
            ) {
              setPaginationState((prev) => ({ ...prev, page: 1 }));
            }
          }
        }, config.debounceMs);
      } else {
        // No debouncing, update immediately
        debouncedFilters.current = {
          ...debouncedFilters.current,
          [name]: value,
        };

        // Defer URL sync to next tick to avoid immediate re-render
        queueMicrotask(() => {
          setUrlSyncTrigger((prev) => prev + 1);

          // Reset pagination if configured
          if (paginationConfig.resetOnFilterChange !== false) {
            // Nếu có resetPageOnFilterChange, kiểm tra xem filter này có cần reset page không
            if (
              !paginationConfig.resetPageOnFilterChange ||
              paginationConfig.resetPageOnFilterChange(String(name))
            ) {
              setPaginationState((prev) => ({ ...prev, page: 1 }));
            }
          }
        });
      }
    },
    [filterConfigs, paginationConfig.resetOnFilterChange]
  );

  const setFilters = useCallback(
    (newFilters: Partial<TFilters>) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      debouncedFilters.current = { ...debouncedFilters.current, ...newFilters };

      // Trigger URL sync
      setUrlSyncTrigger((prev) => prev + 1);

      // Reset pagination if configured
      if (paginationConfig.resetOnFilterChange !== false) {
        // Kiểm tra xem có filter nào cần reset page không
        const shouldResetPage =
          !paginationConfig.resetPageOnFilterChange ||
          Object.keys(newFilters).some(
            (key) =>
              paginationConfig.resetPageOnFilterChange &&
              paginationConfig.resetPageOnFilterChange(key)
          );

        if (shouldResetPage) {
          setPaginationState((prev) => ({ ...prev, page: 1 }));
        }
      }
    },
    [paginationConfig.resetOnFilterChange]
  );

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    debouncedFilters.current = defaultFilters;

    // Trigger URL sync
    setUrlSyncTrigger((prev) => prev + 1);

    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, [defaultFilters]);

  const resetFilter = useCallback(
    (name: keyof TFilters) => {
      const defaultValue = (defaultFilters as any)[name];
      setFilterValue(name, defaultValue);
    },
    [defaultFilters, setFilterValue]
  );

  // Pagination functions
  const setPage = useCallback((page: number) => {
    setPaginationState((prev) => ({ ...prev, page }));
    setUrlSyncTrigger((prev) => prev + 1);
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPaginationState((prev) => ({
      ...prev,
      pageSize,
      page: 1,
    }));
    setUrlSyncTrigger((prev) => prev + 1);
  }, []);

  const nextPage = useCallback(() => {
    setPaginationState((prev) => {
      if (prev.hasNextPage) {
        setUrlSyncTrigger((p) => p + 1);
        return { ...prev, page: prev.page + 1 };
      }
      return prev;
    });
  }, []);

  const previousPage = useCallback(() => {
    setPaginationState((prev) => {
      if (prev.hasPreviousPage) {
        setUrlSyncTrigger((p) => p + 1);
        return { ...prev, page: prev.page - 1 };
      }
      return prev;
    });
  }, []);

  // Sort functions
  const setSort = useCallback((field: string, direction: 'asc' | 'desc' = 'asc') => {
    setSortState({ field, direction });
    setUrlSyncTrigger((prev) => prev + 1);
  }, []);

  const toggleSort = useCallback((field: string) => {
    setSortState((prev) => {
      if (!prev || prev.field !== field) {
        setUrlSyncTrigger((p) => p + 1);
        return { field, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        setUrlSyncTrigger((p) => p + 1);
        return { field, direction: 'desc' };
      }
      setUrlSyncTrigger((p) => p + 1);
      return undefined;
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortState(undefined);
    setUrlSyncTrigger((prev) => prev + 1);
  }, []);

  // Utility functions
  const getActiveFiltersCount = useCallback(() => {
    // @ts-ignore
    return Object.entries(filters).reduce((count, [key, value]) => {
      const config = filterConfigs.find((c) => c.name === key);
      if (isFilterActive(value, config?.defaultValue)) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [filters, filterConfigs]);

  const hasActiveFilters = useCallback(() => {
    return getActiveFiltersCount() > 0;
  }, [getActiveFiltersCount]);

  const getQueryKey = useCallback(() => queryKey, [queryKey]);

  // Preset management
  const presetMethods = useMemo(() => {
    if (!enablePresets) return undefined;

    return {
      savePreset: (name: string) => {
        const newPreset: FilterPreset = {
          id: Date.now().toString(),
          name,
          filters: filters as Record<string, any>,
          createdAt: new Date(),
        };
        setPresets((prev) => [...prev, newPreset]);

        try {
          const key = `filterPilot_presets_${fetchConfig.queryKey || 'default'}`;
          localStorage.setItem(key, JSON.stringify([...presets, newPreset]));
        } catch (error) {
          console.error('Error saving preset:', error);
        }
      },
      loadPreset: (preset: FilterPreset) => {
        setFilters(preset.filters as Partial<TFilters>);
      },
      deletePreset: (id: string) => {
        setPresets((prev) => prev.filter((p) => p.id !== id));

        try {
          const key = `filterPilot_presets_${fetchConfig.queryKey || 'default'}`;
          const updatedPresets = presets.filter((p) => p.id !== id);
          localStorage.setItem(key, JSON.stringify(updatedPresets));
        } catch (error) {
          console.error('Error deleting preset:', error);
        }
      },
      getPresets: () => presets,
    };
  }, [enablePresets, filters, presets, setFilters, fetchConfig.queryKey]);

  // Load presets from localStorage on mount
  useEffect(() => {
    if (enablePresets) {
      try {
        const key = `filterPilot_presets_${fetchConfig.queryKey || 'default'}`;
        const savedPresets = localStorage.getItem(key);
        if (savedPresets) {
          setPresets(JSON.parse(savedPresets));
        }
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    }
  }, [enablePresets, fetchConfig.queryKey]);

  const stableFilterHandlers = useMemo(
    () => ({
      setFilterValue,
      setFilters,
      resetFilters,
      resetFilter,
    }),
    [setFilterValue, setFilters, resetFilters, resetFilter]
  );

  return {
    // Filter state
    filters,
    ...stableFilterHandlers,

    // Pagination state
    pagination,
    setPage,
    setPageSize,
    nextPage,
    previousPage,

    // Sort state
    sort,
    setSort,
    toggleSort,
    clearSort,

    // Data & Query state
    data: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error || undefined,
    isFetching: query.isFetching,
    refetch: query.refetch,

    // Preset management
    presets: presetMethods,

    // Utilities
    getActiveFiltersCount,
    hasActiveFilters,
    getQueryKey,

    // Fetch control
    fetchControl: {
      isEnabled: shouldFetch,
      reason: fetchReason,
      retry: query.refetch,
    },
  };
}
