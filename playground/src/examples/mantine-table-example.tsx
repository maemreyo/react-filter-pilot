import React, { useMemo } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
} from 'mantine-react-table';
import { useFilterPilot, useHashUrlHandler } from 'react-filter-pilot';
import { Box, TextInput, Select, Group, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconRefresh, IconFilter } from '@tabler/icons-react';

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  status: 'active' | 'inactive' | 'pending';
  department: string;
  joinDate: string;
}

interface UserFilters {
  globalSearch: string;
  status: string;
  department: string;
  ageRange: {
    min: number;
    max: number;
  };
}

// Mock fetch function
const fetchUsers = async ({ 
  filters, 
  pagination, 
  sort 
}: {
  filters: UserFilters;
  pagination: { page: number; pageSize: number };
  sort?: { field: string; direction: 'asc' | 'desc' };
}) => {
  // Simulate API call
  const params = new URLSearchParams({
    search: filters.globalSearch,
    status: filters.status,
    department: filters.department,
    minAge: filters.ageRange.min.toString(),
    maxAge: filters.ageRange.max.toString(),
    page: pagination.page.toString(),
    pageSize: pagination.pageSize.toString(),
    ...(sort && {
      sortBy: sort.field,
      sortOrder: sort.direction,
    }),
  });

  const response = await fetch(`/api/users?${params}`);
  
  // For demo, returning mock data
  return {
    data: generateMockUsers(pagination.pageSize, pagination.page),
    totalRecords: 150, // Mock total
  };
};

// Mock data generator
function generateMockUsers(pageSize: number, page: number): User[] {
  const departments = ['Sales', 'Engineering', 'Marketing', 'HR', 'Finance'];
  const statuses: Array<'active' | 'inactive' | 'pending'> = ['active', 'inactive', 'pending'];
  
  return Array.from({ length: pageSize }, (_, i) => {
    const index = (page - 1) * pageSize + i;
    return {
      id: `user-${index}`,
      firstName: `First${index}`,
      lastName: `Last${index}`,
      email: `user${index}@example.com`,
      age: 20 + Math.floor(Math.random() * 40),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1).toISOString(),
    };
  });
}

export function MantineTableWithFilterPilot() {
  // Sử dụng URL handler mặc định
  const urlHandler = useHashUrlHandler();

  // Use react-filter-pilot for state management
  const {
    filters,
    setFilterValue,
    data,
    isLoading,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
    hasActiveFilters,
    resetFilters,
    refetch,
  } = useFilterPilot<User, UserFilters>({
    urlHandler, // Thêm URL handler để đồng bộ hóa với URL
    filterConfigs: [
      {
        name: 'globalSearch',
        defaultValue: '',
        debounceMs: 300,
        urlKey: 'q',
      },
      {
        name: 'status',
        defaultValue: 'all',
        urlKey: 'status',
      },
      {
        name: 'department',
        defaultValue: 'all',
        urlKey: 'dept',
      },
      {
        name: 'ageRange',
        defaultValue: { min: 0, max: 100 },
        transformToUrl: (value) => `${value.min}-${value.max}`,
        transformFromUrl: (value) => {
          const [min, max] = value.split('-').map(Number);
          return { min, max };
        },
      },
    ],
    paginationConfig: {
      initialPage: 1,
      initialPageSize: 10,
      pageSizeOptions: [5, 10, 20, 50],
      resetOnFilterChange: true,
      syncWithUrl: true, // Đồng bộ hóa phân trang với URL
    },
    sortConfig: {
      initialSortField: 'firstName',
      initialSortDirection: 'asc',
    },
    fetchConfig: {
      fetchFn: fetchUsers,
      staleTime: 5 * 60 * 1000,
    },
  });

  // Define columns
  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'firstName',
        header: 'First Name',
        size: 150,
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
        size: 150,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 250,
      },
      {
        accessorKey: 'age',
        header: 'Age',
        size: 100,
        Cell: ({ cell }) => (
          <Box style={{ textAlign: 'center' }}>
            {cell.getValue<number>()}
          </Box>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          const color = 
            status === 'active' ? 'green' : 
            status === 'inactive' ? 'red' : 
            'yellow';
          
          return (
            <Badge color={color} variant="filled">
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'department',
        header: 'Department',
        size: 150,
      },
      {
        accessorKey: 'joinDate',
        header: 'Join Date',
        size: 150,
        Cell: ({ cell }) => 
          new Date(cell.getValue<string>()).toLocaleDateString(),
      },
    ],
    []
  );

  // Mantine React Table instance
  const table = useMantineReactTable({
    columns,
    data: data || [],
    
    // Connect to react-filter-pilot state
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    
    // State
    state: {
      isLoading,
      pagination: {
        pageIndex: pagination.page - 1, // MRT uses 0-based index
        pageSize: pagination.pageSize,
      },
      showGlobalFilter: true,
    },
    
    // Row count
    rowCount: pagination.totalRecords,
    
    // Pagination handlers
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const currentState = {
          pageIndex: pagination.page - 1,
          pageSize: pagination.pageSize,
        };
        const newState = updater(currentState);
        
        console.log('New state:', newState);
        // Convert back to 1-based index for react-filter-pilot
        if (newState.pageIndex !== currentState.pageIndex) {
          setPage(newState.pageIndex + 1);
        }
        if (newState.pageSize !== currentState.pageSize) {
          setPageSize(newState.pageSize);
        }
      }
    },
    
    // Enable features
    enableColumnFilters: false, // We use our own filters
    enableGlobalFilter: false, // We use our own global search
    enableRowSelection: true,
    enablePinning: true,
    
    // Customize components
    renderTopToolbar: ({ table }) => (
      <Box p="md">
        <Group  mb="md">
          <Group>
            <TextInput
              placeholder="Search all columns..."
              value={filters.globalSearch}
              onChange={(e) => setFilterValue('globalSearch', e.target.value)}
              style={{ width: 300 }}
            />
            
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => setFilterValue('status', value || 'all')}
              data={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
              ]}
              style={{ width: 150 }}
            />
            
            <Select
              placeholder="Department"
              value={filters.department}
              onChange={(value) => setFilterValue('department', value || 'all')}
              data={[
                { value: 'all', label: 'All Departments' },
                { value: 'Sales', label: 'Sales' },
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'HR', label: 'HR' },
                { value: 'Finance', label: 'Finance' },
              ]}
              style={{ width: 180 }}
            />
          </Group>
          
          <Group>
            {hasActiveFilters() && (
              <Tooltip label="Clear all filters">
                <ActionIcon 
                  onClick={resetFilters}
                  color="red"
                  variant="subtle"
                >
                  <IconFilter size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            
            <Tooltip label="Refresh data">
              <ActionIcon 
                onClick={() => refetch()}
                color="blue"
                variant="subtle"
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        
        {/* Show active filter count */}
        {hasActiveFilters() && (
          <Badge color="blue" variant="light">
            {Object.entries(filters).filter(([key, value]) => {
              if (key === 'globalSearch') return value !== '';
              if (key === 'status' || key === 'department') return value !== 'all';
              if (key === 'ageRange') return value.min !== 0 || value.max !== 100;
              return false;
            }).length} active filters
          </Badge>
        )}
      </Box>
    ),
  });

  return <MantineReactTable table={table} />;
}

