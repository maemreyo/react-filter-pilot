import React, { useMemo, useCallback } from 'react';
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
  dueDate?: string;
}

interface TaskFilters {
  titleSearch?: string;
  status?: Task['status'];
  priority?: Task['priority'];
}

type TaskSortField = 'title' | 'status' | 'priority' | 'dueDate';

// 2. Static Data Source
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
];

// 3. Define filter options outside component
const STATUS_OPTIONS: OptionType<Task['status']>[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
];

const PRIORITY_OPTIONS: OptionType<Task['priority']>[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

// 4. Define fetch function outside component
const fetchTasksClientSide = async (params: FetchFnParams<TaskFilters, TaskSortField>) => {
  console.log('Client-side fetch with params:', params);
  await new Promise((resolve) => setTimeout(resolve, 200));

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
  if (params.sort?.field) {
    const { field, direction } = params.sort;
    filteredTasks.sort((a, b) => {
      const valA = a[field as keyof Task];
      const valB = b[field as keyof Task];

      if (valA == null && valB == null) return 0;
      if (valA == null) return direction === 'asc' ? -1 : 1;
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

  // Apply pagination
  let paginatedTasks = filteredTasks;
  if (params.pagination) {
    const { page, pageSize } = params.pagination;
    paginatedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);
  }

  return { data: paginatedTasks, totalRecords: filteredTasks.length };
};

// 5. Define sortable fields outside component
const SORTABLE_FIELDS: { key: TaskSortField; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'dueDate', label: 'Due Date' },
];

// 6. The React Component
export function SimpleTaskList() {
  // Define all configurations with useMemo
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
        options: STATUS_OPTIONS,
        defaultValue: undefined,
      },
      {
        name: 'priority',
        type: 'select',
        label: 'Priority',
        placeholder: 'Any Priority',
        options: PRIORITY_OPTIONS,
        defaultValue: undefined,
      },
    ],
    []
  );

  const fetchConfig = useMemo<FetchConfig<Task, TaskFilters, TaskSortField>>(
    () => ({
      fetchFn: fetchTasksClientSide,
      queryKeyBase: ['simpleTasks'],
      tanstackQueryOptions: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
    }),
    []
  );

  const paginationConfig = useMemo<PaginationConfig>(
    () => ({
      initialPage: 1,
      initialPageSize: 3,
      pageSizeOptions: [3, 5, 10],
    }),
    []
  );

  const sortConfig = useMemo<SortConfig<TaskSortField>>(
    () => ({
      initialSort: { field: 'priority', direction: 'desc' },
    }),
    []
  );

  // Use the hook
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
    fetchConfig,
    paginationConfig,
    sortConfig,
  });

  // Memoize event handlers
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilterValue('titleSearch', e.target.value);
    },
    [setFilterValue]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterValue('status', (e.target.value as Task['status']) || undefined);
    },
    [setFilterValue]
  );

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterValue('priority', (e.target.value as Task['priority']) || undefined);
    },
    [setFilterValue]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  // Render
  if (isLoading && !tasks) return <p>Loading tasks...</p>;
  if (error) return <p>Error loading tasks: {(error as Error).message}</p>;

  return (
    <div className='task-list-container'>
      <h2>Simple Task List</h2>

      {/* Filters */}
      <div className='filters-container'>
        <input
          type='text'
          placeholder='Search title...'
          value={filters.titleSearch || ''}
          onChange={handleTitleChange}
          className='filter-input'
        />

        <select
          value={filters.status || ''}
          onChange={handleStatusChange}
          className='filter-select'
        >
          <option value=''>Any Status</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.priority || ''}
          onChange={handlePriorityChange}
          className='filter-select'
        >
          <option value=''>Any Priority</option>
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button onClick={handleClearFilters} className='filter-button'>
          Clear All Filters
        </button>
      </div>

      {isFetching && <p className='loading-indicator'>Processing...</p>}

      {/* Sort Controls */}
      {sort && (
        <div className='sort-controls'>
          <strong>Sort by:</strong>
          {SORTABLE_FIELDS.map((sField) => (
            <button
              key={sField.key}
              onClick={() => sort.toggleSort(sField.key)}
              className={`sort-button ${sort.field === sField.key ? 'active' : ''}`}
            >
              {sField.label}{' '}
              {sort.field === sField.key ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
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
      {pagination && totalRecords && totalRecords > 0 && (
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
}
