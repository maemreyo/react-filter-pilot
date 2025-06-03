import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UseFilterPilotOptions, FetchParams, FetchResult, SortState, FilterPreset } from '../types';
import {
  getDefaultFilters,
  isFilterActive,
  parseUrlParams,
  buildUrlParams,
  transformFilterValue,
  mergeFilters,
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
  data: TData[]; // Flattened data from pages
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
      debouncedFilters.current = finalFilters; // Sync debouncedFilters immediately

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
      // Mark as initialized, so the URL sync effect can run from the next change.
      // Important: setUrlSyncTrigger(1) would cause the URL sync effect to run immediately after initialization,
      // which might not be desired if you only want it to run on user interaction.
      // If you only want it to run when filters/sort change *after* initialization, this line is not needed.
      // Or, you might want more complex logic to decide when to sync for the first time.
      // To be consistent with useFilterPilot, we won't trigger here, but let the set... functions trigger.
    };

    initializeFromUrl();
  }, []); // Only run on mount

  // Sync to URL when state changes
  // Sync to URL when state changes
  useEffect(() => {
    // Skip on initial mount if urlSyncTrigger is still 0
    if (urlSyncTrigger === 0) {
      console.log('[useFilterPilotInfinite] Skipping initial URL sync (urlSyncTrigger === 0)');
      return;
    }
    console.log('[useFilterPilotInfinite] Performing URL sync, trigger:', urlSyncTrigger);

    const params = urlHandler.getParams();
    // @ts-ignore
    const filterParams = buildUrlParams(debouncedFilters.current, filterConfigs);

    // Clear existing filter params - CHỈ những filter sync với URL
    filterConfigs.forEach((config) => {
      if (config.syncWithUrl !== false) {
        const urlKey = config.urlKey || config.name;
        params.delete(urlKey);
      }
    });

    // Set new filter params - CHỈ những filter sync với URL
    filterParams.forEach((value, key) => {
      const config = filterConfigs.find((c) => c.urlKey === key || c.name === key);
      if (config?.syncWithUrl !== false) {
        params.set(key, value);
      }
    });

    // Add sort params
    if (sortConfig.syncWithUrl !== false && sort) {
      params.set('sortBy', sort.field);
      params.set('sortOrder', sort.direction);
    } else if (sortConfig.syncWithUrl !== false) {
      // Clear sort params if sort is cleared and sync is enabled
      params.delete('sortBy');
      params.delete('sortOrder');
    }

    urlHandler.setParams(params);
  }, [urlSyncTrigger, sort, filterConfigs, sortConfig.syncWithUrl, urlHandler]);

  // Query key
  const queryKey = useMemo(
    () => [
      fetchConfig.queryKey || 'filterPilotInfinite',
      'filters',
      debouncedFilters.current, // Keep debouncedFilters.current here as the query should depend on the debounced value
      'sort',
      sort,
      // urlSyncTrigger could be added here if you want the queryKey to change every time the URL is synced,
      // but usually, the queryKey should only depend on parameters that actually affect data fetching.
      // If debouncedFilters.current is updated correctly before urlSyncTrigger increments, it's not needed.
    ],
    [debouncedFilters.current, sort, fetchConfig.queryKey, urlSyncTrigger] // Add urlSyncTrigger to ensure queryKey updates
  );

  // Fetch function
  const fetchData = useCallback(
    async ({ pageParam }: { pageParam?: unknown }) => {
      const params: FetchParams<TFilters> & { cursor?: string | number | null } = {
        filters: debouncedFilters.current,
        pagination: {
          // Pagination is not really used for URL sync in infinite, but needed for API
          page: 1,
          pageSize: 20, // Default page size or from config if available
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
      console.log('[useFilterPilotInfinite] Fetching data with params:', transformedParams);
      return fetchConfig.fetchFn(transformedParams);
    },
    [sort, filterConfigs, fetchConfig.fetchFn, debouncedFilters.current] // Add debouncedFilters.current
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
          pages: data.pages.map((page) => fetchConfig.select!(page as InfiniteResult<TData>)), // Need to cast page type
        })
      : undefined,
    retry: fetchConfig.retry,
    retryDelay: fetchConfig.retryDelay,
    networkMode: fetchConfig.networkMode,
    meta: fetchConfig.meta,
  });

  // Handle success/error
  useEffect(() => {
    if (query.isSuccess && query.data) {
      // @ts-ignore
      fetchConfig.onSuccess?.(query.data.pages[query.data.pages.length - 1]);
    }
  }, [query.isSuccess, query.data, fetchConfig.onSuccess]);

  useEffect(() => {
    if (query.isError && query.error) {
      fetchConfig.onError?.(query.error);
    }
  }, [query.isError, query.error, fetchConfig.onError]);

  // Filter functions
  const setFilterValue = useCallback(
    (name: keyof TFilters, value: any) => {
      const config = filterConfigs.find((c) => c.name === String(name));

      setFiltersState((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (config?.debounceMs) {
        if (debounceTimers.current[String(name)]) {
          clearTimeout(debounceTimers.current[String(name)]);
        }
        debounceTimers.current[String(name)] = setTimeout(() => {
          debouncedFilters.current = {
            ...debouncedFilters.current,
            [name]: value,
          };
          setUrlSyncTrigger((prev) => prev + 1); // Trigger URL sync
        }, config.debounceMs);
      } else {
        debouncedFilters.current = {
          ...debouncedFilters.current,
          [name]: value,
        };
        setUrlSyncTrigger((prev) => prev + 1); // Trigger URL sync
      }
    },
    [filterConfigs] // No need for urlSyncTrigger here
  );

  const setFilters = useCallback(
    (newFilters: Partial<TFilters>) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      debouncedFilters.current = { ...debouncedFilters.current, ...newFilters };
      setUrlSyncTrigger((prev) => prev + 1); // Trigger URL sync
    },
    [] // No need for urlSyncTrigger here
  );

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    debouncedFilters.current = defaultFilters;
    setUrlSyncTrigger((prev) => prev + 1); // Trigger URL sync
  }, [defaultFilters]);

  const resetFilter = useCallback(
    (name: keyof TFilters) => {
      const defaultValue = (defaultFilters as any)[name];
      // setFilterValue will automatically trigger URL sync
      setFilterValue(name, defaultValue);
    },
    [defaultFilters, setFilterValue]
  );

  // Sort functions
  const setSort = useCallback((field: string, direction: 'asc' | 'desc' = 'asc') => {
    setSortState({ field, direction });
    setUrlSyncTrigger((prev) => prev + 1); // Trigger URL sync
  }, []);

  const toggleSort = useCallback((field: string) => {
    setSortState((prev) => {
      if (!prev || prev.field !== field) {
        setUrlSyncTrigger((p) => p + 1); // Trigger URL sync
        return { field, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        setUrlSyncTrigger((p) => p + 1); // Trigger URL sync
        return { field, direction: 'desc' };
      }
      setUrlSyncTrigger((p) => p + 1); // Trigger URL sync (when clearing sort)
      return undefined;
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortState(undefined);
    setUrlSyncTrigger((prev) => prev + 1); // Trigger URL sync
  }, []);

  // Utilities
  const hasActiveFilters = useCallback(() => {
    // @ts-ignore
    return Object.entries(filters).some(([key, value]) => {
      const config = filterConfigs.find((c) => c.name === key);
      return isFilterActive(value, config?.defaultValue);
    });
  }, [filters, filterConfigs]);

  const getActiveFiltersCount = useCallback(() => {
    // @ts-ignore
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
          filters: filters as Record<string, any>, // current filters, not debounced
          createdAt: new Date(),
        };
        setPresets((prev) => [...prev, newPreset]);
        try {
          const key = `filterPilot_presets_${fetchConfig.queryKey || 'defaultInfinite'}`;
          localStorage.setItem(key, JSON.stringify([...presets, newPreset]));
        } catch (error) {
          console.error('Error saving preset:', error);
        }
      },
      loadPreset: (preset: FilterPreset) => {
        // setFilters will automatically trigger URL sync
        setFilters(preset.filters as Partial<TFilters>);
      },
      deletePreset: (id: string) => {
        const updatedPresets = presets.filter((p) => p.id !== id);
        setPresets(updatedPresets);
        try {
          const key = `filterPilot_presets_${fetchConfig.queryKey || 'defaultInfinite'}`;
          localStorage.setItem(key, JSON.stringify(updatedPresets));
        } catch (error) {
          console.error('Error deleting preset:', error);
        }
      },
      getPresets: () => presets,
    };
  }, [enablePresets, filters, presets, setFilters, fetchConfig.queryKey]); // `setFilters` is a dependency

  // Load presets from localStorage on mount
  useEffect(() => {
    if (enablePresets) {
      try {
        const key = `filterPilot_presets_${fetchConfig.queryKey || 'defaultInfinite'}`;
        const savedPresets = localStorage.getItem(key);
        if (savedPresets) {
          setPresets(JSON.parse(savedPresets));
        }
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    }
  }, [enablePresets, fetchConfig.queryKey]);

  // Flatten data from pages
  const data = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.data) || [];
  }, [query.data]);

  const totalRecords = useMemo(() => {
    const lastPage = query.data?.pages[query.data.pages.length - 1];
    return lastPage?.totalRecords || 0;
  }, [query.data]);

  return {
    filters,
    setFilterValue,
    setFilters,
    resetFilters,
    resetFilter,
    sort,
    setSort,
    toggleSort,
    clearSort,
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    // @ts-ignore
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
    hasActiveFilters,
    getActiveFiltersCount,
    getQueryKey: () => queryKey,
    presets: presetMethods,
  };
}
