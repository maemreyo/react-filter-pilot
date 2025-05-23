# react-filter-pilot Implementation Guide

## Table of Contents
1. [Basic Implementation](#basic-implementation)
2. [Advanced Filter Types](#advanced-filter-types)
3. [URL Synchronization](#url-synchronization)
4. [Custom Data Fetching](#custom-data-fetching)
5. [Filter Presets](#filter-presets)
6. [External Pagination](#external-pagination)
7. [Multi-column Sorting](#multi-column-sorting)
8. [Real-world Examples](#real-world-examples)

## Basic Implementation

### Simple Text Search with Category Filter

```typescript
import React from 'react';
import { useFilterPilot } from 'react-filter-pilot';
import { useQuery } from '@tanstack/react-query';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface ProductFilters {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
}

const ProductList: React.FC = () => {
  const {
    filters,
    setFilterValue,
    data,
    isLoading,
    pagination,
    setPage,
    resetFilters,
    hasActiveFilters
  } = useFilterPilot<Product, ProductFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 300,
        urlKey: 'q'
      },
      {
        name: 'category',
        defaultValue: 'all',
        urlKey: 'cat'
      },
      {
        name: 'minPrice',
        defaultValue: 0,
        transformToUrl: (value) => value.toString(),
        transformFromUrl: (value) => parseInt(value, 10)
      },
      {
        name: 'maxPrice',
        defaultValue: 1000,
        transformToUrl: (value) => value.toString(),
        transformFromUrl: (value) => parseInt(value, 10)
      }
    ],
    paginationConfig: {
      initialPageSize: 20,
      pageSizeOptions: [10, 20, 50],
      resetOnFilterChange: true
    },
    fetchConfig: {
      fetchFn: async ({ filters, pagination }) => {
        const params = new URLSearchParams();
        
        if (filters.search) params.set('search', filters.search);
        if (filters.category !== 'all') params.set('category', filters.category);
        if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice < 1000) params.set('maxPrice', filters.maxPrice.toString());
        
        params.set('page', pagination.page.toString());
        params.set('limit', pagination.pageSize.toString());
        
        const response = await fetch(`/api/products?${params}`);
        const result = await response.json();
        
        return {
          data: result.products,
          totalRecords: result.total
        };
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000 // 10 minutes
    }
  });

  return (
    <div className="product-list">
      {/* Filter Controls */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilterValue('search', e.target.value)}
        />
        
        <select
          value={filters.category}
          onChange={(e) => setFilterValue('category', e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </select>
        
        <div className="price-range">
          <input
            type="number"
            placeholder="Min price"
            value={filters.minPrice}
            onChange={(e) => setFilterValue('minPrice', parseInt(e.target.value) || 0)}
          />
          <input
            type="number"
            placeholder="Max price"
            value={filters.maxPrice}
            onChange={(e) => setFilterValue('maxPrice', parseInt(e.target.value) || 1000)}
          />
        </div>
        
        {hasActiveFilters() && (
          <button onClick={resetFilters}>Clear Filters</button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="products">
            {data?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {/* Pagination */}
          <div className="pagination">
            <button 
              onClick={() => setPage(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              Previous
            </button>
            
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button 
              onClick={() => setPage(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

## Advanced Filter Types

### Multi-Select Filter

```typescript
interface JobFilters {
  locations: string[];
  skills: string[];
  experienceLevel: string[];
}

const JobBoard: React.FC = () => {
  const { filters, setFilterValue } = useFilterPilot<Job, JobFilters>({
    filterConfigs: [
      {
        name: 'locations',
        defaultValue: [],
        urlKey: 'loc',
        transformToUrl: (value: string[]) => value.join(','),
        transformFromUrl: (value: string) => value ? value.split(',') : []
      },
      {
        name: 'skills',
        defaultValue: [],
        urlKey: 'skills',
        transformToUrl: (value: string[]) => value.join(','),
        transformFromUrl: (value: string) => value ? value.split(',') : []
      }
    ],
    // ... other config
  });

  const handleLocationToggle = (location: string) => {
    const current = filters.locations;
    const updated = current.includes(location)
      ? current.filter(l => l !== location)
      : [...current, location];
    
    setFilterValue('locations', updated);
  };

  return (
    <div>
      {/* Multi-select checkboxes */}
      {['New York', 'San Francisco', 'Remote'].map(location => (
        <label key={location}>
          <input
            type="checkbox"
            checked={filters.locations.includes(location)}
            onChange={() => handleLocationToggle(location)}
          />
          {location}
        </label>
      ))}
    </div>
  );
};
```

### Date Range Filter

```typescript
interface EventFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  eventType: string;
}

const EventList: React.FC = () => {
  const { filters, setFilterValue } = useFilterPilot<Event, EventFilters>({
    filterConfigs: [
      {
        name: 'dateRange',
        defaultValue: { start: null, end: null },
        transformToUrl: (value) => {
          if (!value.start && !value.end) return '';
          const start = value.start ? value.start.toISOString() : '';
          const end = value.end ? value.end.toISOString() : '';
          return `${start}|${end}`;
        },
        transformFromUrl: (value) => {
          if (!value) return { start: null, end: null };
          const [start, end] = value.split('|');
          return {
            start: start ? new Date(start) : null,
            end: end ? new Date(end) : null
          };
        },
        transformForApi: (value) => ({
          startDate: value.start?.toISOString(),
          endDate: value.end?.toISOString()
        })
      }
    ],
    // ... other config
  });

  return (
    <div>
      <DatePicker
        selected={filters.dateRange.start}
        onChange={(date) => setFilterValue('dateRange', {
          ...filters.dateRange,
          start: date
        })}
        selectsStart
        startDate={filters.dateRange.start}
        endDate={filters.dateRange.end}
      />
      <DatePicker
        selected={filters.dateRange.end}
        onChange={(date) => setFilterValue('dateRange', {
          ...filters.dateRange,
          end: date
        })}
        selectsEnd
        startDate={filters.dateRange.start}
        endDate={filters.dateRange.end}
        minDate={filters.dateRange.start}
      />
    </div>
  );
};
```

## URL Synchronization

### React Router DOM Integration

```typescript
import { useFilterPilot, useReactRouterDomUrlHandler } from 'react-filter-pilot';
import { useNavigate, useLocation } from 'react-router-dom';

const FilteredPage: React.FC = () => {
  const urlHandler = useReactRouterDomUrlHandler();
  
  const { filters, setFilterValue } = useFilterPilot({
    filterConfigs: [
      { name: 'search', urlKey: 'q' },
      { name: 'status', urlKey: 'status' }
    ],
    urlHandler, // This enables URL sync
    // ... other config
  });

  // URL will automatically update when filters change
  // Example: /products?q=laptop&status=active
};
```

### Next.js App Router Integration

```typescript
'use client';

import { useFilterPilot, useNextJsUrlHandler } from 'react-filter-pilot';

export default function ProductsPage() {
  const urlHandler = useNextJsUrlHandler();
  
  const { filters, data } = useFilterPilot({
    filterConfigs: [
      { name: 'category', urlKey: 'cat' },
      { name: 'sort', urlKey: 'sort' }
    ],
    urlHandler,
    // ... other config
  });

  // URL updates work with Next.js App Router
  // Example: /products?cat=electronics&sort=price-asc
}
```

### Custom URL Handler

```typescript
const customUrlHandler: UrlHandler = {
  getParams: () => {
    // Custom logic to get URL params
    const hash = window.location.hash.slice(1);
    return new URLSearchParams(hash);
  },
  setParams: (params: URLSearchParams) => {
    // Custom logic to set URL params
    window.location.hash = params.toString();
  }
};

const { filters } = useFilterPilot({
  urlHandler: customUrlHandler,
  // ... other config
});
```

## Custom Data Fetching

### Integration with Custom API Client

```typescript
import { apiClient } from '@/lib/api';

const ProductList: React.FC = () => {
  const { data, isLoading } = useFilterPilot({
    fetchConfig: {
      fetchFn: async ({ filters, pagination, sort }) => {
        // Use your custom API client
        const response = await apiClient.post('/products/search', {
          filters: {
            name: filters.search,
            categoryId: filters.category,
            priceRange: {
              min: filters.minPrice,
              max: filters.maxPrice
            }
          },
          pagination: {
            offset: (pagination.page - 1) * pagination.pageSize,
            limit: pagination.pageSize
          },
          sort: sort ? {
            field: sort.field,
            order: sort.direction.toUpperCase()
          } : undefined
        });

        return {
          data: response.data.items,
          totalRecords: response.data.totalCount,
          meta: {
            facets: response.data.facets,
            suggestions: response.data.suggestions
          }
        };
      },
      onSuccess: (result) => {
        // Handle successful fetch
        console.log('Fetched', result.data.length, 'items');
        
        // Use metadata
        if (result.meta?.suggestions) {
          setSuggestions(result.meta.suggestions);
        }
      },
      onError: (error) => {
        // Handle errors
        toast.error(`Failed to load products: ${error.message}`);
      }
    }
  });
};
```

### GraphQL Integration

```typescript
import { gql, useApolloClient } from '@apollo/client';

const PRODUCTS_QUERY = gql`
  query GetProducts($filter: ProductFilter!, $pagination: PaginationInput!) {
    products(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        price
      }
      totalCount
    }
  }
`;

const ProductList: React.FC = () => {
  const apolloClient = useApolloClient();
  
  const { data } = useFilterPilot({
    fetchConfig: {
      fetchFn: async ({ filters, pagination }) => {
        const { data } = await apolloClient.query({
          query: PRODUCTS_QUERY,
          variables: {
            filter: {
              search: filters.search,
              category: filters.category
            },
            pagination: {
              page: pagination.page,
              pageSize: pagination.pageSize
            }
          }
        });

        return {
          data: data.products.items,
          totalRecords: data.products.totalCount
        };
      }
    }
  });
};
```

## Filter Presets

### Implementing Filter Presets

```typescript
interface ProductFilters {
  category: string;
  priceRange: string;
  inStock: boolean;
}

const ProductList: React.FC = () => {
  const {
    filters,
    setFilters,
    presets,
    resetFilters
  } = useFilterPilot<Product, ProductFilters>({
    enablePresets: true,
    filterConfigs: [
      { name: 'category', defaultValue: 'all' },
      { name: 'priceRange', defaultValue: 'all' },
      { name: 'inStock', defaultValue: false }
    ],
    // ... other config
  });

  const predefinedPresets = [
    {
      name: 'Affordable Electronics',
      filters: {
        category: 'electronics',
        priceRange: '0-100',
        inStock: true
      }
    },
    {
      name: 'Premium Items',
      filters: {
        category: 'all',
        priceRange: '500+',
        inStock: true
      }
    }
  ];

  return (
    <div>
      {/* Preset buttons */}
      <div className="presets">
        {predefinedPresets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setFilters(preset.filters)}
          >
            {preset.name}
          </button>
        ))}
        
        {/* Save current filters as preset */}
        <button onClick={() => {
          const name = prompt('Preset name:');
          if (name && presets) {
            presets.savePreset(name);
          }
        }}>
          Save Current Filters
        </button>
        
        {/* Load saved presets */}
        {presets?.getPresets().map((preset) => (
          <div key={preset.id}>
            <button onClick={() => presets.loadPreset(preset)}>
              {preset.name}
            </button>
            <button onClick={() => presets.deletePreset(preset.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## External Pagination

### Using with Mantine DataTable

```typescript
import { DataTable } from 'mantine-datatable';

const UserTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, totalRecords, isLoading } = useFilterPilot({
    paginationConfig: {
      external: true, // Let Mantine handle pagination state
    },
    fetchConfig: {
      fetchFn: async ({ filters }) => {
        // Use external pagination values
        const response = await fetch(
          `/api/users?page=${page}&pageSize=${pageSize}&search=${filters.search}`
        );
        const result = await response.json();
        
        return {
          data: result.users,
          totalRecords: result.total
        };
      }
    }
  });

  return (
    <DataTable
      records={data}
      totalRecords={totalRecords}
      recordsPerPage={pageSize}
      page={page}
      onPageChange={setPage}
      recordsPerPageOptions={[10, 20, 50]}
      onRecordsPerPageChange={setPageSize}
      fetching={isLoading}
    />
  );
};
```

## Multi-column Sorting

### Implementing Multi-column Sort

```typescript
interface SortColumn {
  field: string;
  direction: 'asc' | 'desc';
}

const DataGrid: React.FC = () => {
  const [sortColumns, setSortColumns] = useState<SortColumn[]>([]);

  const { data, setSort } = useFilterPilot({
    sortConfig: {
      multiSort: true
    },
    fetchConfig: {
      fetchFn: async ({ filters, pagination, sort }) => {
        // Handle multi-column sort
        const sortParams = sortColumns
          .map(col => `${col.field}:${col.direction}`)
          .join(',');
        
        const response = await fetch(
          `/api/data?sort=${sortParams}`
        );
        
        return await response.json();
      }
    }
  });

  const handleColumnSort = (field: string) => {
    setSortColumns(prev => {
      const existing = prev.find(col => col.field === field);
      
      if (!existing) {
        // Add new sort column
        return [...prev, { field, direction: 'asc' }];
      }
      
      if (existing.direction === 'asc') {
        // Change to desc
        return prev.map(col => 
          col.field === field 
            ? { ...col, direction: 'desc' } 
            : col
        );
      }
      
      // Remove from sort
      return prev.filter(col => col.field !== field);
    });
  };

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => handleColumnSort('name')}>
            Name {getSortIcon('name')}
          </th>
          <th onClick={() => handleColumnSort('date')}>
            Date {getSortIcon('date')}
          </th>
        </tr>
      </thead>
      {/* ... */}
    </table>
  );
};
```

## Real-world Examples

### E-commerce Product Listing

```typescript
const EcommerceProductListing: React.FC = () => {
  const urlHandler = useReactRouterDomUrlHandler();
  
  const {
    filters,
    setFilterValue,
    data,
    isLoading,
    pagination,
    sort,
    setSort,
    hasActiveFilters,
    resetFilters,
    getActiveFiltersCount
  } = useFilterPilot<Product, ProductFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 300,
        urlKey: 'q'
      },
      {
        name: 'categories',
        defaultValue: [],
        urlKey: 'cat',
        transformToUrl: (val: string[]) => val.join(','),
        transformFromUrl: (val: string) => val ? val.split(',') : []
      },
      {
        name: 'brands',
        defaultValue: [],
        urlKey: 'brand',
        transformToUrl: (val: string[]) => val.join(','),
        transformFromUrl: (val: string) => val ? val.split(',') : []
      },
      {
        name: 'priceRange',
        defaultValue: { min: 0, max: 10000 },
        transformToUrl: (val) => `${val.min}-${val.max}`,
        transformFromUrl: (val) => {
          const [min, max] = val.split('-').map(Number);
          return { min, max };
        }
      },
      {
        name: 'rating',
        defaultValue: 0,
        transformToUrl: (val) => val.toString(),
        transformFromUrl: (val) => parseInt(val, 10)
      },
      {
        name: 'inStock',
        defaultValue: false,
        transformToUrl: (val) => val ? '1' : '0',
        transformFromUrl: (val) => val === '1'
      }
    ],
    paginationConfig: {
      initialPageSize: 24,
      pageSizeOptions: [12, 24, 48, 96],
      resetOnFilterChange: true
    },
    sortConfig: {
      initialSortField: 'relevance',
      initialSortDirection: 'desc'
    },
    urlHandler,
    fetchConfig: {
      fetchFn: async ({ filters, pagination, sort }) => {
        const params = {
          q: filters.search,
          categories: filters.categories,
          brands: filters.brands,
          minPrice: filters.priceRange.min,
          maxPrice: filters.priceRange.max,
          minRating: filters.rating,
          inStock: filters.inStock,
          page: pagination.page,
          limit: pagination.pageSize,
          sortBy: sort?.field,
          sortOrder: sort?.direction
        };

        const response = await fetch('/api/products/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });

        const result = await response.json();
        
        return {
          data: result.products,
          totalRecords: result.totalCount,
          meta: {
            facets: result.facets,
            priceStats: result.priceStats
          }
        };
      },
      staleTime: 5 * 60 * 1000,
      onSuccess: (result) => {
        // Update facet counts
        updateFacets(result.meta.facets);
      }
    }
  });

  return (
    <div className="product-listing">
      {/* Sidebar Filters */}
      <aside className="filters-sidebar">
        <div className="filter-header">
          <h3>Filters ({getActiveFiltersCount()})</h3>
          {hasActiveFilters() && (
            <button onClick={resetFilters}>Clear all</button>
          )}
        </div>

        {/* Search */}
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilterValue('search', e.target.value)}
          />
        </div>

        {/* Categories */}
        <FilterGroup
          title="Categories"
          options={categories}
          selected={filters.categories}
          onChange={(cats) => setFilterValue('categories', cats)}
          multi
        />

        {/* Price Range Slider */}
        <div className="filter-group">
          <h4>Price Range</h4>
          <RangeSlider
            min={0}
            max={10000}
            value={[filters.priceRange.min, filters.priceRange.max]}
            onChange={([min, max]) => 
              setFilterValue('priceRange', { min, max })
            }
          />
        </div>

        {/* Rating */}
        <div className="filter-group">
          <h4>Minimum Rating</h4>
          <StarRating
            value={filters.rating}
            onChange={(rating) => setFilterValue('rating', rating)}
          />
        </div>

        {/* Stock */}
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => setFilterValue('inStock', e.target.checked)}
          />
          In Stock Only
        </label>
      </aside>

      {/* Main Content */}
      <main className="products-main">
        {/* Sort and View Options */}
        <div className="products-header">
          <div className="results-count">
            {pagination.totalRecords} products found
          </div>
          
          <select
            value={`${sort?.field}-${sort?.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSort(field, direction as 'asc' | 'desc');
            }}
          >
            <option value="relevance-desc">Most Relevant</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="created-desc">Newest First</option>
          </select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductSkeleton count={pagination.pageSize} />
        ) : (
          <div className="products-grid">
            {data?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      </main>
    </div>
  );
};
```

### Admin Dashboard with Complex Filters

```typescript
const AdminDashboard: React.FC = () => {
  const {
    filters,
    setFilterValue,
    data,
    isLoading,
    presets,
    hasActiveFilters
  } = useFilterPilot<Order, OrderFilters>({
    enablePresets: true,
    filterConfigs: [
      {
        name: 'status',
        defaultValue: [],
        urlKey: 'status',
        transformToUrl: (val: string[]) => val.join(','),
        transformFromUrl: (val: string) => val ? val.split(',') : []
      },
      {
        name: 'dateRange',
        defaultValue: { 
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
          end: new Date() 
        }
      },
      {
        name: 'customer',
        defaultValue: '',
        debounceMs: 500
      },
      {
        name: 'amountRange',
        defaultValue: { min: 0, max: null }
      },
      {
        name: 'paymentMethod',
        defaultValue: []
      },
      {
        name: 'fulfillmentStatus',
        defaultValue: []
      }
    ],
    initialFiltersProvider: async () => {
      // Load user's default filters from API
      const userPrefs = await api.getUserPreferences();
      return userPrefs.defaultFilters || {};
    },
    fetchConfig: {
      fetchFn: async ({ filters, pagination, sort }) => {
        const response = await api.orders.search({
          filters: {
            statuses: filters.status,
            startDate: filters.dateRange.start,
            endDate: filters.dateRange.end,
            customerSearch: filters.customer,
            minAmount: filters.amountRange.min,
            maxAmount: filters.amountRange.max,
            paymentMethods: filters.paymentMethod,
            fulfillmentStatuses: filters.fulfillmentStatus
          },
          pagination,
          sort
        });

        return {
          data: response.orders,
          totalRecords: response.total,
          meta: {
            stats: response.statistics
          }
        };
      },
      refetchInterval: 30000, // Refresh every 30 seconds
      onSuccess: (result) => {
        // Update dashboard statistics
        updateDashboardStats(result.meta.stats);
      }
    }
  });

  // Quick filter presets
  const quickFilters = [
    {
      label: 'Pending Orders',
      filters: { status: ['pending'], fulfillmentStatus: ['unfulfilled'] }
    },
    {
      label: 'High Value Orders',
      filters: { amountRange: { min: 1000, max: null } }
    },
    {
      label: "Today's Orders",
      filters: { 
        dateRange: { 
          start: new Date(new Date().setHours(0,0,0,0)), 
          end: new Date() 
        } 
      }
    }
  ];

  return (
    <div className="admin-dashboard">
      {/* Quick Filters */}
      <div className="quick-filters">
        {quickFilters.map((qf) => (
          <button
            key={qf.label}
            onClick={() => setFilters(qf.filters)}
            className="quick-filter-btn"
          >
            {qf.label}
          </button>
        ))}
      </div>

      {/* Complex Filter Panel */}
      <FilterPanel
        filters={filters}
        onChange={setFilterValue}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters()}
      />

      {/* Results */}
      <OrdersTable
        orders={data}
        loading={isLoading}
        onRowClick={(order) => navigate(`/orders/${order.id}`)}
      />
    </div>
  );
};
```