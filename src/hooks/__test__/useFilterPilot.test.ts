import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFilterPilot } from '../useFilterPilot';
import { createTestWrapper, waitForDebounce } from '../../test-utils';
import type { ReactNode } from 'react';

describe('useFilterPilot', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    });
    
    wrapper = createTestWrapper({ queryClient });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Filter Management', () => {
    it('should initialize with default filter values', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '' },
              { name: 'category', defaultValue: 'all' },
              { name: 'inStock', defaultValue: false },
            ],
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      expect(result.current.filters).toEqual({
        search: '',
        category: 'all',
        inStock: false,
      });
    });

    it('should update individual filter values', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '' },
              { name: 'category', defaultValue: 'all' },
            ],
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      act(() => {
        result.current.setFilterValue('search', 'test query');
      });

      expect(result.current.filters.search).toBe('test query');
      expect(result.current.filters.category).toBe('all');
    });

    it('should update multiple filters at once', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '' },
              { name: 'category', defaultValue: 'all' },
              { name: 'inStock', defaultValue: false },
            ],
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      act(() => {
        result.current.setFilters({
          search: 'laptop',
          category: 'electronics',
          inStock: true,
        });
      });

      expect(result.current.filters).toEqual({
        search: 'laptop',
        category: 'electronics',
        inStock: true,
      });
    });

    it('should reset filters to default values', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '' },
              { name: 'category', defaultValue: 'all' },
            ],
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      act(() => {
        result.current.setFilters({ search: 'test', category: 'electronics' });
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual({
        search: '',
        category: 'all',
      });
    });

    it('should reset individual filter', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '' },
              { name: 'category', defaultValue: 'all' },
            ],
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      act(() => {
        result.current.setFilters({ search: 'test', category: 'electronics' });
      });

      act(() => {
        result.current.resetFilter('search');
      });

      expect(result.current.filters.search).toBe('');
      expect(result.current.filters.category).toBe('electronics');
    });
  });

  describe('Debouncing', () => {
    it('should debounce filter changes', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: [], totalRecords: 0 });
      
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '', debounceMs: 300 },
            ],
            fetchConfig: { fetchFn },
          }),
        { wrapper }
      );

      const initialCallCount = fetchFn.mock.calls.length;

      act(() => {
        result.current.setFilterValue('search', 't');
      });
      act(() => {
        result.current.setFilterValue('search', 'te');
      });
      act(() => {
        result.current.setFilterValue('search', 'test');
      });

      // Should not have called fetchFn yet
      expect(fetchFn).toHaveBeenCalledTimes(initialCallCount);

      // Wait for debounce
      await act(async () => {
        await waitForDebounce(350);
      });

      // Should have called fetchFn once after debounce
      expect(fetchFn.mock.calls.length).toBeGreaterThan(initialCallCount);
      
      const lastCall = fetchFn.mock.calls[fetchFn.mock.calls.length - 1];
      expect(lastCall[0].filters.search).toBe('test');
    });
  });

  describe('Pagination', () => {
    it('should handle pagination state', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [],
            paginationConfig: {
              initialPage: 1,
              initialPageSize: 20,
            },
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ 
                data: Array(100).fill({}), 
                totalRecords: 100 
              }),
            },
          }),
        { wrapper }
      );

      expect(result.current.pagination.page).toBe(1);
      expect(result.current.pagination.pageSize).toBe(20);

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.pagination.page).toBe(2);
    });

    it('should calculate pagination metadata correctly', async () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [],
            paginationConfig: {
              initialPageSize: 10,
            },
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ 
                data: Array(10).fill({}), 
                totalRecords: 95 
              }),
            },
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.pagination.totalPages).toBe(10); // 95 / 10 = 9.5, rounded up to 10
        expect(result.current.pagination.totalRecords).toBe(95);
        expect(result.current.pagination.hasNextPage).toBe(true);
        expect(result.current.pagination.hasPreviousPage).toBe(false);
      });
    });

    it('should reset page on filter change when configured', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '' },
            ],
            paginationConfig: {
              resetOnFilterChange: true,
            },
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.pagination.page).toBe(3);

      act(() => {
        result.current.setFilterValue('search', 'test');
      });

      expect(result.current.pagination.page).toBe(1);
    });
  });

  describe('Sorting', () => {
    it('should handle sort state', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [],
            sortConfig: {
              initialSortField: 'name',
              initialSortDirection: 'asc',
            },
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      expect(result.current.sort).toEqual({
        field: 'name',
        direction: 'asc',
      });

      act(() => {
        result.current.setSort('price', 'desc');
      });

      expect(result.current.sort).toEqual({
        field: 'price',
        direction: 'desc',
      });
    });

    it('should toggle sort direction', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [],
            sortConfig: {},
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.sort).toEqual({
        field: 'name',
        direction: 'asc',
      });

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.sort).toEqual({
        field: 'name',
        direction: 'desc',
      });

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.sort).toBeUndefined();
    });
  });

  describe('URL Synchronization', () => {
    it('should sync filters to URL', () => {
      const mockSetParams = jest.fn();
      const mockUrlHandler = {
        getParams: () => new URLSearchParams(),
        setParams: mockSetParams,
      };

      renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '', urlKey: 'q' },
              { name: 'category', defaultValue: 'all', urlKey: 'cat' },
            ],
            urlHandler: mockUrlHandler,
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      expect(mockSetParams).toHaveBeenCalled();
      const lastCall = mockSetParams.mock.calls[mockSetParams.mock.calls.length - 1];
      const params = lastCall[0];
      
      // Default values should not be in URL
      expect(params.has('q')).toBe(false);
      expect(params.has('cat')).toBe(false);
    });

    it('should initialize filters from URL', () => {
      const urlParams = new URLSearchParams('q=laptop&cat=electronics');
      const mockUrlHandler = {
        getParams: () => urlParams,
        setParams: jest.fn(),
      };

      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '', urlKey: 'q' },
              { name: 'category', defaultValue: 'all', urlKey: 'cat' },
            ],
            urlHandler: mockUrlHandler,
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      // Wait for initialization
      waitFor(() => {
        expect(result.current.filters.search).toBe('laptop');
        expect(result.current.filters.category).toBe('electronics');
      });
    });
  });

  describe('Utilities', () => {
    it('should count active filters correctly', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '' },
              { name: 'category', defaultValue: 'all' },
              { name: 'inStock', defaultValue: false },
            ],
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
            },
          }),
        { wrapper }
      );

      expect(result.current.getActiveFiltersCount()).toBe(0);
      expect(result.current.hasActiveFilters()).toBe(false);

      act(() => {
        result.current.setFilterValue('search', 'test');
      });

      expect(result.current.getActiveFiltersCount()).toBe(1);
      expect(result.current.hasActiveFilters()).toBe(true);

      act(() => {
        result.current.setFilterValue('inStock', true);
      });

      expect(result.current.getActiveFiltersCount()).toBe(2);
    });

    it('should return correct query key', () => {
      const { result } = renderHook(
        () =>
          useFilterPilot({
            filterConfigs: [
              { name: 'search', defaultValue: '' },
            ],
            fetchConfig: {
              fetchFn: jest.fn().mockResolvedValue({ data: [], totalRecords: 0 }),
              queryKey: 'products',
            },
          }),
        { wrapper }
      );

      const queryKey = result.current.getQueryKey();
      
      expect(queryKey[0]).toBe('products');
      expect(queryKey).toContain('filters');
      expect(queryKey).toContain('pagination');
      expect(queryKey).toContain('sort');
    });
  });
});