// Example with server-side everything
export function AdvancedMantineTableExample() {
  // You can also handle column filters from Mantine Table
  const [columnFilters, setColumnFilters] = React.useState<MRT_ColumnFiltersState>([]);
  
  // Sử dụng URL handler mặc định
  const urlHandler = useHashUrlHandler();
  
  const {
    filters,
    setFilterValue,
    setFilters,
    data,
    isLoading,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
  } = useFilterPilot<User, any>({
    urlHandler, // Thêm URL handler để đồng bộ hóa với URL
    filterConfigs: [
      {
        name: 'filters',
        defaultValue: {},
        // Transform column filters to API format
        transformForApi: (value) => {
          const apiFilters: Record<string, any> = {};
          columnFilters.forEach((filter) => {
            apiFilters[filter.id] = filter.value;
          });
          return apiFilters;
        },
      },
    ],
    paginationConfig: {
      external: false, // Let react-filter-pilot handle pagination
      syncWithUrl: true, // Đồng bộ hóa phân trang với URL
    },
    fetchConfig: {
      fetchFn: async ({ filters, pagination, sort }) => {
        // Your API call here
        console.log('Fetching with:', { filters, pagination, sort });
        
        return {
          data: generateMockUsers(pagination.pageSize, pagination.page),
          totalRecords: 150,
        };
      },
    },
  });

  // Update filters when column filters change
  React.useEffect(() => {
    const filterObject: Record<string, any> = {};
    columnFilters.forEach((filter) => {
      filterObject[filter.id] = filter.value;
    });
    setFilterValue('filters', filterObject);
  }, [columnFilters]);

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'firstName',
        header: 'First Name',
        filterVariant: 'text',
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
        filterVariant: 'text',
      },
      {
        accessorKey: 'age',
        header: 'Age',
        filterVariant: 'range',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        filterVariant: 'select',
        mantineFilterSelectProps: {
          data: ['active', 'inactive', 'pending'],
        },
      },
      {
        accessorKey: 'department',
        header: 'Department',
        filterVariant: 'multi-select',
        mantineFilterMultiSelectProps: {
          data: ['Sales', 'Engineering', 'Marketing', 'HR', 'Finance'],
        },
      },
    ],
    []
  );

  const table = useMantineReactTable({
    columns,
    data: data || [],
    
    // Enable server-side features
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    
    // State
    state: {
      isLoading,
      columnFilters,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      },
    },
    
    // Handlers
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const currentState = {
          pageIndex: pagination.page - 1,
          pageSize: pagination.pageSize,
        };
        const newState = updater(currentState);
        
        // Convert back to 1-based index for react-filter-pilot
        if (newState.pageIndex !== currentState.pageIndex) {
          setPage(newState.pageIndex + 1);
        }
        if (newState.pageSize !== currentState.pageSize) {
          setPageSize(newState.pageSize);
        }
      }
    },
  
    
    // Row count for pagination
    rowCount: pagination.totalRecords,
    
    // Features
    enableColumnFilters: true,
    enableFilters: true,
    enableSorting: true,
  });

  return <MantineReactTable table={table} />;
}