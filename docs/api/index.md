# react-filter-pilot API Reference

## Table of Contents
- [useFilterPilot](#usefilterpilot)
- [URL Handlers](#url-handlers)
- [Types & Interfaces](#types--interfaces)
- [Utilities](#utilities)

## useFilterPilot

The main hook that manages filter state, pagination, sorting, and data fetching.

### Syntax

```typescript
const result = useFilterPilot<TData, TFilters>(options: UseFilterPilotOptions<TData, TFilters>)
```

### Parameters

#### `options: UseFilterPilotOptions<TData, TFilters>`

An object containing the following properties:

##### `filterConfigs: FilterConfig[]`
Array of filter configurations.

```typescript
interface FilterConfig {
  name: string;              // Unique identifier for the filter
  defaultValue?: any;        // Default value when filter is not set
  urlKey?: string;          // Key used in URL (defaults to name)
  debounceMs?: number;      // Debounce delay in milliseconds
  transformToUrl?: (value: any) => string;      // Transform value for URL
  transformFromUrl?: (value: string) => any;    // Transform value from URL
  transformForApi?: (value: any) => any;        // Transform value for API
}
```

##### `paginationConfig?: PaginationConfig`
Configuration for pagination behavior.

```typescript
interface PaginationConfig {
  initialPage?: number;           // Default: 1
  initialPageSize?: number;       // Default: 10
  pageSizeOptions?: number[];     // Default: [10, 20, 50, 100]
  syncWithUrl?: boolean;          // Default: true
  resetOnFilterChange?: boolean;  // Default: true
  external?: boolean;             // Use external pagination state
}
```

##### `sortConfig?: SortConfig`
Configuration for sorting behavior.

```typescript
interface SortConfig {
  initialSortField?: string;
  initialSortDirection?: 'asc' | 'desc';
  syncWithUrl?: boolean;         // Default: true
  multiSort?: boolean;           // Enable multi-column sorting
}
```

##### `fetchConfig: FetchConfig<TData, TFilters>`
Configuration for data fetching.

```typescript
interface FetchConfig<TData, TFilters> {
  fetchFn: (params: FetchParams<TFilters>) => Promise<FetchResult<TData>>;
  queryKey?: string;             // Custom query key prefix
  enabled?: boolean;             // Enable/disable fetching
  staleTime?: number;           // TanStack Query stale time
  cacheTime?: number;           // TanStack Query cache time
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: FetchResult<TData>) => void;
  onError?: (error: Error) => void;
}

interface FetchParams<TFilters> {
  filters: TFilters;
  pagination: {
    page: number;
    pageSize: number;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

interface FetchResult<TData> {
  data: TData[];
  totalRecords: number;
  meta?: Record<string, any>;  // Additional metadata
}
```

##### `urlHandler?: UrlHandler`
Custom URL handler for managing query parameters.

```typescript
interface UrlHandler {
  getParams: () => URLSearchParams;
  setParams: (params: URLSearchParams) => void;
}
```

##### `initialFiltersProvider?: () => Promise<Partial<TFilters>>`
Async function to provide initial filter values.

##### `enablePresets?: boolean`
Enable filter preset functionality. Default: `false`

### Return Value

```typescript
interface UseFilterPilotResult<TData, TFilters> {
  // Filter state
  filters: TFilters;
  setFilterValue: (name: keyof TFilters, value: any) => void;
  setFilters: (filters: Partial<TFilters>) => void;
  resetFilters: () => void;
  resetFilter: (name: keyof TFilters) => void;
  
  // Pagination state
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // Sort state
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
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
  
  // Preset management (if enabled)
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
```

## URL Handlers

### useReactRouterDomUrlHandler

Creates a URL handler for React Router DOM v6+.

```typescript
const urlHandler = useReactRouterDomUrlHandler();
```

**Requirements:**
- Must be used within a React Router context
- Requires `react-router-dom` v6+

### useNextJsUrlHandler

Creates a URL handler for Next.js App Router.

```typescript
const urlHandler = useNextJsUrlHandler();
```

**Requirements:**
- Must be used within Next.js App Router
- Requires Next.js 13+

### Custom URL Handler

You can create a custom URL handler by implementing the `UrlHandler` interface:

```typescript
const customUrlHandler: UrlHandler = {
  getParams: () => {
    // Return current URL parameters
    return new URLSearchParams(window.location.search);
  },
  setParams: (params: URLSearchParams) => {
    // Update URL with new parameters
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, '', newUrl);
  }
};
```

## Types & Interfaces

### FilterValue Types

```typescript
type FilterValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | string[]    // Multi-select
  | number[]    // Multi-select numeric
  | RangeValue  // Range filters
  | null 
  | undefined;

interface RangeValue {
  min?: number | Date | string;
  max?: number | Date | string;
}
```

### FilterPreset

```typescript
interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}
```

### Advanced Filter Types

```typescript
// Date range filter
interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

// Numeric range filter
interface NumericRangeFilter {
  min?: number;
  max?: number;
}

// Multi-select filter
type MultiSelectFilter = string[] | number[];

// Complex object filter
interface ComplexFilter {
  operator: 'AND' | 'OR';
  conditions: FilterCondition[];
}

interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}
```

## Utilities

### transformFilterValue

Utility function to transform filter values.

```typescript
function transformFilterValue(
  value: any,
  transformer?: (value: any) => any
): any
```

### parseUrlParams

Parse URL parameters to filter values.

```typescript
function parseUrlParams(
  params: URLSearchParams,
  filterConfigs: FilterConfig[]
): Record<string, any>
```

### buildUrlParams

Build URL parameters from filter values.

```typescript
function buildUrlParams(
  filters: Record<string, any>,
  filterConfigs: FilterConfig[]
): URLSearchParams
```

### debounce

Debounce utility for filter inputs.

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void }
```

## Error Handling

The hook provides comprehensive error handling:

```typescript
try {
  const result = await fetchFn(params);
  // Success handling
} catch (error) {
  // Error is available in the return value
  // error.message contains the error message
  // onError callback is called if provided
}
```

## Performance Optimization

### Query Key Structure

The query key is structured as:
```typescript
[queryKeyPrefix, 'filters', filters, 'pagination', pagination, 'sort', sort]
```

### Caching Strategy

- Results are cached by TanStack Query based on query key
- Use `staleTime` and `cacheTime` to control caching behavior
- Refetching is triggered when filters change

### Debouncing

Individual filters can be debounced:
```typescript
{
  name: 'search',
  debounceMs: 300  // 300ms debounce
}
```

## Best Practices

1. **Filter Naming**: Use descriptive names that match your API
2. **URL Keys**: Keep URL keys short but meaningful
3. **Debouncing**: Apply debouncing to text inputs (200-500ms)
4. **Pagination Reset**: Enable `resetOnFilterChange` for better UX
5. **Error Handling**: Always provide `onError` callback
6. **Type Safety**: Use TypeScript generics for type-safe filters