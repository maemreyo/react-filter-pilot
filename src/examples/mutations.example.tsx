import React from 'react';
import { useFilterPilot, useFilterMutation } from 'react-filter-pilot';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

interface ProductFilters {
  search: string;
  category: string;
  inStock: boolean;
}

/**
 * Example: Product management with mutations
 */
export function ProductManagement() {
  // Main filter pilot hook
  const filterPilot = useFilterPilot<Product, ProductFilters>({
    filterConfigs: [
      { name: 'search', defaultValue: '', debounceMs: 300 },
      { name: 'category', defaultValue: 'all' },
      { name: 'inStock', defaultValue: false },
    ],
    fetchConfig: {
      fetchFn: async ({ filters, pagination }) => {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters, pagination }),
        });
        return response.json();
      },
    },
  });

  // Create product mutation
  const createMutation = useFilterMutation({
    filterPilot,
    mutationFn: async (newProduct: Omit<Product, 'id'>) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Product "${data.name}" created successfully!`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update product mutation with optimistic update
  const updateMutation = useFilterMutation({
    filterPilot,
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    // Optimistically update the UI
    optimisticUpdate: ({ id, ...updates }) => {
      return filterPilot.data?.map(product =>
        product.id === id ? { ...product, ...updates } : product
      ) || [];
    },
    onSuccess: () => {
      toast.success('Product updated successfully!');
    },
  });

  // Delete product mutation
  const deleteMutation = useFilterMutation({
    filterPilot,
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return productId;
    },
    // Optimistically remove from list
    optimisticUpdate: (productId) => {
      return filterPilot.data?.filter(product => product.id !== productId) || [];
    },
    onSuccess: () => {
      toast.success('Product deleted successfully!');
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useFilterMutation({
    filterPilot,
    mutationFn: async (updates: { ids: string[]; changes: Partial<Product> }) => {
      const response = await fetch('/api/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update products');
      return response.json();
    },
    optimisticUpdate: ({ ids, changes }) => {
      return filterPilot.data?.map(product =>
        ids.includes(product.id) ? { ...product, ...changes } : product
      ) || [];
    },
    onSuccess: (data) => {
      toast.success(`${data.updated} products updated successfully!`);
    },
  });

  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={filterPilot.filters.search}
          onChange={(e) => filterPilot.setFilterValue('search', e.target.value)}
        />
        
        <select
          value={filterPilot.filters.category}
          onChange={(e) => filterPilot.setFilterValue('category', e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
        </select>
        
        <label>
          <input
            type="checkbox"
            checked={filterPilot.filters.inStock}
            onChange={(e) => filterPilot.setFilterValue('inStock', e.target.checked)}
          />
          In Stock Only
        </label>
      </div>

      {/* Create new product */}
      <button
        onClick={() => {
          const name = prompt('Product name:');
          if (name) {
            createMutation.mutate({
              name,
              price: Math.random() * 100,
              inStock: true,
            });
          }
        }}
        disabled={createMutation.isLoading}
      >
        {createMutation.isLoading ? 'Creating...' : 'Add Product'}
      </button>

      {/* Product list */}
      {filterPilot.isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="product-list">
          {filterPilot.data?.map((product) => (
            <div key={product.id} className="product-item">
              <h3>{product.name}</h3>
              <p>${product.price.toFixed(2)}</p>
              <p>Status: {product.inStock ? 'In Stock' : 'Out of Stock'}</p>
              
              <div className="actions">
                {/* Toggle stock status */}
                <button
                  onClick={() => updateMutation.mutate({
                    id: product.id,
                    inStock: !product.inStock,
                  })}
                  disabled={updateMutation.isLoading}
                >
                  {product.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                </button>
                
                {/* Update price */}
                <button
                  onClick={() => {
                    const newPrice = prompt('New price:', product.price.toString());
                    if (newPrice) {
                      updateMutation.mutate({
                        id: product.id,
                        price: parseFloat(newPrice),
                      });
                    }
                  }}
                  disabled={updateMutation.isLoading}
                >
                  Update Price
                </button>
                
                {/* Delete product */}
                <button
                  onClick={() => {
                    if (confirm(`Delete "${product.name}"?`)) {
                      deleteMutation.mutate(product.id);
                    }
                  }}
                  disabled={deleteMutation.isLoading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk actions */}
      {filterPilot.data && filterPilot.data.length > 0 && (
        <div className="bulk-actions">
          <button
            onClick={() => {
              const outOfStockIds = filterPilot.data
                ?.filter(p => !p.inStock)
                .map(p => p.id) || [];
              
              if (outOfStockIds.length > 0) {
                bulkUpdateMutation.mutate({
                  ids: outOfStockIds,
                  changes: { inStock: true },
                });
              }
            }}
            disabled={bulkUpdateMutation.isLoading}
          >
            Mark All Out of Stock as In Stock
          </button>
        </div>
      )}
    </div>
  );
}