import React, { useMemo } from 'react';
import { useFilterPilot } from 'react-filter-pilot';
import type {
  FilterConfig,
  FetchConfig,
  FetchFnParams,
  PaginationConfig,
  SortConfig,
  OptionType,
} from 'react-filter-pilot';
import './BasicTaskList.css';

// 1. Define Types
interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO string
}

interface TaskFilters {
  titleSearch?: string;
  status?: Task['status'];
  priority?: Task['priority'];
}

type TaskSortField = 'title' | 'status' | 'priority' | 'dueDate';

// 2. Static Data Source - Defined outside component, so it's already stable
const allTasksData: Task[] = [
  {
    id: '1',
    title: 'Finalize report Q2',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2025-06-28T00:00:00Z',
  },
  {
    id: '2',
    title: 'Book flight tickets',
    status: 'pending',
    priority: 'medium',
    dueDate: '2025-07-05T00:00:00Z',
  },
  {
    id: '3',
    title: 'Team meeting slides',
    status: 'completed',
    priority: 'high',
    dueDate: '2025-06-20T00:00:00Z',
  },
  {
    id: '4',
    title: 'Submit expense report',
    status: 'pending',
    priority: 'low',
    dueDate: '2025-06-30T00:00:00Z',
  },
  { id: '5', title: 'Plan project roadmap', status: 'in-progress', priority: 'high' },
  {
    id: '6',
    title: 'Review PR #123',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2025-06-26T00:00:00Z',
  },
  { id: '7', title: 'Onboard new intern', status: 'pending', priority: 'medium' },
  {
    id: '8',
    title: 'Update documentation',
    status: 'completed',
    priority: 'low',
    dueDate: '2025-06-15T00:00:00Z',
  },
  { id: '9', title: 'Research new tools', status: 'in-progress', priority: 'low' },
  {
    id: '10',
    title: 'Client call follow-up',
    status: 'pending',
    priority: 'high',
    dueDate: '2025-06-27T00:00:00Z',
  },
  {
    id: '11',
    title: 'Fix critical bug #789',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2025-06-25T00:00:00Z',
  },
  {
    id: '12',
    title: 'Write weekly summary',
    status: 'pending',
    priority: 'medium',
    dueDate: '2025-06-28T00:00:00Z',
  },
];

// 4. Client-Side `fetchFn` - Defined outside component, so it's already stable
const fetchTasksClientSide: FetchConfig<Task, TaskFilters, TaskSortField>['fetchFn'] = async (
  params: FetchFnParams<TaskFilters, TaskSortField>
) => {
  console.log('Client-side fetch with params:', params);
  // Simulate network delay for realism
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  let filteredTasks = [...allTasksData];

  // Apply filters
  if (params.filters.titleSearch) {
    filteredTasks = filteredTasks.filter((task) =>
      task.title.toLowerCase().includes(params.filters.titleSearch!.toLowerCase())
    );
  }
  if (params.filters.status) {
    filteredTasks = filteredTasks.filter((task) => task.status === params.filters.status);
  }
  if (params.filters.priority) {
    filteredTasks = filteredTasks.filter((task) => task.priority === params.filters.priority);
  }

  // Apply sorting
  if (params.sort && params.sort.field) {
    const { field, direction } = params.sort;
    filteredTasks.sort((a, b) => {
      const valA = a[field as keyof Task];
      const valB = b[field as keyof Task];

      if (valA == null && valB == null) return 0;
      if (valA == null) return direction === 'asc' ? -1 : 1; // Nulls first for asc, last for desc
      if (valB == null) return direction === 'asc' ? 1 : -1;

      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else {
        if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;
      }
      return direction === 'desc' ? comparison * -1 : comparison;
    });
  }

  const totalRecords = filteredTasks.length;

  // Apply pagination
  let paginatedTasks = filteredTasks;
  if (params.pagination) {
    const { page, pageSize } = params.pagination;
    paginatedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);
  }

  return { data: paginatedTasks, totalRecords };
};

