import React, { useMemo } from 'react';
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from 'mantine-react-table';
import { useDefaultUrlHandler, useFilterPilot } from 'react-filter-pilot';

// Simple User type
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Minimal example focusing on pagination
export function SimpleMantineTableExample() {
  const {
    data,
    isLoading,
    pagination,
    setPage,
    setPageSize,
  } = useFilterPilot<User, {}>({
    filterConfigs: [],
    paginationConfig: {
      initialPage: 1,
      initialPageSize: 5,
      pageSizeOptions: [5, 10, 20],
      syncWithUrl: true,
    },
    fetchConfig: {
      fetchFn: async ({ pagination }) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - in real app, this would be your API call
        const mockData: User[] = Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          age: 20 + (i % 40),
        }));
        
        // Simulate pagination
        const start = (pagination.page - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        const paginatedData = mockData.slice(start, end);
        
        return {
          data: paginatedData,
          totalRecords: mockData.length,
        };
      },
    },
  });

  // Define columns
  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'age',
        header: 'Age',
        size: 60,
      },
    ],
    []
  );

  // Create table instance
  const table = useMantineReactTable({
    columns,
    data: data || [],
    
    // IMPORTANT: Enable manual pagination for server-side
    manualPagination: true,
    
    // Connect loading state
    state: {
      isLoading,
      // Convert react-filter-pilot's 1-based to MRT's 0-based pagination
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      },
    },
    
    // IMPORTANT: Set total row count for proper pagination
    rowCount: pagination.totalRecords,
    
    // Handle pagination changes
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const currentState = {
          pageIndex: pagination.page - 1,
          pageSize: pagination.pageSize,
        };
        const newState = updater(currentState);
        console.log('New Pagination State:', newState);
        // Convert back to 1-based index for react-filter-pilot
        if (newState.pageIndex !== currentState.pageIndex) {
          setPage(newState.pageIndex + 1);
        }
        if (newState.pageSize !== currentState.pageSize) {
          setPageSize(newState.pageSize);
        }
      }
    },
    
    // Optional: Customize pagination display
    mantinePaginationProps: {
      rowsPerPageOptions: ['5', '10', '20'],
    },
    
    // Optional: Position pagination at both top and bottom
    positionPagination: 'both',
  });

  return (
    <div>
      <h2>Simple Mantine Table with react-filter-pilot</h2>
      <MantineReactTable table={table} />
    </div>
  );
}