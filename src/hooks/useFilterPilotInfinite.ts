import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UseFilterPilotOptions,
  FilterConfig,
  FetchParams,
  FetchResult,
  SortState,
  FilterPreset,
  UrlHandler,
} from '../types';
import {
  getDefaultFilters,
  isFilterActive,
  parseUrlParams,
  buildUrlParams,
  transformFilterValue,
  debounce,
} from '../utils';
import { useDefaultUrlHandler } from './useUrlHandler';

interface InfiniteResult<TData> extends FetchResult<TData> {
  nextCursor?: string | number | null;
  previousCursor?: string | number | null;
}

interface UseFilterPilotInfiniteOptions<TData, TFilters>
  extends Omit<UseFilterPilotOptions<TData, TFilters>, 'paginationConfig' | 'fetchConfig'> {
  fetchConfig: Omit<UseFilterPilotOptions<TData, TFilters>['fetchConfig'], 'fetchFn'> & {
    fetchFn: (
      params: FetchParams<TFilters> & { cursor?: string | number | null }
    ) => Promise<InfiniteResult<TData>>;
    getNextPageParam?: (
      lastPage: InfiniteResult<TData>,
      allPages: InfiniteResult<TData>[]
    ) => string | number | null | undefined;
    getPreviousPageParam?: (
      firstPage: InfiniteResult<TData>,
      allPages: InfiniteResult<TData>[]
    ) => string | number | null | undefined;
    initialPageParam?: string | number | null;
    maxPages?: number;
  };
}

export interface UseFilterPilotInfiniteResult<TData, TFilters> {
  // Filter state
  filters: TFilters;
  setFilterValue: (name: keyof TFilters, value: any) => void;
  setFilters: (filters: Partial<TFilters>) => void;
  resetFilters: () => void;
  resetFilter: (name: keyof TFilters) => void;

  // Sort state
  sort?: SortState;
  setSort: (field: string, direction?: 'asc' | 'desc') => void;
  toggleSort: (field: string) => void;
  clearSort: () => void;

  // Data & Query state
  data: TData[]; // Flattened pages
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
  refetch: () => void;
  totalRecords: number;
  pageParams: unknown[];

  // Utilities
  hasActiveFilters: () => boolean;
  getActiveFiltersCount: () => number;
  getQueryKey: () => unknown[];

  // Presets (if enabled)
  presets?: {
    savePreset: (name: string) => void;
    loadPreset: (preset: FilterPreset) => void;
    deletePreset: (id: string) => void;
    getPresets: () => FilterPreset[];
  };
}

/**
 * Hook for infinite scrolling with filters
 */
