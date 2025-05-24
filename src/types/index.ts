export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | RangeValue
  | Record<string, any>
  | null
  | undefined;

export interface RangeValue {
  min?: number | Date | string;
  max?: number | Date | string;
}

export interface FilterConfig {
  name: string;
  defaultValue?: any;
  urlKey?: string;
  debounceMs?: number;
  transformToUrl?: (value: any) => string;
  transformFromUrl?: (value: string) => any;
  transformForApi?: (value: any) => any;
}

export interface PaginationConfig {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  syncWithUrl?: boolean;
  resetOnFilterChange?: boolean;
  external?: boolean;
}

export interface SortConfig {
  initialSortField?: string;
  initialSortDirection?: 'asc' | 'desc';
  syncWithUrl?: boolean;
  multiSort?: boolean;
}

export interface FetchParams<TFilters = Record<string, any>> {
  filters: TFilters;
  pagination: {
    page: number;
    pageSize: number;
  };
  sort?:
    | {
        field: string;
        direction: 'asc' | 'desc';
      }
    | Array<{
        field: string;
        direction: 'asc' | 'desc';
      }>;
}

export interface FetchResult<TData> {
  data: TData[];
  totalRecords: number;
  meta?: Record<string, any>;
}

export interface FetchConfig<TData, TFilters = Record<string, any>> {
  fetchFn: (params: FetchParams<TFilters>) => Promise<FetchResult<TData>>;
  queryKey?: string;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number; // gcTime in v5
  gcTime?: number; // v5 naming
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  refetchIntervalInBackground?: boolean;
  onSuccess?: (data: FetchResult<TData>) => void;
  onError?: (error: Error) => void;
  // Additional TanStack Query options
  select?: (data: FetchResult<TData>) => FetchResult<TData>;
  placeholderData?:
    | FetchResult<TData>
    | ((previousData?: FetchResult<TData>) => FetchResult<TData>);
  initialData?: FetchResult<TData> | (() => FetchResult<TData>);
  initialDataUpdatedAt?: number | (() => number | undefined);
  retry?: boolean | number | ((failureCount: number, error: Error) => boolean);
  retryDelay?: number | ((attemptIndex: number, error: Error) => number);
  networkMode?: 'online' | 'always' | 'offlineFirst';
  suspense?: boolean;
  useErrorBoundary?: boolean | ((error: Error) => boolean);
  meta?: Record<string, unknown>;
  queryKeyHashFn?: (queryKey: unknown[]) => string;
  structuralSharing?: boolean | ((oldData: unknown, newData: unknown) => unknown);
}

export interface UrlHandler {
  getParams: () => URLSearchParams;
  setParams: (params: URLSearchParams) => void;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface UseFilterPilotOptions<TData, TFilters = Record<string, any>> {
  filterConfigs: FilterConfig[];
  paginationConfig?: PaginationConfig;
  sortConfig?: SortConfig;
  fetchConfig: FetchConfig<TData, TFilters>;
  urlHandler?: UrlHandler;
  initialFiltersProvider?: () => Promise<Partial<TFilters>>;
  enablePresets?: boolean;
}

export interface UseFilterPilotResult<TData, TFilters = Record<string, any>> {
  // Filter state
  filters: TFilters;
  setFilterValue: (name: keyof TFilters, value: any) => void;
  setFilters: (filters: Partial<TFilters>) => void;
  resetFilters: () => void;
  resetFilter: (name: keyof TFilters) => void;

  // Pagination state
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Sort state
  sort?: SortState | SortState[];
  setSort: (field: string, direction?: 'asc' | 'desc') => void;
  toggleSort: (field: string) => void;
  clearSort: () => void;

  // Data & Query state
  data?: TData[];
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  isFetching: boolean;
  refetch: () => void;

  // Preset management
  presets?: {
    savePreset: (name: string) => void;
    loadPreset: (preset: FilterPreset) => void;
    deletePreset: (id: string) => void;
    getPresets: () => FilterPreset[];
  };

  // Utilities
  getActiveFiltersCount: () => number;
  hasActiveFilters: () => boolean;
  getQueryKey: () => unknown[];
}

// Additional types for query params
export interface QueryParams {
  [key: string]: string | string[] | undefined;
}
