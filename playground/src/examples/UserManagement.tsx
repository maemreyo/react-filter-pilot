import React, { useState } from 'react';
import { useFilterPilot, useFilterMutation } from 'react-filter-pilot';
import './UserManagement.css';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  createdAt: string;
  avatar: string;
}

interface UserFilters {
  search: string;
  role: string;
  department: string;
  status: string;
  dateRange: {
    min: string;
    max: string;
  };
}

// Mock data generator
const generateMockUsers = (count: number): User[] => {
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Product', 'Support'];
  const roles: Array<'admin' | 'editor' | 'viewer'> = ['admin', 'editor', 'viewer'];
  const statuses: Array<'active' | 'inactive' | 'pending'> = ['active', 'inactive', 'pending'];
  const names = [
    'John Smith', 'Emma Johnson', 'Michael Brown', 'Olivia Davis', 'William Wilson',
    'Sophia Martinez', 'James Taylor', 'Isabella Anderson', 'Robert Thomas', 'Mia Jackson',
    'David White', 'Charlotte Harris', 'Joseph Martin', 'Amelia Thompson', 'Daniel Garcia',
    'Elizabeth Robinson', 'Matthew Lewis', 'Ava Walker', 'Christopher Allen', 'Sofia Young'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    // Generate random dates
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 365));
    
    const lastLoginDate = new Date(createdDate);
    lastLoginDate.setDate(lastLoginDate.getDate() + Math.floor(Math.random() * (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const name = names[Math.floor(Math.random() * names.length)];
    const email = name.toLowerCase().replace(' ', '.') + '@example.com';
    
    return {
      id: `user-${i + 1}`,
      name,
      email,
      role: roles[Math.floor(Math.random() * roles.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastLogin: lastLoginDate.toISOString().split('T')[0],
      createdAt: createdDate.toISOString().split('T')[0],
      avatar: `https://i.pravatar.cc/150?img=${i % 70}`,
    };
  });
};

// Mock database with users
let mockUsers = generateMockUsers(50);

// Mock API fetch function
const fetchUsers = async ({ filters, pagination, sort }: any) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));

  let filteredUsers = [...mockUsers];

  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredUsers = filteredUsers.filter(
      u => u.name.toLowerCase().includes(searchLower) || 
           u.email.toLowerCase().includes(searchLower)
    );
  }

  if (filters.role && filters.role !== 'all') {
    filteredUsers = filteredUsers.filter(u => u.role === filters.role);
  }

  if (filters.department && filters.department !== 'all') {
    filteredUsers = filteredUsers.filter(u => u.department === filters.department);
  }

  if (filters.status && filters.status !== 'all') {
    filteredUsers = filteredUsers.filter(u => u.status === filters.status);
  }

  if (filters.dateRange) {
    if (filters.dateRange.min) {
      filteredUsers = filteredUsers.filter(u => u.createdAt >= filters.dateRange.min);
    }
    if (filters.dateRange.max) {
      filteredUsers = filteredUsers.filter(u => u.createdAt <= filters.dateRange.max);
    }
  }

  // Apply sorting
  if (sort) {
    filteredUsers.sort((a, b) => {
      const field = sort.field as keyof User;
      const aVal = a[field];
      const bVal = b[field];
      
      if (sort.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  // Calculate pagination
  const totalRecords = filteredUsers.length;
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  const paginatedUsers = filteredUsers.slice(start, end);

  return {
    data: paginatedUsers,
    totalRecords,
    meta: {
      departments: [...new Set(mockUsers.map(u => u.department))],
    },
  };
};

// Mock API update function
const updateUser = async (userData: Partial<User> & { id: string }): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Find and update the user
  const userIndex = mockUsers.findIndex(u => u.id === userData.id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Update user data
  mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
  
  return mockUsers[userIndex];
};

// Mock API delete function
const deleteUser = async (userId: string): Promise<{ success: boolean, id: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Find and remove the user
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Remove user
  mockUsers = mockUsers.filter(u => u.id !== userId);
  
  return { success: true, id: userId };
};

// User Card Component
const UserCard: React.FC<{ 
  user: User, 
  onEdit: (user: User) => void,
  onDelete: (userId: string) => void
}> = ({ user, onEdit, onDelete }) => (
  <div className="user-card">
    <div className="user-avatar">
      <img src={user.avatar} alt={user.name} />
      <span className={`status-indicator ${user.status}`}></span>
    </div>
    <div className="user-info">
      <h3>{user.name}</h3>
      <p className="user-email">{user.email}</p>
      <div className="user-details">
        <span className="user-role">{user.role}</span>
        <span className="user-department">{user.department}</span>
      </div>
      <div className="user-dates">
        <span>Created: {user.createdAt}</span>
        <span>Last login: {user.lastLogin}</span>
      </div>
    </div>
    <div className="user-actions">
      <button onClick={() => onEdit(user)} className="edit-btn">Edit</button>
      <button onClick={() => onDelete(user.id)} className="delete-btn">Delete</button>
    </div>
  </div>
);

// User Edit Modal
const UserEditModal: React.FC<{
  user: User | null,
  onSave: (userData: Partial<User> & { id: string }) => void,
  onCancel: () => void
}> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<User> & { id: string }>(
    user ? { ...user } : { id: '', name: '', email: '', role: 'viewer', department: '', status: 'active' }
  );

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit User</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Product">Product</option>
              <option value="Support">Support</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
            <button type="submit" className="save-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Confirmation Modal
const ConfirmationModal: React.FC<{
  message: string,
  onConfirm: () => void,
  onCancel: () => void
}> = ({ message, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-content confirmation-modal">
      <h2>Confirm Action</h2>
      <p>{message}</p>
      <div className="form-actions">
        <button onClick={onCancel} className="cancel-btn">Cancel</button>
        <button onClick={onConfirm} className="delete-btn">Confirm</button>
      </div>
    </div>
  </div>
);

// Main Component
export const UserManagement: React.FC = () => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Use FilterPilot for user listing
  const filterPilot = useFilterPilot<User, UserFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 300,
        urlKey: 'q',
      },
      {
        name: 'role',
        defaultValue: 'all',
        urlKey: 'role',
      },
      {
        name: 'department',
        defaultValue: 'all',
        urlKey: 'dept',
      },
      {
        name: 'status',
        defaultValue: 'all',
        urlKey: 'status',
      },
      {
        name: 'dateRange',
        defaultValue: { min: '', max: '' },
        transformToUrl: (value) => `${value.min || ''}:${value.max || ''}`,
        transformFromUrl: (value) => {
          const [min, max] = value.split(':');
          return { min, max };
        },
      },
    ],
    paginationConfig: {
      initialPageSize: 10,
      pageSizeOptions: [5, 10, 20, 50],
      syncWithUrl: true,
    },
    sortConfig: {
      initialSortField: 'name',
      initialSortDirection: 'asc',
      syncWithUrl: true,
    },
    fetchConfig: {
      fetchFn: fetchUsers,
      staleTime: 2 * 60 * 1000, // 2 minutes
    },
  });

  // Use FilterMutation for updating users
  const updateMutation = useFilterMutation<User, UserFilters, User, Partial<User> & { id: string }>({
    filterPilot,
    mutationFn: updateUser,
    invalidateOnSuccess: true,
    optimisticUpdate: (variables) => {
      // Return optimistically updated data
      return filterPilot.data?.map(user => 
        user.id === variables.id ? { ...user, ...variables } : user
      ) || [];
    },
    onSuccess: () => {
      setEditingUser(null);
    },
    onError: (error) => {
      alert(`Error updating user: ${error.message}`);
    },
  });

  // Use FilterMutation for deleting users
  const deleteMutation = useFilterMutation<User, UserFilters, { success: boolean, id: string }, string>({
    filterPilot,
    mutationFn: deleteUser,
    invalidateOnSuccess: true,
    optimisticUpdate: (userId) => {
      // Return data with the user removed
      return filterPilot.data?.filter(user => user.id !== userId) || [];
    },
    onSuccess: () => {
      setDeletingUserId(null);
    },
    onError: (error) => {
      alert(`Error deleting user: ${error.message}`);
    },
  });

  // Handle user edit
  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  // Handle user save
  const handleSaveUser = (userData: Partial<User> & { id: string }) => {
    updateMutation.mutate(userData);
  };

  // Handle user delete confirmation
  const handleDeleteConfirm = (userId: string) => {
    setDeletingUserId(userId);
  };

  // Handle user delete
  const handleDeleteUser = () => {
    if (deletingUserId) {
      deleteMutation.mutate(deletingUserId);
    }
  };

  const { 
    filters, 
    setFilterValue, 
    resetFilters, 
    data, 
    isLoading, 
    pagination, 
    setPage, 
    setPageSize,
    sort,
    setSort,
    toggleSort,
  } = filterPilot;

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>User Management</h2>
        <p>Manage your organization's users</p>
      </div>

      <div className="user-filters">
        {/* Search */}
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => setFilterValue('search', e.target.value)}
            className="search-input"
          />
        </div>

        {/* Role Filter */}
        <div className="filter-group">
          <select
            value={filters.role}
            onChange={(e) => setFilterValue('role', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {/* Department Filter */}
        <div className="filter-group">
          <select
            value={filters.department}
            onChange={(e) => setFilterValue('department', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Product">Product</option>
            <option value="Support">Support</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => setFilterValue('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Reset Filters */}
        <button onClick={resetFilters} className="reset-btn">
          Reset Filters
        </button>
      </div>

      {/* User Table */}
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th onClick={() => toggleSort('role')} className={sort?.field === 'role' ? `sorted ${sort.direction}` : ''}>
                Role {sort?.field === 'role' && (sort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => toggleSort('department')} className={sort?.field === 'department' ? `sorted ${sort.direction}` : ''}>
                Department {sort?.field === 'department' && (sort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => toggleSort('status')} className={sort?.field === 'status' ? `sorted ${sort.direction}` : ''}>
                Status {sort?.field === 'status' && (sort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => toggleSort('createdAt')} className={sort?.field === 'createdAt' ? `sorted ${sort.direction}` : ''}>
                Created {sort?.field === 'createdAt' && (sort.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="loading-row">
                  <td>
                    <div className="user-cell skeleton">
                      <div className="skeleton-avatar"></div>
                      <div className="skeleton-text"></div>
                    </div>
                  </td>
                  <td><div className="skeleton-text short"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text short"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-actions"></div></td>
                </tr>
              ))
            ) : (
              data?.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <img src={user.avatar} alt={user.name} className="user-table-avatar" />
                      <div>
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>{user.department}</td>
                  <td>
                    <span className={`status-badge ${user.status}`}>{user.status}</span>
                  </td>
                  <td>{user.createdAt}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        onClick={() => handleEditUser(user)} 
                        className="edit-btn"
                        disabled={updateMutation.isPending}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteConfirm(user.id)} 
                        className="delete-btn"
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* No results message */}
        {!isLoading && (!data || data.length === 0) && (
          <div className="no-results">
            <h3>No users found</h3>
            <p>Try adjusting your filters or add new users.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Showing {data?.length || 0} of {pagination.totalRecords} users
        </div>
        <div className="pagination-controls">
          <button 
            onClick={() => setPage(1)} 
            disabled={pagination.page === 1 || isLoading}
            className="pagination-btn"
          >
            First
          </button>
          <button 
            onClick={() => setPage(pagination.page - 1)} 
            disabled={!pagination.hasPreviousPage || isLoading}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-current">Page {pagination.page} of {pagination.totalPages}</span>
          <button 
            onClick={() => setPage(pagination.page + 1)} 
            disabled={!pagination.hasNextPage || isLoading}
            className="pagination-btn"
          >
            Next
          </button>
          <button 
            onClick={() => setPage(pagination.totalPages)} 
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="pagination-btn"
          >
            Last
          </button>
        </div>
        <div className="pagination-size">
          <label>
            Show
            <select 
              value={pagination.pageSize} 
              onChange={(e) => setPageSize(Number(e.target.value))}
              disabled={isLoading}
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            per page
          </label>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <UserEditModal 
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingUserId && (
        <ConfirmationModal
          message="Are you sure you want to delete this user? This action cannot be undone."
          onConfirm={handleDeleteUser}
          onCancel={() => setDeletingUserId(null)}
        />
      )}
    </div>
  );
};