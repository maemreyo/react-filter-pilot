# Hướng dẫn tích hợp Mantine React Table với react-filter-pilot

Hướng dẫn này sẽ giúp bạn tích hợp `Mantine React Table` với `react-filter-pilot` để quản lý phân trang, lọc và sắp xếp dữ liệu một cách hiệu quả.

## Cài đặt

```bash
# Cài đặt react-filter-pilot
pnpm add @matthew.ngo/react-filter-pilot

# Cài đặt mantine-react-table và các dependencies
pnpm add mantine-react-table @mantine/core @mantine/hooks @tabler/icons-react @tanstack/react-table
```

## Tích hợp cơ bản

Dưới đây là các bước cơ bản để tích hợp Mantine React Table với react-filter-pilot:

### 1. Tạo adapter tùy chỉnh cho Next.js App Router

```typescript
// app/utils/nextJsAppCustom.ts
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useNextJsAppCustomUrlHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  return {
    getParams: () => {
      const params = new URLSearchParams();
      Array.from(searchParams.entries()).forEach(([key, value]) => {
        params.set(key, value);
      });
      return params;
    },
    setParams: (params) => {
      const search = params.toString();
      const query = search ? `?${search}` : '';
      router.replace(`${pathname}${query}`);
    },
  };
}
```

### 2. Tạo hook tùy chỉnh để quản lý dữ liệu

```typescript
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useFilterPilot } from '@matthew.ngo/react-filter-pilot';
import { useNextJsAppCustomUrlHandler } from '@/app/utils/nextJsAppCustom';
import { type MRT_PaginationState } from 'mantine-react-table';

export function useDataTable<TData, TFilters>({
  fetchData,
  filterConfigs,
  initialPageSize = 10,
}) {
  // Sử dụng Next.js App Router URL handler
  const urlHandler = useNextJsAppCustomUrlHandler();

  // Sử dụng FilterPilot để quản lý trạng thái lọc và phân trang
  const filterPilot = useFilterPilot<TData, TFilters>({
    filterConfigs,
    paginationConfig: {
      initialPageSize,
      pageSizeOptions: [10, 20, 50],
      resetOnFilterChange: true,
    },
    fetchConfig: {
      fetchFn: fetchData,
      staleTime: 5 * 60 * 1000, // 5 phút
      gcTime: 10 * 60 * 1000, // 10 phút
    },
    urlHandler: urlHandler,
  });

  // Đồng bộ hóa trạng thái phân trang giữa FilterPilot và MantineReactTable
  const [tablePagination, setTablePagination] = useState<MRT_PaginationState>({
    pageIndex: filterPilot.pagination.page - 1, // MRT sử dụng pageIndex bắt đầu từ 0
    pageSize: filterPilot.pagination.pageSize,
  });

  // Cập nhật phân trang khi FilterPilot thay đổi
  useMemo(() => {
    setTablePagination({
      pageIndex: filterPilot.pagination.page - 1,
      pageSize: filterPilot.pagination.pageSize,
    });
  }, [filterPilot.pagination.page, filterPilot.pagination.pageSize]);

  // Xử lý khi MantineReactTable thay đổi phân trang
  const handlePaginationChange = useCallback((updatedPagination: MRT_PaginationState) => {
    // Cập nhật FilterPilot
    filterPilot.setPage(updatedPagination.pageIndex + 1);
    filterPilot.setPageSize(updatedPagination.pageSize);
    
    // Cập nhật trạng thái local
    setTablePagination(updatedPagination);
  }, [filterPilot]);

  return {
    filterPilot,
    tablePagination,
    handlePaginationChange,
  };
}
```

### 3. Sử dụng trong component

