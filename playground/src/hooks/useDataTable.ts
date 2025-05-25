'use client';

import { useState, useCallback, useMemo } from 'react';
import { useFilterPilot } from '../../../src';
import { useNextJsAppCustomUrlHandler } from '../../../src/adapters/nextJsAppCustom';
import { type MRT_PaginationState } from 'mantine-react-table';

/**
 * Hook tùy chỉnh để quản lý dữ liệu cho Mantine React Table với react-filter-pilot
 */
export function useDataTable<TData, TFilters>({
  fetchData,
  filterConfigs,
  initialPageSize = 10,
  staleTime = 5 * 60 * 1000, // 5 phút
  gcTime = 10 * 60 * 1000, // 10 phút
}: {
  fetchData: (params: any) => Promise<{ data: TData[]; totalRecords: number }>;
  filterConfigs: any[];
  initialPageSize?: number;
  staleTime?: number;
  gcTime?: number;
}) {
  // Sử dụng Next.js App Router URL handler

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
      staleTime,
      gcTime,
    },
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

  // Trả về các giá trị và hàm cần thiết
  return {
    // Dữ liệu và trạng thái
    data: filterPilot.data,
    isLoading: filterPilot.isLoading,
    isError: filterPilot.isError,
    
    // Bộ lọc
    filters: filterPilot.filters,
    setFilterValue: filterPilot.setFilterValue,
    setFilters: filterPilot.setFilters,
    resetFilters: filterPilot.resetFilters,
    
    // Phân trang FilterPilot (page bắt đầu từ 1)
    pagination: filterPilot.pagination,
    setPage: filterPilot.setPage,
    setPageSize: filterPilot.setPageSize,
    
    // Phân trang MantineReactTable (pageIndex bắt đầu từ 0)
    tablePagination,
    handlePaginationChange,
    
    // Truy cập trực tiếp đến FilterPilot nếu cần
    filterPilot,
  };
}

export default useDataTable;