# Mantine React Table Integration Guide

This guide shows how to integrate `react-filter-pilot` with `mantine-react-table` for server-side pagination, sorting, and filtering.

## Installation

```bash
npm install react-filter-pilot @tanstack/react-query mantine-react-table @mantine/core @mantine/hooks @tabler/icons-react
```

## Basic Integration

### 1. Connect State Management

The key is to set `manualPagination`, `manualSorting`, and `manualFiltering` to `true` in Mantine React Table:

```tsx
const table = useMantineReactTable({
  columns,
  data: data || [],
  
  // Enable manual/server-side features
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  
  // Connect state from react-filter-pilot
  state: {
    isLoading,
    pagination: {
      pageIndex: pagination.page - 1, // MRT uses 0-based index
      pageSize: pagination.pageSize,
    },
    sorting: sort ? [{
      id: sort.field,
      desc: sort.direction === 'desc',
    }] : [],
  },
  
  // Important: Set total row count for pagination
  rowCount: pagination.totalRecords,
});
```

### 2. Handle Pagination Changes

Mantine React Table uses 0-based page indexing, while react-filter-pilot uses 1-based:

```tsx
onPaginationChange: (updater) => {
  if (typeof updater === 'function') {
    const newPagination = updater({
      pageIndex: pagination.page - 1,
      pageSize: pagination.pageSize,
    });
    setPage(newPagination.pageIndex + 1); // Convert to 1-based
    setPageSize(newPagination.pageSize);
  }
},
```

### 3. Handle Sorting Changes

```tsx
onSortingChange: (updater) => {
  if (typeof updater === 'function') {
    const newSorting = updater(
      sort ? [{
        id: sort.field,
        desc: sort.direction === 'desc',
      }] : []
    );
    
    if (newSorting.length > 0) {
      setSort(newSorting[0].id, newSorting[0].desc ? 'desc' : 'asc');
    } else {
      setSort('', 'asc'); // Clear sorting
    }
  }
},
```

## Advanced Features

### Custom Filters in Toolbar

You can disable Mantine's built-in filters and use react-filter-pilot's filters:

```tsx
const table = useMantineReactTable({
  // Disable built-in filters
  enableColumnFilters: false,
  enableGlobalFilter: false,
  
  // Add custom toolbar
  renderTopToolbar: ({ table }) => (
    <Box p="md">
      <TextInput
        placeholder="Search..."
        value={filters.search}
        onChange={(e) => setFilterValue('search', e.target.value)}
      />
      {/* Add more custom filters */}
    </Box>
  ),
});
```

### Using Column Filters

If you want to use Mantine's column filters with server-side filtering:

```tsx
const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);

// Update react-filter-pilot when column filters change
useEffect(() => {
  const filterObject: Record<string, any> = {};
  columnFilters.forEach((filter) => {
    filterObject[filter.id] = filter.value;
  });
  setFilterValue('columnFilters', filterObject);
}, [columnFilters]);

const table = useMantineReactTable({
  state: {
    columnFilters,
  },
  onColumnFiltersChange: setColumnFilters,
  enableColumnFilters: true,
});
```

### Row Selection with Server Data

```tsx
const [rowSelection, setRowSelection] = useState({});

const table = useMantineReactTable({
  // ... other config
  enableRowSelection: true,
  state: {
    rowSelection,
  },
  onRowSelectionChange: setRowSelection,
  // Use unique row id
  getRowId: (row) => row.id,
});
```

## Complete Example with TypeScript

```tsx
import { useFilterPilot } from 'react-filter-pilot';
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';

interface DataType {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface FiltersType {
  search: string;
  status: string;
}

function ServerSideTable() {
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
  } = useFilterPilot<DataType, FiltersType>({
    filterConfigs: [
      { name: 'search', defaultValue: '', debounceMs: 300 },
      { name: 'status', defaultValue: 'all' },
    ],
    fetchConfig: {
      fetchFn: async ({ filters, pagination, sort }) => {
        // Your API call
        const response = await fetch('/api/data', {
          method: 'POST',
          body: JSON.stringify({ filters, pagination, sort }),
        });
        return response.json();
      },
    },
  });

  const table = useMantineReactTable({
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'status', header: 'Status' },
    ],
    data: data || [],
    manualPagination: true,
    manualSorting: true,
    state: {
      isLoading,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      },
      sorting: sort ? [{ id: sort.field, desc: sort.direction === 'desc' }] : [],
    },
    rowCount: pagination.totalRecords,
    onPaginationChange: (updater) => {
      // Handle pagination
    },
    onSortingChange: (updater) => {
      // Handle sorting
    },
  });

  return <MantineReactTable table={table} />;
}
```

## Tips

1. **Performance**: Use `debounceMs` for search filters to avoid too many API calls
2. **Loading States**: Mantine React Table will show loading overlay when `isLoading` is true
3. **Empty State**: Customize empty state with `renderEmptyRowsFallback`
4. **Pagination Options**: Set `pageSizeOptions` in react-filter-pilot to match Mantine's dropdown

## Common Issues

### Issue: Page jumps to 1 on every change
**Solution**: Make sure you're not resetting pagination on filter changes unintentionally. Use `resetOnFilterChange: false` if needed.

### Issue: Sorting doesn't work
**Solution**: Ensure column `accessorKey` matches the field names your API expects.

### Issue: Total pages showing incorrectly
**Solution**: Always set `rowCount` prop with the total number of records from your API.