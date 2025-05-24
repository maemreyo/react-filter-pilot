# TanStack Query Integration Guide

## Overview

react-filter-pilot is designed to work seamlessly with TanStack Query (React Query) v4 and v5, providing powerful data fetching capabilities with built-in caching, background refetching, and optimistic updates.

## Installation

```bash
npm install @tanstack/react-query react-filter-pilot
```

## Basic Setup

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFilterPilot } from 'react-filter-pilot';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime in v4)
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourComponents />
    </QueryClientProvider>
  );
}
```

## Advanced Query Options

### Using Select for Data Transformation

```tsx
const { data } = useFilterPilot({
  fetchConfig: {
    fetchFn: fetchProducts,
    select: (result) => ({
      ...result,
      data: result.data.map((product) => ({
        ...product,
        displayPrice: `$${product.price.toFixed(2)}`,
      })),
    }),
  },
});
```

### Placeholder Data

```tsx
const { data } = useFilterPilot({
  fetchConfig: {
    fetchFn: fetchProducts,
    placeholderData: {
      data: [],
      totalRecords: 0,
    },
    // Or use previous data
    placeholderData: (previousData) => previousData,
  },
});
```

### Custom Retry Logic

```tsx
const { data } = useFilterPilot({
  fetchConfig: {
    fetchFn: fetchProducts,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Or custom retry function
    retry: (failureCount, error) => {
      if (error.status === 404) return false;
      return failureCount < 3;
    },
  },
});
```

### Network Mode

```tsx
const { data } = useFilterPilot({
  fetchConfig: {
    fetchFn: fetchProducts,
    networkMode: 'offlineFirst', // 'online' | 'always' | 'offlineFirst'
  },
});
```

## Mutations with Filter Pilot

### Basic Mutation

```tsx
import { useFilterPilot, useFilterMutation } from 'react-filter-pilot';

function ProductList() {
  const filterPilot = useFilterPilot({
    // ... your config
  });

  const deleteMutation = useFilterMutation({
    filterPilot,
    mutationFn: async (productId: string) => {
      await api.deleteProduct(productId);
    },
    onSuccess: () => {
      toast.success('Product deleted');
    },
  });

  return (
    <div>
      {filterPilot.data?.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onDelete={() => deleteMutation.mutate(product.id)}
        />
      ))}
    </div>
  );
}
```

### Optimistic Updates

```tsx
const updateMutation = useFilterMutation({
  filterPilot,
  mutationFn: async (update: { id: string; name: string }) => {
    return await api.updateProduct(update);
  },
  optimisticUpdate: (variables) => {
    // Return updated data array for optimistic UI
    return (
      filterPilot.data?.map((product) =>
        product.id === variables.id ? { ...product, name: variables.name } : product
      ) || []
    );
  },
});
```

## Infinite Scrolling

### Basic Infinite Query

```tsx
import { useFilterPilotInfinite } from 'react-filter-pilot';

function InfiniteProductList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, filters, setFilterValue } =
    useFilterPilotInfinite({
      filterConfigs: [
        { name: 'search', defaultValue: '', debounceMs: 300 },
        { name: 'category', defaultValue: 'all' },
      ],
      fetchConfig: {
        fetchFn: async ({ filters, cursor }) => {
          const response = await api.getProducts({
            ...filters,
            cursor,
            limit: 20,
          });

          return {
            data: response.products,
            totalRecords: response.total,
            nextCursor: response.nextCursor,
          };
        },
      },
    });

  return (
    <div>
      {/* Filters */}
      <input value={filters.search} onChange={(e) => setFilterValue('search', e.target.value)} />

      {/* Results */}
      {data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}

      {/* Load More */}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Intersection Observer Integration

```tsx
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

function InfiniteScrollList() {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { data, fetchNextPage, hasNextPage } = useFilterPilotInfinite({
    // ... config
  });

  useIntersectionObserver({
    target: loadMoreRef,
    onIntersect: fetchNextPage,
    enabled: hasNextPage,
  });

  return (
    <div>
      {data.map((item) => (
        <Item key={item.id} {...item} />
      ))}
      <div ref={loadMoreRef} />
    </div>
  );
}
```

## Query Invalidation Strategies

### Manual Invalidation

```tsx
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();
  const filterPilot = useFilterPilot({
    /* ... */
  });

  const handleRefresh = () => {
    // Invalidate specific query
    queryClient.invalidateQueries({
      queryKey: filterPilot.getQueryKey(),
    });

    // Or invalidate all queries with prefix
    queryClient.invalidateQueries({
      queryKey: ['filterPilot'],
    });
  };
}
```

### Smart Invalidation

```tsx
// Invalidate related queries after mutation
const createMutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    // Invalidate list queries
    queryClient.invalidateQueries({
      queryKey: ['filterPilot', 'products'],
    });

    // But keep detail queries
    queryClient.invalidateQueries({
      queryKey: ['filterPilot', 'products'],
      refetchType: 'active',
    });
  },
});
```

## Prefetching

### Prefetch Next Page

```tsx
function PaginatedList() {
  const queryClient = useQueryClient();
  const { data, pagination, setPage } = useFilterPilot({
    // ... config
  });

  // Prefetch next page on hover
  const handleNextHover = () => {
    if (pagination.hasNextPage) {
      queryClient.prefetchQuery({
        queryKey: [
          'filterPilot',
          'filters',
          filters,
          'pagination',
          { ...pagination, page: pagination.page + 1 },
        ],
        queryFn: () =>
          fetchProducts({
            filters,
            pagination: { ...pagination, page: pagination.page + 1 },
          }),
      });
    }
  };
}
```

## Suspense Mode

```tsx
const { data } = useFilterPilot({
  fetchConfig: {
    fetchFn: fetchProducts,
    suspense: true, // Enable suspense mode
  },
});

// Wrap in Suspense boundary
<Suspense fallback={<Loading />}>
  <ProductList />
</Suspense>;
```

## Performance Tips

### 1. Query Key Structure

The query key is structured for optimal caching:

```
[prefix, 'filters', filtersObject, 'pagination', paginationObject, 'sort', sortObject]
```

### 2. Stale Time Configuration

```tsx
// Global configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    },
  },
});

// Per-query configuration
useFilterPilot({
  fetchConfig: {
    staleTime: 10 * 60 * 1000, // This query stays fresh for 10 minutes
  },
});
```

### 3. Background Refetching

```tsx
useFilterPilot({
  fetchConfig: {
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue in background
    refetchOnWindowFocus: true, // Refetch when window gains focus
  },
});
```

## Common Patterns

### Loading States

```tsx
const { data, isLoading, isFetching, isError } = useFilterPilot({
  // ... config
});

if (isLoading) return <FullPageLoader />;
if (isError) return <ErrorMessage />;

return (
  <div>
    {isFetching && <RefreshIndicator />}
    <ProductGrid products={data} />
  </div>
);
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function ProductsPage() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<Loading />}>
        <ProductList />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Migration Guide

### From v4 to v5

The main change is `cacheTime` → `gcTime`:

```tsx
// v4
useFilterPilot({
  fetchConfig: {
    cacheTime: 10 * 60 * 1000,
  },
});

// v5
useFilterPilot({
  fetchConfig: {
    gcTime: 10 * 60 * 1000, // or use cacheTime, it's aliased
  },
});
```
