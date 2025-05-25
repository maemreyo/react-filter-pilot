# Hướng dẫn sử dụng React Filter Pilot

React Filter Pilot là một thư viện mạnh mẽ giúp quản lý các tính năng lọc, phân trang và sắp xếp dữ liệu trong ứng dụng React. Thư viện này tích hợp tốt với TanStack Query (React Query) và cung cấp nhiều tính năng hữu ích.

## Mục lục

1. [Cài đặt](#cài-đặt)
2. [Các hook chính](#các-hook-chính)
3. [useFilterPilot - Hook cơ bản](#useFilterPilot---hook-cơ-bản)
4. [useFilterPilotInfinite - Hook cuộn vô hạn](#useFilterPilotInfinite---hook-cuộn-vô-hạn)
5. [useFilterMutation - Hook quản lý mutation](#useFilterMutation---hook-quản-lý-mutation)
6. [Đồng bộ hóa URL](#đồng-bộ-hóa-url)
7. [Tùy chỉnh bộ lọc](#tùy-chỉnh-bộ-lọc)
8. [Quản lý phân trang](#quản-lý-phân-trang)
9. [Sắp xếp dữ liệu](#sắp-xếp-dữ-liệu)
10. [Lưu trữ bộ lọc (Presets)](#lưu-trữ-bộ-lọc-presets)
11. [Ví dụ thực tế](#ví-dụ-thực-tế)

## Cài đặt

```bash
# Sử dụng npm
npm install react-filter-pilot @tanstack/react-query

# Sử dụng yarn
yarn add react-filter-pilot @tanstack/react-query

# Sử dụng pnpm
pnpm add react-filter-pilot @tanstack/react-query
```

## Các hook chính

React Filter Pilot cung cấp 3 hook chính:

1. **useFilterPilot**: Hook cơ bản để quản lý bộ lọc, phân trang và sắp xếp
2. **useFilterPilotInfinite**: Hook cho cuộn vô hạn (infinite scrolling)
3. **useFilterMutation**: Hook để quản lý các thao tác mutation (thêm, sửa, xóa)

## useFilterPilot - Hook cơ bản

Hook `useFilterPilot` là hook chính của thư viện, cung cấp các chức năng lọc, phân trang và sắp xếp dữ liệu.

### Cách sử dụng cơ bản

```tsx
import { useFilterPilot } from 'react-filter-pilot';

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

function ProductList() {
  const {
    filters,
    setFilterValue,
    data,
    isLoading,
    pagination,
    setPage,
    resetFilters,
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
      fetchFn: async ({ filters, pagination, sort }) => {
        // Gọi API hoặc xử lý dữ liệu
        const response = await fetch(`/api/products?${new URLSearchParams({
          search: filters.search,
          category: filters.category,
          minPrice: filters.minPrice.toString(),
          maxPrice: filters.maxPrice.toString(),
          page: pagination.page.toString(),
          pageSize: pagination.pageSize.toString(),
          sortBy: sort?.field || '',
          sortOrder: sort?.direction || ''
        })}`);
        
        const result = await response.json();
        
        return {
          data: result.products,
          totalRecords: result.total
        };
      },
      staleTime: 5 * 60 * 1000, // 5 phút
      gcTime: 10 * 60 * 1000 // 10 phút
    }
  });

  return (
    <div>
      {/* Bộ lọc */}
      <input
        type="text"
        value={filters.search}
        onChange={(e) => setFilterValue('search', e.target.value)}
        placeholder="Tìm kiếm..."
      />
      
      <select
        value={filters.category}
        onChange={(e) => setFilterValue('category', e.target.value)}
      >
        <option value="all">Tất cả danh mục</option>
        <option value="electronics">Điện tử</option>
        <option value="clothing">Quần áo</option>
      </select>
      
      {/* Hiển thị dữ liệu */}
      {isLoading ? (
        <div>Đang tải...</div>
      ) : (
        <div>
          {data?.map(product => (
            <div key={product.id}>
              <h3>{product.name}</h3>
              <p>{product.category}</p>
              <p>${product.price}</p>
            </div>
          ))}
          
          {/* Phân trang */}
          <div>
            <button 
              onClick={() => setPage(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              Trước
            </button>
            
            <span>
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            
            <button 
              onClick={() => setPage(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Các tùy chọn của useFilterPilot

```typescript
interface UseFilterPilotOptions<TData, TFilters> {
  // Cấu hình bộ lọc
  filterConfigs: FilterConfig[];
  
  // Cấu hình phân trang
  paginationConfig?: PaginationConfig;
  
  // Cấu hình sắp xếp
  sortConfig?: SortConfig;
  
  // Cấu hình fetch dữ liệu
  fetchConfig: FetchConfig<TData, TFilters>;
  
  // Xử lý URL (tùy chọn)
  urlHandler?: UrlHandler;
  
  // Provider cho bộ lọc ban đầu (tùy chọn)
  initialFiltersProvider?: () => Promise<Partial<TFilters>> | Partial<TFilters>;
  
  // Bật/tắt tính năng lưu trữ bộ lọc
  enablePresets?: boolean;
}
```

### Kết quả trả về từ useFilterPilot

```typescript
interface UseFilterPilotResult<TData, TFilters> {
  // Trạng thái bộ lọc
  filters: TFilters;
  setFilterValue: (name: keyof TFilters, value: any) => void;
  setFilters: (filters: Partial<TFilters>) => void;
  resetFilters: () => void;
  resetFilter: (name: keyof TFilters) => void;
  
  // Trạng thái sắp xếp
  sort?: SortState;
  setSort: (field: string, direction?: 'asc' | 'desc') => void;
  toggleSort: (field: string) => void;
  clearSort: () => void;
  
  // Dữ liệu và trạng thái query
  data: TData[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  isFetching: boolean;
  refetch: () => void;
  totalRecords: number;
  
  // Phân trang
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // Tiện ích
  hasActiveFilters: () => boolean;
  getActiveFiltersCount: () => number;
  getQueryKey: () => unknown[];
  
  // Presets (nếu được bật)
  presets?: {
    savePreset: (name: string) => void;
    loadPreset: (preset: FilterPreset) => void;
    deletePreset: (id: string) => void;
    getPresets: () => FilterPreset[];
  };
}
```

## useFilterPilotInfinite - Hook cuộn vô hạn

Hook `useFilterPilotInfinite` được sử dụng cho tính năng cuộn vô hạn (infinite scrolling), thường dùng cho các danh sách dài.

### Cách sử dụng

```tsx
import { useRef, useCallback } from 'react';
import { useFilterPilotInfinite } from 'react-filter-pilot';

function BlogPostList() {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    filters,
    setFilterValue,
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFilterPilotInfinite<BlogPost, BlogFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 500,
      },
      {
        name: 'category',
        defaultValue: 'all',
      },
    ],
    fetchConfig: {
      fetchFn: async ({ filters, cursor }) => {
        const response = await fetch(`/api/posts?${new URLSearchParams({
          search: filters.search,
          category: filters.category,
          cursor: cursor || '',
        })}`);
        
        const result = await response.json();
        
        return {
          data: result.posts,
          totalRecords: result.total,
          nextCursor: result.nextCursor,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  });

  // Thiết lập Intersection Observer cho cuộn vô hạn
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Thiết lập observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px 400px 0px',
    });
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  return (
    <div>
      {/* Bộ lọc */}
      <input
        type="text"
        value={filters.search}
        onChange={(e) => setFilterValue('search', e.target.value)}
        placeholder="Tìm kiếm bài viết..."
      />
      
      {/* Danh sách bài viết */}
      <div className="posts-list">
        {data.map(post => (
          <div key={post.id} className="post-item">
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
          </div>
        ))}
        
        {/* Element để theo dõi cuộn */}
        <div ref={observerTarget} style={{ height: 20 }} />
        
        {isFetchingNextPage && <div>Đang tải thêm...</div>}
      </div>
    </div>
  );
}
```

### Các tùy chọn đặc biệt cho useFilterPilotInfinite

```typescript
interface UseFilterPilotInfiniteOptions<TData, TFilters> {
  // Tương tự như useFilterPilot, nhưng fetchConfig có thêm các tùy chọn
  fetchConfig: {
    fetchFn: (params: FetchParams<TFilters> & { cursor?: string | number | null }) => 
      Promise<InfiniteResult<TData>>;
    
    // Hàm lấy tham số cho trang tiếp theo
    getNextPageParam?: (lastPage: InfiniteResult<TData>, allPages: InfiniteResult<TData>[]) => 
      string | number | null | undefined;
    
    // Hàm lấy tham số cho trang trước đó
    getPreviousPageParam?: (firstPage: InfiniteResult<TData>, allPages: InfiniteResult<TData>[]) => 
      string | number | null | undefined;
    
    // Tham số trang ban đầu
    initialPageParam?: string | number | null;
    
    // Số trang tối đa
    maxPages?: number;
  };
}
```

## useFilterMutation - Hook quản lý mutation

Hook `useFilterMutation` giúp quản lý các thao tác mutation (thêm, sửa, xóa) và tự động cập nhật dữ liệu.

### Cách sử dụng

```tsx
import { useFilterPilot, useFilterMutation } from 'react-filter-pilot';

function UserManagement() {
  // Sử dụng useFilterPilot để lấy danh sách người dùng
  const filterPilot = useFilterPilot<User, UserFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 300,
      },
      {
        name: 'role',
        defaultValue: 'all',
      },
    ],
    fetchConfig: {
      fetchFn: fetchUsers, // Hàm fetch dữ liệu
    },
  });

  // Mutation để cập nhật người dùng
  const updateMutation = useFilterMutation<User, UserFilters, User, Partial<User> & { id: string }>({
    filterPilot,
    mutationFn: async (userData) => {
      const response = await fetch(`/api/users/${userData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    // Cập nhật lạc quan (optimistic update)
    optimisticUpdate: (variables) => {
      return filterPilot.data?.map(user => 
        user.id === variables.id ? { ...user, ...variables } : user
      ) || [];
    },
    onSuccess: () => {
      // Xử lý khi cập nhật thành công
    },
  });

  // Mutation để xóa người dùng
  const deleteMutation = useFilterMutation<User, UserFilters, { success: boolean }, string>({
    filterPilot,
    mutationFn: async (userId) => {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      return { success: true };
    },
    // Cập nhật lạc quan (optimistic update)
    optimisticUpdate: (userId) => {
      return filterPilot.data?.filter(user => user.id !== userId) || [];
    },
  });

  return (
    <div>
      {/* Hiển thị danh sách người dùng */}
      {filterPilot.data?.map(user => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <button onClick={() => updateMutation.mutate({ id: user.id, role: 'admin' })}>
            Đặt làm Admin
          </button>
          <button onClick={() => deleteMutation.mutate(user.id)}>
            Xóa
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Các tùy chọn của useFilterMutation

```typescript
interface UseFilterMutationOptions<TData, TFilters, TMutationData, TMutationVariables> {
  // Kết quả từ useFilterPilot
  filterPilot: UseFilterPilotResult<TData, TFilters>;
  
  // Hàm thực hiện mutation
  mutationFn: (variables: TMutationVariables) => Promise<TMutationData>;
  
  // Callback khi thành công
  onSuccess?: (data: TMutationData, variables: TMutationVariables, context: any) => void;
  
  // Callback khi lỗi
  onError?: (error: Error, variables: TMutationVariables, context: any) => void;
  
  // Callback khi hoàn thành (thành công hoặc lỗi)
  onSettled?: (data: TMutationData | undefined, error: Error | null, variables: TMutationVariables, context: any) => void;
  
  // Có làm mới dữ liệu sau khi mutation thành công không
  invalidateOnSuccess?: boolean;
  
  // Hàm cập nhật lạc quan (optimistic update)
  optimisticUpdate?: (variables: TMutationVariables) => TData[];
  
  // Các tùy chọn mutation khác
  mutationOptions?: Omit<UseMutationOptions<TMutationData, Error, TMutationVariables>, 'mutationFn' | 'onMutate' | 'onError' | 'onSuccess' | 'onSettled'>;
}
```

## Đồng bộ hóa URL

React Filter Pilot hỗ trợ đồng bộ hóa bộ lọc, phân trang và sắp xếp với URL, giúp người dùng có thể chia sẻ hoặc bookmark trạng thái hiện tại.

### Cấu hình URL mặc định

Mặc định, React Filter Pilot sử dụng History API của trình duyệt để đồng bộ hóa URL.

```tsx
// Mặc định, không cần cấu hình gì thêm
const { filters, setFilterValue } = useFilterPilot({
  filterConfigs: [
    {
      name: 'search',
      defaultValue: '',
      urlKey: 'q', // Tham số trên URL sẽ là ?q=...
    },
    // ...
  ],
  // ...
});
```

### Sử dụng với React Router

```tsx
import { useSearchParams } from 'react-router-dom';
import { useFilterPilot, useReactRouterDomUrlHandler } from 'react-filter-pilot';

function ProductList() {
  // Sử dụng URL handler cho React Router
  const urlHandler = useReactRouterDomUrlHandler();
  
  const { filters, setFilterValue } = useFilterPilot({
    filterConfigs: [...],
    urlHandler, // Truyền URL handler
    // ...
  });
  
  // ...
}
```

### Sử dụng với Next.js

```tsx
import { useRouter } from 'next/router';
import { useFilterPilot, useNextJsUrlHandler } from 'react-filter-pilot';

function ProductList() {
  // Sử dụng URL handler cho Next.js
  const urlHandler = useNextJsUrlHandler();
  
  const { filters, setFilterValue } = useFilterPilot({
    filterConfigs: [...],
    urlHandler, // Truyền URL handler
    // ...
  });
  
  // ...
}
```

### Tùy chỉnh chuyển đổi giá trị URL

```tsx
const { filters, setFilterValue } = useFilterPilot({
  filterConfigs: [
    {
      name: 'priceRange',
      defaultValue: { min: 0, max: 1000 },
      urlKey: 'price',
      // Chuyển đổi từ đối tượng sang chuỗi cho URL
      transformToUrl: (value) => `${value.min}-${value.max}`,
      // Chuyển đổi từ chuỗi URL sang đối tượng
      transformFromUrl: (value) => {
        const [min, max] = value.split('-').map(Number);
        return { min, max };
      },
    },
    {
      name: 'tags',
      defaultValue: [],
      urlKey: 'tags',
      transformToUrl: (value) => value.join(','),
      transformFromUrl: (value) => value ? value.split(',') : [],
    },
  ],
  // ...
});
```

## Tùy chỉnh bộ lọc

### Cấu hình bộ lọc

```typescript
interface FilterConfig {
  // Tên của bộ lọc (bắt buộc)
  name: string;
  
  // Giá trị mặc định (bắt buộc)
  defaultValue: any;
  
  // Thời gian debounce (ms) - hữu ích cho ô tìm kiếm
  debounceMs?: number;
  
  // Khóa trên URL (mặc định là name)
  urlKey?: string;
  
  // Hàm chuyển đổi giá trị thành chuỗi URL
  transformToUrl?: (value: any) => string;
  
  // Hàm chuyển đổi chuỗi URL thành giá trị
  transformFromUrl?: (value: string) => any;
  
  // Hàm chuyển đổi giá trị trước khi gửi đến API
  transformForApi?: (value: any) => any;
}
```

### Các loại bộ lọc phổ biến

#### Bộ lọc văn bản

```tsx
{
  name: 'search',
  defaultValue: '',
  debounceMs: 300, // Đợi 300ms sau khi người dùng ngừng gõ
}
```

#### Bộ lọc danh mục

```tsx
{
  name: 'category',
  defaultValue: 'all',
}
```

#### Bộ lọc nhiều lựa chọn

```tsx
{
  name: 'tags',
  defaultValue: [],
  transformToUrl: (value) => value.join(','),
  transformFromUrl: (value) => value ? value.split(',') : [],
}
```

#### Bộ lọc khoảng giá trị

```tsx
{
  name: 'priceRange',
  defaultValue: { min: 0, max: 1000 },
  transformToUrl: (value) => `${value.min}-${value.max}`,
  transformFromUrl: (value) => {
    const [min, max] = value.split('-').map(Number);
    return { min, max };
  },
}
```

#### Bộ lọc boolean

```tsx
{
  name: 'inStock',
  defaultValue: false,
  transformToUrl: (value) => value ? '1' : '0',
  transformFromUrl: (value) => value === '1',
}
```

#### Bộ lọc ngày tháng

```tsx
{
  name: 'dateRange',
  defaultValue: { min: '', max: '' },
  transformToUrl: (value) => `${value.min || ''}:${value.max || ''}`,
  transformFromUrl: (value) => {
    const [min, max] = value.split(':');
    return { min, max };
  },
}
```

## Quản lý phân trang

### Cấu hình phân trang

```typescript
interface PaginationConfig {
  // Kích thước trang ban đầu
  initialPageSize: number;
  
  // Các tùy chọn kích thước trang
  pageSizeOptions?: number[];
  
  // Có reset về trang 1 khi bộ lọc thay đổi không
  resetOnFilterChange?: boolean;
  
  // Có đồng bộ hóa với URL không
  syncWithUrl?: boolean;
}
```

### Sử dụng phân trang

```tsx
const {
  pagination,
  setPage,
  setPageSize,
} = useFilterPilot({
  // ...
  paginationConfig: {
    initialPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    resetOnFilterChange: true,
  },
  // ...
});

// Trong component
return (
  <div>
    {/* ... */}
    
    <div className="pagination">
      <button 
        onClick={() => setPage(1)} 
        disabled={pagination.page === 1}
      >
        Đầu
      </button>
      
      <button 
        onClick={() => setPage(pagination.page - 1)} 
        disabled={!pagination.hasPreviousPage}
      >
        Trước
      </button>
      
      <span>
        Trang {pagination.page} / {pagination.totalPages}
      </span>
      
      <button 
        onClick={() => setPage(pagination.page + 1)} 
        disabled={!pagination.hasNextPage}
      >
        Sau
      </button>
      
      <button 
        onClick={() => setPage(pagination.totalPages)} 
        disabled={pagination.page === pagination.totalPages}
      >
        Cuối
      </button>
      
      <select 
        value={pagination.pageSize} 
        onChange={(e) => setPageSize(Number(e.target.value))}
      >
        {[10, 20, 50, 100].map(size => (
          <option key={size} value={size}>{size} mục/trang</option>
        ))}
      </select>
    </div>
  </div>
);
```

## Sắp xếp dữ liệu

### Cấu hình sắp xếp

```typescript
interface SortConfig {
  // Trường sắp xếp ban đầu
  initialSortField?: string;
  
  // Hướng sắp xếp ban đầu ('asc' hoặc 'desc')
  initialSortDirection?: 'asc' | 'desc';
  
  // Có đồng bộ hóa với URL không
  syncWithUrl?: boolean;
}
```

### Sử dụng sắp xếp

```tsx
const {
  sort,
  setSort,
  toggleSort,
  clearSort,
} = useFilterPilot({
  // ...
  sortConfig: {
    initialSortField: 'name',
    initialSortDirection: 'asc',
  },
  // ...
});

// Trong component
return (
  <div>
    <table>
      <thead>
        <tr>
          <th onClick={() => toggleSort('name')}>
            Tên {sort?.field === 'name' && (sort.direction === 'asc' ? '↑' : '↓')}
          </th>
          <th onClick={() => toggleSort('price')}>
            Giá {sort?.field === 'price' && (sort.direction === 'asc' ? '↑' : '↓')}
          </th>
          <th onClick={() => toggleSort('category')}>
            Danh mục {sort?.field === 'category' && (sort.direction === 'asc' ? '↑' : '↓')}
          </th>
        </tr>
      </thead>
      <tbody>
        {/* ... */}
      </tbody>
    </table>
    
    <button onClick={clearSort}>Xóa sắp xếp</button>
  </div>
);
```

## Lưu trữ bộ lọc (Presets)

React Filter Pilot cho phép lưu trữ và tải lại các bộ lọc đã được cấu hình.

### Bật tính năng lưu trữ bộ lọc

```tsx
const {
  filters,
  setFilterValue,
  presets, // Chỉ có khi enablePresets = true
} = useFilterPilot({
  // ...
  enablePresets: true,
  // ...
});

// Trong component
return (
  <div>
    {/* ... */}
    
    {presets && (
      <div className="presets">
        <button
          onClick={() => {
            const name = prompt('Nhập tên cho bộ lọc:');
            if (name) {
              presets.savePreset(name);
            }
          }}
        >
          Lưu bộ lọc hiện tại
        </button>
        
        <div className="saved-presets">
          <h4>Bộ lọc đã lưu</h4>
          {presets.getPresets().map((preset) => (
            <div key={preset.id}>
              <span>{preset.name}</span>
              <button onClick={() => presets.loadPreset(preset)}>
                Áp dụng
              </button>
              <button onClick={() => presets.deletePreset(preset.id)}>
                Xóa
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
```

## Ví dụ thực tế

### Danh sách sản phẩm với bộ lọc đầy đủ

```tsx
import React from 'react';
import { useFilterPilot } from 'react-filter-pilot';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  inStock: boolean;
  brand: string;
}

interface ProductFilters {
  search: string;
  category: string;
  brands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  inStock: boolean;
}

const fetchProducts = async ({ filters, pagination, sort }: any) => {
  // Gọi API thực tế ở đây
  // ...
  
  return {
    data: products,
    totalRecords: totalCount,
  };
};

export function ProductList() {
  const {
    filters,
    setFilterValue,
    setFilters,
    resetFilters,
    data,
    isLoading,
    pagination,
    setPage,
    setPageSize,
    sort,
    toggleSort,
    hasActiveFilters,
    getActiveFiltersCount,
    presets,
  } = useFilterPilot<Product, ProductFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 300,
        urlKey: 'q',
      },
      {
        name: 'category',
        defaultValue: 'all',
        urlKey: 'cat',
      },
      {
        name: 'brands',
        defaultValue: [],
        urlKey: 'brands',
        transformToUrl: (value: string[]) => value.join(','),
        transformFromUrl: (value: string) => value ? value.split(',') : [],
      },
      {
        name: 'priceRange',
        defaultValue: { min: 0, max: 1000 },
        transformToUrl: (value) => `${value.min}-${value.max}`,
        transformFromUrl: (value) => {
          const [min, max] = value.split('-').map(Number);
          return { min, max };
        },
      },
      {
        name: 'rating',
        defaultValue: 0,
        transformToUrl: (value) => value.toString(),
        transformFromUrl: (value) => parseInt(value, 10),
      },
      {
        name: 'inStock',
        defaultValue: false,
        transformToUrl: (value) => value ? '1' : '0',
        transformFromUrl: (value) => value === '1',
      },
    ],
    paginationConfig: {
      initialPageSize: 12,
      pageSizeOptions: [6, 12, 24, 48],
      resetOnFilterChange: true,
    },
    sortConfig: {
      initialSortField: 'name',
      initialSortDirection: 'asc',
    },
    fetchConfig: {
      fetchFn: fetchProducts,
      staleTime: 5 * 60 * 1000, // 5 phút
    },
    enablePresets: true,
  });

  // Render UI với các bộ lọc, danh sách sản phẩm và phân trang
  // ...
}
```

### Danh sách bài viết blog với cuộn vô hạn

```tsx
import React, { useRef, useCallback, useEffect } from 'react';
import { useFilterPilotInfinite } from 'react-filter-pilot';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
}

interface BlogFilters {
  search: string;
  category: string;
  tags: string[];
}

export function BlogList() {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    filters,
    setFilterValue,
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFilterPilotInfinite<BlogPost, BlogFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 500,
        urlKey: 'q',
      },
      {
        name: 'category',
        defaultValue: 'all',
        urlKey: 'cat',
      },
      {
        name: 'tags',
        defaultValue: [],
        urlKey: 'tags',
        transformToUrl: (value: string[]) => value.join(','),
        transformFromUrl: (value: string) => value ? value.split(',') : [],
      },
    ],
    fetchConfig: {
      fetchFn: async ({ filters, cursor }) => {
        // Gọi API thực tế ở đây
        // ...
        
        return {
          data: posts,
          totalRecords: totalCount,
          nextCursor: nextCursor,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  });

  // Thiết lập Intersection Observer cho cuộn vô hạn
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px 400px 0px',
    });
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  // Render UI với các bộ lọc và danh sách bài viết
  // ...
  
  return (
    <div>
      {/* Bộ lọc */}
      {/* ... */}
      
      {/* Danh sách bài viết */}
      <div className="blog-posts">
        {data.map(post => (
          <div key={post.id} className="blog-post">
            {/* ... */}
          </div>
        ))}
        
        {/* Element để theo dõi cuộn */}
        <div ref={observerTarget} style={{ height: 20 }} />
        
        {isFetchingNextPage && <div>Đang tải thêm...</div>}
      </div>
    </div>
  );
}
```

### Quản lý người dùng với mutation

```tsx
import React, { useState } from 'react';
import { useFilterPilot, useFilterMutation } from 'react-filter-pilot';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
}

export function UserManagement() {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Sử dụng FilterPilot cho danh sách người dùng
  const filterPilot = useFilterPilot<User, UserFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 300,
      },
      {
        name: 'role',
        defaultValue: 'all',
      },
      {
        name: 'status',
        defaultValue: 'all',
      },
    ],
    paginationConfig: {
      initialPageSize: 10,
    },
    fetchConfig: {
      fetchFn: async ({ filters, pagination }) => {
        // Gọi API thực tế ở đây
        // ...
        
        return {
          data: users,
          totalRecords: totalCount,
        };
      },
    },
  });

  // Mutation để cập nhật người dùng
  const updateMutation = useFilterMutation<User, UserFilters, User, Partial<User> & { id: string }>({
    filterPilot,
    mutationFn: async (userData) => {
      // Gọi API cập nhật
      const response = await fetch(`/api/users/${userData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    optimisticUpdate: (variables) => {
      // Cập nhật lạc quan
      return filterPilot.data?.map(user => 
        user.id === variables.id ? { ...user, ...variables } : user
      ) || [];
    },
    onSuccess: () => {
      setEditingUser(null);
    },
  });

  // Mutation để xóa người dùng
  const deleteMutation = useFilterMutation<User, UserFilters, { success: boolean }, string>({
    filterPilot,
    mutationFn: async (userId) => {
      // Gọi API xóa
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      return { success: true };
    },
    optimisticUpdate: (userId) => {
      // Cập nhật lạc quan
      return filterPilot.data?.filter(user => user.id !== userId) || [];
    },
  });

  // Render UI với bảng người dùng và các chức năng chỉnh sửa/xóa
  // ...
}
```

---

Với hướng dẫn này, bạn đã có thể sử dụng đầy đủ các tính năng của React Filter Pilot trong dự án của mình. Thư viện này giúp đơn giản hóa việc quản lý bộ lọc, phân trang và sắp xếp dữ liệu, đồng thời tích hợp tốt với TanStack Query để tối ưu hiệu suất và trải nghiệm người dùng.