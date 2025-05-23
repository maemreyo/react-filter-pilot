import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UseFilterPilotOptions,
  UseFilterPilotResult,
  FilterConfig,
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
  compareFilters,
  parseUrlParams,
  buildUrlParams,
  transformFilterValue,
  debounce,
} from '../utils';
import { useDefaultUrlHandler } from './useUrlHandler';

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

  // Query client
  const queryClient = useQueryClient();

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
          initialFilters = mergeFilters(providedFilters, defaultFilters) as TFilters;
        } catch (error) {
          console.error('Error loading initial filters:', error);
        }
      }

      // Merge URL filters with initial filters
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

  // Sync filters to URL
  useEffect(() => {
    if (!compareFilters(debouncedFilters.current, filters)) {
      const params = urlHandler.getParams();
      const filterParams = buildUrlParams(debouncedFilters.current, filterConfigs);
      
      // Clear existing filter params
      filterConfigs.forEach((config) => {
        const urlKey = config.urlKey || config.name;
        params.delete(urlKey);
      });

      // Set new filter params
      filterParams.forEach((value, key) => {
        params.set(key, value);
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
      }

      urlHandler.setParams(params);
    }
  }, [debouncedFilters.current, pagination, sort]);

  // Query key
  const queryKey = useMemo(
    () => [
      fetchConfig.queryKey || 'filterPilot',
      'filters',
      debouncedFilters.current,
      'pagination',
      pagination,
      'sort',
      sort,
    ],
    [debouncedFilters.current, pagination, sort, fetchConfig.queryKey]
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
      const transformedValue = transformFilterValue(
        value,
        config?.transformForApi
      );
      (transformedParams.filters as any)[key] = transformedValue;
    });

    return fetchConfig.fetchFn(transformedParams);
  }, [pagination, sort, filterConfigs, fetchConfig.fetchFn]);

  // Query
  const query = useQuery<FetchResult<TData>, Error>({
    queryKey,
    queryFn: fetchData,
    enabled: fetchConfig.enabled !== false,
    staleTime: fetchConfig.staleTime,
    cacheTime: fetchConfig.cacheTime,
    refetchOnWindowFocus: fetchConfig.refetchOnWindowFocus,
    refetchInterval: fetchConfig.refetchInterval,
    onSuccess: (data) => {
      // Update pagination state with total records
      setPaginationState((prev) => ({
        ...prev,
        totalRecords: data.totalRecords,
        totalPages: Math.ceil(data.totalRecords / prev.pageSize),
        hasNextPage: prev.page < Math.ceil(data.totalRecords / prev.pageSize),
        hasPreviousPage: prev.page > 1,
      }));

      fetchConfig.onSuccess?.(data);
    },
    onError: fetchConfig.onError,
  });

  // Filter functions
  const setFilterValue = useCallback(
    (name: keyof TFilters, value: any) => {
      const config = filterConfigs.find((c) => c.name === String(name));
      
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
          debouncedFilters.current = {
            ...debouncedFilters.current,
            [name]: value,
          };

          // Reset pagination if configured
          if (paginationConfig.resetOnFilterChange !== false) {
            setPaginationState((prev) => ({ ...prev, page: 1 }));
          }
        }, config.debounceMs);
      } else {
        // No debouncing, update immediately
        debouncedFilters.current = {
          ...debouncedFilters.current,
          [name]: value,
        };

        // Reset pagination if configured
        if (paginationConfig.resetOnFilterChange !== false) {
          setPaginationState((prev) => ({ ...prev, page: 1 }));
        }
      }
    },
    [filterConfigs, paginationConfig.resetOnFilterChange]
  );

  const setFilters = useCallback(
    (newFilters: Partial<TFilters>) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      debouncedFilters.current = { ...debouncedFilters.current, ...newFilters };

      // Reset pagination if configured
      if (paginationConfig.resetOnFilterChange !== false) {
        setPaginationState((prev) => ({ ...prev, page: 1 }));
      }
    },
    [paginationConfig.resetOnFilterChange]
  );

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    debouncedFilters.current = defaultFilters;
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
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPaginationState((prev) => ({ 
      ...prev, 
      pageSize,
      page: 1, // Reset to first page when changing page size
    }));
  }, []);

  const nextPage = useCallback(() => {
    setPaginationState((prev) => {
      if (prev.hasNextPage) {
        return { ...prev, page: prev.page + 1 };
      }
      return prev;
    });
  }, []);

  const previousPage = useCallback(() => {
    setPaginationState((prev) => {
      if (prev.hasPreviousPage) {
        return { ...prev, page: prev.page - 1 };
      }
      return prev;
    });
  }, []);

  // Sort functions
  const setSort = useCallback(
    (field: string, direction: 'asc' | 'desc' = 'asc') => {
      setSortState({ field, direction });
    },
    []
  );

  const toggleSort = useCallback(
    (field: string) => {
      setSortState((prev) => {
        if (!prev || prev.field !== field) {
          return { field, direction: 'asc' };
        }
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        }
        return undefined; // Remove sort
      });
    },
    []
  );

  const clearSort = useCallback(() => {
    setSortState(undefined);
  }, []);

  // Utility functions
  const getActiveFiltersCount = useCallback(() => {
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
        
        // Save to localStorage
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
        
        // Update localStorage
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

  return {
    // Filter state
    filters,
    setFilterValue,
    setFilters,
    resetFilters,
    resetFilter,

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
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,

    // Preset management
    presets: presetMethods,

    // Utilities
    getActiveFiltersCount,
    hasActiveFilters,
    getQueryKey,
  };
}