import { UseFilterPilotResult, FilterPreset } from '../types';

/**
 * Create a mock filter pilot result for testing
 */
export function createMockFilterPilot<TData, TFilters>(
  initialData: TData[] = [],
  initialFilters: TFilters,
  overrides: Partial<UseFilterPilotResult<TData, TFilters>> = {}
): UseFilterPilotResult<TData, TFilters> {
  return {
    // Filter state
    filters: initialFilters,
    setFilterValue: jest.fn(),
    setFilters: jest.fn(),
    resetFilters: jest.fn(),
    resetFilter: jest.fn(),
    
    // Pagination state
    pagination: {
      page: 1,
      pageSize: 10,
      totalPages: Math.ceil(initialData.length / 10),
      totalRecords: initialData.length,
      hasNextPage: initialData.length > 10,
      hasPreviousPage: false,
    },
    setPage: jest.fn(),
    setPageSize: jest.fn(),
    nextPage: jest.fn(),
    previousPage: jest.fn(),
    
    // Sort state
    sort: undefined,
    setSort: jest.fn(),
    toggleSort: jest.fn(),
    clearSort: jest.fn(),
    
    // Data & Query state
    data: initialData,
    isLoading: false,
    isError: false,
    error: undefined,
    isFetching: false,
    refetch: jest.fn(),
    
    // Preset management
    presets: {
      savePreset: jest.fn(),
      loadPreset: jest.fn(),
      deletePreset: jest.fn(),
      getPresets: jest.fn(() => []),
    },
    
    // Utilities
    getActiveFiltersCount: jest.fn(() => 0),
    hasActiveFilters: jest.fn(() => false),
    getQueryKey: jest.fn(() => ['test', 'filters', initialFilters]),
    
    // Apply overrides
    ...overrides,
  };
}

/**
 * Create a mock URL handler for testing
 */
export function createMockUrlHandler() {
  const params = new URLSearchParams();
  
  return {
    getParams: jest.fn(() => params),
    setParams: jest.fn((newParams: URLSearchParams) => {
      // Clear and copy params
      Array.from(params.keys()).forEach(key => params.delete(key));
      Array.from(newParams.entries()).forEach(([key, value]) => params.set(key, value));
    }),
  };
}

/**
 * Create mock filter presets for testing
 */
export function createMockPresets(count: number = 3): FilterPreset[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `preset-${i + 1}`,
    name: `Preset ${i + 1}`,
    filters: {
      search: `search-${i + 1}`,
      category: `category-${i + 1}`,
    },
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
  }));
}

/**
 * Wait for debounced filter updates
 */
export function waitForDebounce(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock fetch response for testing
 */
export function createMockFetchResponse<TData>(
  data: TData[],
  totalRecords?: number,
  meta?: Record<string, any>
) {
  return Promise.resolve({
    data,
    totalRecords: totalRecords ?? data.length,
    meta,
  });
}

/**
 * Create a test wrapper with providers
 */
export function createTestWrapper(providers: {
  queryClient?: any;
  router?: any;
}) {
  return ({ children }: { children: React.ReactNode }) => {
    let content = children;
    
    if (providers.queryClient) {
      const { QueryClientProvider } = require('@tanstack/react-query');
      content = (
        <QueryClientProvider client={providers.queryClient}>
          {content}
        </QueryClientProvider>
      );
    }
    
    if (providers.router) {
      const { BrowserRouter } = require('react-router-dom');
      content = <BrowserRouter>{content}</BrowserRouter>;
    }
    
    return content;
  };
}