export function useFilterPilotInfinite<TData, TFilters = Record<string, any>>(
  options: UseFilterPilotInfiniteOptions<TData, TFilters>
): UseFilterPilotInfiniteResult<TData, TFilters> {
  const {
    filterConfigs,
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

  const defaultSort: SortState | undefined = sortConfig.initialSortField
    ? {
        field: sortConfig.initialSortField,
        direction: sortConfig.initialSortDirection || 'asc',
      }
    : undefined;

  // State
  const [filters, setFiltersState] = useState<TFilters>(defaultFilters);
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
          initialFilters = { ...defaultFilters, ...providedFilters } as TFilters;
        } catch (error) {
          console.error('Error loading initial filters:', error);
        }
      }

      // Merge URL filters with initial filters
      const finalFilters = { ...initialFilters, ...urlFilters } as TFilters;
      setFiltersState(finalFilters);
      debouncedFilters.current = finalFilters;

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
  }, []);

  // Sync to URL
  useEffect(() => {
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

    // Add sort params
    if (sortConfig.syncWithUrl !== false && sort) {
      params.set('sortBy', sort.field);
      params.set('sortOrder', sort.direction);
    }

    urlHandler.setParams(params);
  }, [debouncedFilters.current, sort]);

  // Query key
  const queryKey = useMemo(
    () => [
      fetchConfig.queryKey || 'filterPilotInfinite',
      'filters',
      debouncedFilters.current,
      'sort',
      sort,
    ],
    [debouncedFilters.current, sort, fetchConfig.queryKey]
  );

  // Fetch function
  const fetchData = useCallback(
    async ({ pageParam }: { pageParam?: unknown }) => {
      const params: FetchParams<TFilters> & { cursor?: string | number | null } = {
        filters: debouncedFilters.current,
        pagination: {
          page: 1, // Not used in infinite query
          pageSize: 20, // Default page size for infinite
        },
        sort,
        cursor: pageParam as string | number | null,
      };

      // Transform filters for API
      const transformedParams = { ...params };
      transformedParams.filters = {} as TFilters;

      Object.entries(params.filters as Record<string, any>).forEach(([key, value]) => {
        const config = filterConfigs.find((c) => c.name === key);
        const transformedValue = transformFilterValue(value, config?.transformForApi);
        (transformedParams.filters as any)[key] = transformedValue;
      });

      return fetchConfig.fetchFn(transformedParams);
    },
    [sort, filterConfigs, fetchConfig.fetchFn]
  );

  // Infinite Query
  const query = useInfiniteQuery({
    queryKey,
    queryFn: fetchData,
    enabled: fetchConfig.enabled !== false,
    staleTime: fetchConfig.staleTime,
    gcTime: fetchConfig.gcTime || fetchConfig.cacheTime,
    refetchOnWindowFocus: fetchConfig.refetchOnWindowFocus,
    refetchInterval: fetchConfig.refetchInterval,
    refetchIntervalInBackground: fetchConfig.refetchIntervalInBackground,
    getNextPageParam: fetchConfig.getNextPageParam || ((lastPage) => lastPage.nextCursor),
    getPreviousPageParam:
      fetchConfig.getPreviousPageParam || ((firstPage) => firstPage.previousCursor),
    initialPageParam: fetchConfig.initialPageParam ?? null,
    maxPages: fetchConfig.maxPages,
    select: fetchConfig.select
      ? (data) => ({
          ...data,
          pages: data.pages.map((page) => fetchConfig.select!(page)),
        })
      : undefined,
    retry: fetchConfig.retry,
    retryDelay: fetchConfig.retryDelay,
    networkMode: fetchConfig.networkMode,
    suspense: fetchConfig.suspense,
    useErrorBoundary: fetchConfig.useErrorBoundary,
    meta: fetchConfig.meta,
  });

  // Handle success/error
  useEffect(() => {
    if (query.isSuccess && query.data) {
      fetchConfig.onSuccess?.(query.data.pages[query.data.pages.length - 1]);
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

      setFiltersState((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Handle debouncing
      if (config?.debounceMs) {
        if (debounceTimers.current[String(name)]) {
          clearTimeout(debounceTimers.current[String(name)]);
        }

        debounceTimers.current[String(name)] = setTimeout(() => {
          debouncedFilters.current = {
            ...debouncedFilters.current,
            [name]: value,
          };
        }, config.debounceMs);
      } else {
        debouncedFilters.current = {
          ...debouncedFilters.current,
          [name]: value,
        };
      }
    },
    [filterConfigs]
  );

  const setFilters = useCallback((newFilters: Partial<TFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    debouncedFilters.current = { ...debouncedFilters.current, ...newFilters };
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    debouncedFilters.current = defaultFilters;
  }, [defaultFilters]);

  const resetFilter = useCallback(
    (name: keyof TFilters) => {
      const defaultValue = (defaultFilters as any)[name];
      setFilterValue(name, defaultValue);
    },
    [defaultFilters, setFilterValue]
  );

  // Sort functions
  const setSort = useCallback((field: string, direction: 'asc' | 'desc' = 'asc') => {
    setSortState({ field, direction });
  }, []);

  const toggleSort = useCallback((field: string) => {
    setSortState((prev) => {
      if (!prev || prev.field !== field) {
        return { field, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { field, direction: 'desc' };
      }
      return undefined; // Remove sort
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortState(undefined);
  }, []);

  // Utilities
  const hasActiveFilters = useCallback(() => {
    return Object.entries(filters).some(([key, value]) => {
      const config = filterConfigs.find((c) => c.name === key);
      return isFilterActive(value, config?.defaultValue);
    });
  }, [filters, filterConfigs]);

  const getActiveFiltersCount = useCallback(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      const config = filterConfigs.find((c) => c.name === key);
      return isFilterActive(value, config?.defaultValue) ? count + 1 : count;
    }, 0);
  }, [filters, filterConfigs]);

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

  // Flatten pages data
  const data = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.data) || [];
  }, [query.data]);

  const totalRecords = useMemo(() => {
    const lastPage = query.data?.pages[query.data.pages.length - 1];
    return lastPage?.totalRecords || 0;
  }, [query.data]);

  return {
    // Filter state
    filters,
    setFilterValue,
    setFilters,
    resetFilters,
    resetFilter,

    // Sort state
    sort,
    setSort,
    toggleSort,
    clearSort,

    // Data & Query state
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetchingPreviousPage: query.isFetchingPreviousPage,
    hasNextPage: query.hasNextPage ?? false,
    hasPreviousPage: query.hasPreviousPage ?? false,
    fetchNextPage: query.fetchNextPage,
    fetchPreviousPage: query.fetchPreviousPage,
    refetch: query.refetch,
    totalRecords,
    pageParams: query.data?.pageParams || [],

    // Utilities
    hasActiveFilters,
    getActiveFiltersCount,
    getQueryKey: () => queryKey,

    // Presets
    presets: presetMethods,
  };
}