```tsx
'use client';

import { useMemo } from 'react';
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';
import { useDataTable } from './useDataTable';

export function MyDataTable() {
  // Định nghĩa cột
  const columns = useMemo(() => [
    // Định nghĩa cột ở đây
  ], []);

  // Hàm fetch data
  const fetchData = useCallback(async ({ filters, pagination, sort }) => {
    // Xử lý fetch data ở đây
    return {
      data: result?.data || [],
      totalRecords: result?.total || 0,
    };
  }, []);

  // Sử dụng hook tùy chỉnh
  const { filterPilot, tablePagination, handlePaginationChange } = useDataTable({
    fetchData,
    filterConfigs: [
      // Cấu hình bộ lọc ở đây
    ],
    initialPageSize: 10,
  });

  // Khởi tạo MantineReactTable
  const table = useMantineReactTable({
    columns,
    data: filterPilot.data,
    manualPagination: true,
    rowCount: filterPilot.pagination.totalRecords,
    onPaginationChange: handlePaginationChange,
    state: {
      pagination: tablePagination,
      isLoading: filterPilot.isLoading,
    },
    // Các cấu hình khác
  });

  return (
    <div>
      {/* Bộ lọc tùy chỉnh */}
      <div>
        {/* Các bộ lọc ở đây */}
      </div>
      
      {/* Bảng */}
      <MantineReactTable table={table} />
    </div>
  );
}
```

## Điểm khác biệt giữa Mantine React Table và react-filter-pilot

### Mantine React Table:
- Sử dụng `pageIndex` bắt đầu từ 0
- Quản lý trạng thái phân trang nội bộ
- Cung cấp UI cho bảng và phân trang

### react-filter-pilot:
- Sử dụng `page` bắt đầu từ 1
- Quản lý trạng thái lọc, phân trang và đồng bộ với URL
- Không cung cấp UI, chỉ quản lý trạng thái

## Xử lý sự khác biệt

Khi tích hợp hai thư viện này, cần lưu ý:

1. **Chuyển đổi pageIndex/page**:
   ```typescript
   // Từ FilterPilot sang MRT
   const pageIndex = filterPilot.pagination.page - 1;
   
   // Từ MRT sang FilterPilot
   const page = mrt.pagination.pageIndex + 1;
   ```

2. **Đồng bộ hóa trạng thái**:
   - Khi FilterPilot thay đổi, cập nhật trạng thái của MRT
   - Khi MRT thay đổi, cập nhật trạng thái của FilterPilot

3. **Quản lý dữ liệu**:
   - Sử dụng FilterPilot để fetch dữ liệu
   - Truyền dữ liệu từ FilterPilot sang MRT

## Ví dụ đầy đủ

Xem các ví dụ đầy đủ trong thư mục `examples`:
- `examples/mantine-react-table-example.tsx`: Ví dụ cơ bản
- `examples/mantine-react-table-approval-example.tsx`: Ví dụ với ApprovalRequest

## Lưu ý quan trọng

1. Luôn sử dụng `'use client';` ở đầu file khi sử dụng trong Next.js App Router
2. Đảm bảo rằng bạn đã cài đặt đầy đủ các dependencies
3. Sử dụng `useMemo` và `useCallback` để tối ưu hiệu suất
4. Xử lý đúng sự khác biệt về index giữa hai thư viện

## Tùy chỉnh nâng cao

### Tùy chỉnh UI của Mantine React Table

```tsx
const table = useMantineReactTable({
  // ...
  mantineTableProps: {
    striped: true,
    highlightOnHover: true,
    withColumnBorders: false,
  },
  mantinePaginationProps: {
    showRowsPerPage: true,
    rowsPerPageOptions: ['10', '20', '50'],
  },
  renderTopToolbarCustomActions: () => (
    <div>
      {/* UI tùy chỉnh */}
    </div>
  ),
});
```

### Tùy chỉnh bộ lọc

```tsx
<div style={{ marginBottom: '1rem' }}>
  <input
    type="text"
    placeholder="Tìm kiếm..."
    value={filterPilot.filters.search}
    onChange={(e) => filterPilot.setFilterValue('search', e.target.value)}
  />
  <select
    value={filterPilot.filters.status || ''}
    onChange={(e) => 
      filterPilot.setFilterValue('status', e.target.value || null)
    }
  >
    <option value="">Tất cả</option>
    {/* Các tùy chọn khác */}
  </select>
  <button onClick={() => filterPilot.resetFilters()}>
    Đặt lại bộ lọc
  </button>
</div>
```

## Kết luận

Tích hợp Mantine React Table với react-filter-pilot giúp bạn tận dụng được ưu điểm của cả hai thư viện:
- UI đẹp và đầy đủ tính năng từ Mantine React Table
- Quản lý trạng thái lọc, phân trang và đồng bộ URL từ react-filter-pilot

Với cách tiếp cận này, bạn có thể xây dựng các bảng dữ liệu mạnh mẽ, dễ sử dụng và thân thiện với SEO.