// 8. The React Component (`BasicTaskList`)
// Use React.memo to prevent unnecessary re-renders
export const BasicTaskList = React.memo(function BasicTaskList() {
  // 3. Memoize filterConfigs to prevent re-renders
  const filterConfigs = useMemo<FilterConfig<TaskFilters>[]>(
    () => [
      {
        name: 'titleSearch',
        type: 'text',
        label: 'Search Title',
        placeholder: 'Enter task title...',
        defaultValue: '',
        debounceMs: 250,
      },
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        placeholder: 'Any Status',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Completed', value: 'completed' },
        ] as OptionType<Task['status']>[],
        defaultValue: undefined,
      },
      {
        name: 'priority',
        type: 'select',
        label: 'Priority',
        placeholder: 'Any Priority',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ] as OptionType<Task['priority']>[],
        defaultValue: undefined,
      },
    ],
    []
  ); // Empty dependency array means this will only be calculated once

  // 5. Memoize fetchConfig with additional options to control fetching
  const tasksFetchConfig = useMemo<FetchConfig<Task, TaskFilters, TaskSortField>>(
    () => ({
      fetchFn: fetchTasksClientSide,
      queryKeyBase: ['clientTasks'], // Unique key for TanStack Query
      // Add TanStack Query options to control refetching behavior
      tanstackQueryOptions: {
        staleTime: Infinity, // Data never becomes stale automatically
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: false, // Don't refetch when component mounts
        refetchOnReconnect: false, // Don't refetch when network reconnects
        retry: false, // Don't retry failed requests
        cacheTime: Infinity, // Keep data in cache indefinitely
      },
      // Use enabled option to control when the query runs
      enabled: (currentState) => {
        // Only run the query when filters, pagination, or sort state changes
        // This is a simple implementation - you might need to customize based on your needs
        return true; // Always enabled but controlled by other options
      },
    }),
    []
  ); // No dependencies, only calculated once

  // 6. Memoize paginationConfig
  const paginationConfig = useMemo<PaginationConfig>(
    () => ({
      initialPage: 1,
      initialPageSize: 5,
      pageSizeOptions: [3, 5, 10, 15],
    }),
    []
  ); // No dependencies, only calculated once

  // 7. Memoize sortConfig
  const sortConfig = useMemo<SortConfig<TaskSortField>>(
    () => ({
      initialSort: { field: 'priority', direction: 'desc' }, // Default sort: high priority first
    }),
    []
  ); // No dependencies, only calculated once

  const {
    filters,
    setFilterValue,
    clearFilters,
    data: tasks,
    totalRecords,
    isLoading,
    isFetching,
    error,
    pagination,
    sort,
  } = useFilterPilot<Task, TaskFilters, TaskSortField>({
    filterConfigs,
    fetchConfig: tasksFetchConfig,
    paginationConfig,
    sortConfig,
  });

  // Memoize these derived values to prevent unnecessary recalculations
  const titleSearchCfg = useMemo(
    () => filterConfigs.find((f) => f.name === 'titleSearch'),
    [filterConfigs]
  );

  const statusCfg = useMemo(
    () =>
      filterConfigs.find((f) => f.name === 'status') as
        | Extract<FilterConfig<TaskFilters>, { type: 'select' }>
        | undefined,
    [filterConfigs]
  );

  const priorityCfg = useMemo(
    () =>
      filterConfigs.find((f) => f.name === 'priority') as
        | Extract<FilterConfig<TaskFilters>, { type: 'select' }>
        | undefined,
    [filterConfigs]
  );

  // Memoize sortableFields to prevent recreating this array on every render
  const sortableFields = useMemo<{ key: TaskSortField; label: string }[]>(
    () => [
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'dueDate', label: 'Due Date' },
    ],
    []
  );

  if (isLoading && !tasks) return <p>Loading tasks...</p>;
  if (error) return <p>Error loading tasks: {(error as Error).message}</p>;

  return (
    <div className='task-list-container'>
      <h2>Task Management (Client-Side)</h2>

      {/* Filters */}
      <div className='filters-container'>
        <input
          type='text'
          aria-label={titleSearchCfg?.label}
          placeholder={titleSearchCfg?.placeholder}
          value={filters.titleSearch || ''}
          onChange={(e) => setFilterValue('titleSearch', e.target.value)}
          className='filter-input'
        />
        {statusCfg && (
          <select
            aria-label={statusCfg.label}
            value={filters.status || ''}
            onChange={(e) =>
              setFilterValue('status', (e.target.value as Task['status']) || undefined)
            }
            className='filter-select'
          >
            <option value=''>{statusCfg.placeholder || 'Any Status'}</option>
            {statusCfg.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        {priorityCfg && (
          <select
            aria-label={priorityCfg.label}
            value={filters.priority || ''}
            onChange={(e) =>
              setFilterValue('priority', (e.target.value as Task['priority']) || undefined)
            }
            className='filter-select'
          >
            <option value=''>{priorityCfg.placeholder || 'Any Priority'}</option>
            {priorityCfg.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        <button onClick={() => clearFilters()} className='filter-button'>
          Clear All Filters
        </button>
      </div>

      {isFetching && <p className='loading-indicator'>Processing...</p>}

      {/* Sort Controls */}
      {sort && (
        <div className='sort-controls'>
          <strong>Sort by:</strong>
          {sortableFields.map((sField) => (
            <button
              key={sField.key}
              onClick={() => sort.toggleSort(sField.key)}
              className={`sort-button ${sort.field === sField.key ? 'active' : ''}`}
            >
              {sField.label}{' '}
              {sort.field === sField.key ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
          {sort.field && (
            <button onClick={() => sort.clearSort()} className='clear-sort-button'>
              Clear Sort
            </button>
          )}
        </div>
      )}

      {/* Task List */}
      <ul className='task-list'>
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <li
              key={task.id}
              className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
            >
              <strong className={`priority-${task.priority}`}>{task.title}</strong>
              <div className='task-details'>
                Status: {task.status} | Priority: {task.priority}
              </div>
              {task.dueDate && (
                <small className='task-due-date'>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </small>
              )}
            </li>
          ))
        ) : (
          <p className='no-tasks-message'>No tasks found matching your criteria.</p>
        )}
      </ul>

      {/* Pagination Controls */}
      {pagination && totalRecords! > 0 && (
        <div className='pagination-controls'>
          <div className='pagination-buttons'>
            <button
              onClick={pagination.goToFirstPage}
              disabled={!pagination.hasPreviousPage}
              className='pagination-button'
            >
              First
            </button>
            <button
              onClick={pagination.goToPreviousPage}
              disabled={!pagination.hasPreviousPage}
              className='pagination-button'
            >
              Prev
            </button>
          </div>
          <span className='pagination-info'>
            Page {pagination.page} of {pagination.totalPages} (Total: {totalRecords} tasks)
          </span>
          <div className='pagination-buttons'>
            <button
              onClick={pagination.goToNextPage}
              disabled={!pagination.hasNextPage}
              className='pagination-button'
            >
              Next
            </button>
            <button
              onClick={pagination.goToLastPage}
              disabled={!pagination.hasNextPage}
              className='pagination-button'
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Page Size Selector */}
      {pagination && (
        <div className='page-size-selector'>
          <label>
            Items per page:
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.setPageSize(Number(e.target.value))}
              className='page-size-select'
            >
              {pagination.pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
});
