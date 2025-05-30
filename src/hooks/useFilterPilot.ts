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
import { normalizeQueryKey } from '../utils/normalize';

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

  // URL handler - Stable reference
  const defaultUrlHandler = useDefaultUrlHandler();
  const urlHandler = useMemo(() => providedUrlHandler || defaultUrlHandler, [providedUrlHandler]);

  // Default values - Memoized for stability
  const defaultFilters = useMemo(
    () => getDefaultFilters(filterConfigs) as TFilters,
    [filterConfigs]
  );

  const defaultPagination: PaginationState = useMemo(() => ({
    page: paginationConfig.initialPage || 1,
    pageSize: paginationConfig.initialPageSize || 10,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  }), [paginationConfig.initialPage, paginationConfig.initialPageSize]);

  const defaultSort: SortState | undefined = useMemo(() => 
    sortConfig.initialSortField
      ? {
          field: sortConfig.initialSortField,
          direction: sortConfig.initialSortDirection || 'asc',
        }
      : undefined,
    [sortConfig.initialSortField, sortConfig.initialSortDirection]
  );

  // State
  const [filters, setFiltersState] = useState<TFilters>(defaultFilters);
  const [pagination, setPaginationState] = useState<PaginationState>(defaultPagination);
  const [sort, setSortState] = useState<SortState | undefined>(defaultSort);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  
  const [debouncedFilters, setDebouncedFilters] = useState<TFilters>(defaultFilters);

  // Refs for debouncing
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const isInitialized = useRef(false);

  // Memoize all param keys that this hook manages to avoid conflicts
  const managedParamKeys = useMemo(() => {
    const keys = new Set<string>();
    
    // Add filter param keys
    filterConfigs.forEach((config) => {
      const urlKey = config.urlKey || config.name;
      keys.add(urlKey);
    });
    
    // Add pagination param keys
    if (paginationConfig.syncWithUrl !== false) {
      keys.add('page');
      keys.add('pageSize');
    }
    
    // Add sort param keys
    if (sortConfig.syncWithUrl !== false) {
      keys.add('sortBy');
      keys.add('sortOrder');
    }
    
    return keys;
  }, [filterConfigs, paginationConfig.syncWithUrl, sortConfig.syncWithUrl]);

  // Initialize from URL on mount
  useEffect(() => {
    if (isInitialized.current) return;

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
      setDebouncedFilters(finalFilters);

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

      isInitialized.current = true;
    };

    initializeFromUrl();
  }, []); // Only run on mount

  const syncUrlWithValues = useCallback((
    newFilters?: TFilters,
    newPagination?: Partial<PaginationState>, 
    newSort?: SortState | undefined
  ) => {
    if (!isInitialized.current) return;

    const params = urlHandler.getParams();
    
    // Use provided values or current state
    const currentFilters = newFilters !== undefined ? newFilters : debouncedFilters;
    const currentPagination = newPagination ? { ...pagination, ...newPagination } : pagination;
    const currentSort = newSort !== undefined ? newSort : sort;

    // Clear managed params
    managedParamKeys.forEach((key) => {
      params.delete(key);
    });

    // Set filter params
    // @ts-ignore
    const filterParams = buildUrlParams(currentFilters, filterConfigs);
    filterParams.forEach((value, key) => {
      const config = filterConfigs.find((c) => c.urlKey === key || c.name === key);
      if (config?.syncWithUrl !== false) {
        params.set(key, value);
      }
    });

    // Set pagination params
    if (paginationConfig.syncWithUrl !== false) {
      params.set('page', String(currentPagination.page));
      params.set('pageSize', String(currentPagination.pageSize));
    }

    // Set sort params
    if (sortConfig.syncWithUrl !== false && currentSort) {
      params.set('sortBy', currentSort.field);
      params.set('sortOrder', currentSort.direction);
    }

    urlHandler.setParams(params);
  }, [filterConfigs, paginationConfig.syncWithUrl, sortConfig.syncWithUrl, urlHandler, pagination, sort, debouncedFilters, managedParamKeys]);

  // Separate debounced sync for API calls only (not URL)
  const triggerDebouncedApiCall = useCallback((filterName: string, value: any) => {
    const config = filterConfigs.find((c) => c.name === filterName);
    
    if (config?.debounceMs) {
      if (debounceTimers.current[filterName]) {
        clearTimeout(debounceTimers.current[filterName]);
      }

      debounceTimers.current[filterName] = setTimeout(() => {
        setDebouncedFilters((prev) => ({
          ...prev,
          [filterName]: value,
        }));

        // Reset pagination if configured
        if (paginationConfig.resetOnFilterChange !== false) {
          if (
            !paginationConfig.resetPageOnFilterChange ||
            paginationConfig.resetPageOnFilterChange(filterName)
          ) {
            setPaginationState((prev) => ({ ...prev, page: 1 }));
          }
        }
      }, config.debounceMs);
    } else {
      // No debouncing, update immediately
      setDebouncedFilters((prev) => ({
        ...prev,
        [filterName]: value,
      }));

      // Reset pagination if configured
      if (paginationConfig.resetOnFilterChange !== false) {
        if (
          !paginationConfig.resetPageOnFilterChange ||
          paginationConfig.resetPageOnFilterChange(filterName)
        ) {
          setPaginationState((prev) => ({ ...prev, page: 1 }));
        }
      }
    }
  }, [filterConfigs, paginationConfig.resetOnFilterChange, paginationConfig.resetPageOnFilterChange]);

  // Query key with proper dependencies
  const queryKey = useMemo(() => {
    const baseKey = normalizeQueryKey(fetchConfig.queryKey);
    
    // Create stable objects for comparison
    const stableFilters = JSON.stringify(debouncedFilters);
    const stablePagination = JSON.stringify({
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    const stableSort = JSON.stringify(sort);
    
    return [
      ...baseKey,
      'filters',
      stableFilters,
      'pagination', 
      stablePagination,
      'sort',
      stableSort,
    ];
  }, [
    fetchConfig.queryKey,
    debouncedFilters,
    pagination.page,
    pagination.pageSize,
    sort,
  ]);

  // Fetch control
  const { shouldFetch, fetchReason, controlledFetch } = useFetchControl(
    debouncedFilters,
    options.fetchControl
  );

  // Fetch function
  const fetchData = useCallback(async () => {
    const params: FetchParams<TFilters> = {
      filters: debouncedFilters,
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
  }, [debouncedFilters, pagination.page, pagination.pageSize, sort, filterConfigs, fetchConfig.fetchFn, controlledFetch]);

  // Query
  const query = useQuery<FetchResult<TData>, Error, FetchResult<TData>, unknown[]>({
    queryKey,
    queryFn: fetchData,
    enabled: fetchConfig.enabled !== false && shouldFetch && isInitialized.current,
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

  // Handle success/error with useEffect
  const lastTotalRecords = useRef<number>();
  useEffect(() => {
    if (query.isSuccess && query.data && lastTotalRecords.current !== query.data.totalRecords) {
      lastTotalRecords.current = query.data.totalRecords;
      setPaginationState((prev) => ({
        ...prev,
        totalRecords: query.data.totalRecords,
        totalPages: Math.ceil(query.data.totalRecords / prev.pageSize),
        hasNextPage: prev.page < Math.ceil(query.data.totalRecords / prev.pageSize),
        hasPreviousPage: prev.page > 1,
      }));

      fetchConfig.onSuccess?.(query.data);
    }
  }, [query.isSuccess, query.data?.totalRecords, fetchConfig.onSuccess]);

  useEffect(() => {
    if (query.isError && query.error) {
      fetchConfig.onError?.(query.error);
    }
  }, [query.isError, query.error, fetchConfig.onError]);

  // Filter functions with immediate URL sync
  const setFilterValue = useCallback(
    (name: keyof TFilters, value: any) => {
      // Update UI state immediately
      const newFilters = {
        ...filters,
        [name]: value,
      } as TFilters;
      
      setFiltersState(newFilters);

      // Sync URL immediately with new filter value
      syncUrlWithValues(newFilters);

      // Trigger debounced API call
      triggerDebouncedApiCall(String(name), value);
    },
    [filters, syncUrlWithValues, triggerDebouncedApiCall]
  );

  const setFilters = useCallback(
    (newFilters: Partial<TFilters>) => {
      const updatedFilters = { ...filters, ...newFilters } as TFilters;
      
      setFiltersState(updatedFilters);

      // Sync URL immediately with new filters
      syncUrlWithValues(updatedFilters);

      // Update debounced filters immediately (no individual debouncing for batch updates)
      setDebouncedFilters(updatedFilters);

      // Reset pagination if configured
      if (paginationConfig.resetOnFilterChange !== false) {
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
    [filters, syncUrlWithValues, paginationConfig.resetOnFilterChange, paginationConfig.resetPageOnFilterChange]
  );

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setDebouncedFilters(defaultFilters);

    // Sync URL immediately with reset filters
    syncUrlWithValues(defaultFilters);
    
    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, [defaultFilters, syncUrlWithValues]);

  const resetFilter = useCallback(
    (name: keyof TFilters) => {
      const defaultValue = (defaultFilters as any)[name];
      setFilterValue(name, defaultValue);
    },
    [defaultFilters, setFilterValue]
  );

  // Pagination functions - use unified sync function
  const setPage = useCallback((page: number) => {
    setPaginationState((prev) => ({ ...prev, page }));
    syncUrlWithValues(undefined, { page });
  }, [syncUrlWithValues]);

  const setPageSize = useCallback((pageSize: number) => {
    const newPagination = { pageSize, page: 1 };
    setPaginationState((prev) => ({ ...prev, ...newPagination }));
    syncUrlWithValues(undefined, newPagination);
  }, [syncUrlWithValues]);

  const nextPage = useCallback(() => {
    setPaginationState((prev) => {
      if (prev.hasNextPage) {
        const newPage = prev.page + 1;
        syncUrlWithValues(undefined, { page: newPage });
        return { ...prev, page: newPage };
      }
      return prev;
    });
  }, [syncUrlWithValues]);

  const previousPage = useCallback(() => {
    setPaginationState((prev) => {
      if (prev.hasPreviousPage) {
        const newPage = prev.page - 1;
        syncUrlWithValues(undefined, { page: newPage });
        return { ...prev, page: newPage };
      }
      return prev;
    });
  }, [syncUrlWithValues]);

  // Sort functions - use unified sync function
  const setSort = useCallback((field: string, direction: 'asc' | 'desc' = 'asc') => {
    const newSort = { field, direction };
    setSortState(newSort);
    syncUrlWithValues(undefined, undefined, newSort);
  }, [syncUrlWithValues]);

  const toggleSort = useCallback((field: string) => {
    setSortState((prev) => {
      let newState: SortState | undefined;
      if (!prev || prev.field !== field) {
        newState = { field, direction: 'asc' };
      } else if (prev.direction === 'asc') {
        newState = { field, direction: 'desc' };
      } else {
        newState = undefined;
      }
      
      syncUrlWithValues(undefined, undefined, newState);
      return newState;
    });
  }, [syncUrlWithValues]);

  const clearSort = useCallback(() => {
    setSortState(undefined);
    syncUrlWithValues(undefined, undefined, undefined);
  }, [syncUrlWithValues]);

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

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

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