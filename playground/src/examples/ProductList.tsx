import React, { useState } from 'react';
import { useFilterPilot } from 'react-filter-pilot';
import './ProductList.css';

// Types
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  inStock: boolean;
  brand: string;
  imageUrl: string;
  description: string;
  reviews: number;
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

// Mock data generator
const generateMockProducts = (count: number): Product[] => {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'];
  const brands = ['TechCorp', 'StyleMax', 'BookWorld', 'HomePlus', 'SportPro'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i + 1}`,
    name: `Product ${i + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    price: Math.floor(Math.random() * 900) + 100,
    rating: Math.floor(Math.random() * 5) + 1,
    inStock: Math.random() > 0.2,
    brand: brands[Math.floor(Math.random() * brands.length)],
    imageUrl: `https://picsum.photos/200/200?random=${i}`,
    description: `This is a great product with amazing features. Product ID: ${i + 1}`,
    reviews: Math.floor(Math.random() * 500),
  }));
};

// Mock database
const mockDatabase = generateMockProducts(150);

// Mock API fetch function
const fetchProducts = async ({ filters, pagination, sort }: any) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  let filteredProducts = [...mockDatabase];

  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredProducts = filteredProducts.filter(
      p => p.name.toLowerCase().includes(searchLower) || 
           p.description.toLowerCase().includes(searchLower)
    );
  }

  if (filters.category && filters.category !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === filters.category);
  }

  if (filters.brands && filters.brands.length > 0) {
    filteredProducts = filteredProducts.filter(p => filters.brands.includes(p.brand));
  }

  if (filters.priceRange) {
    filteredProducts = filteredProducts.filter(
      p => p.price >= filters.priceRange.min && p.price <= filters.priceRange.max
    );
  }

  if (filters.rating > 0) {
    filteredProducts = filteredProducts.filter(p => p.rating >= filters.rating);
  }

  if (filters.inStock) {
    filteredProducts = filteredProducts.filter(p => p.inStock);
  }

  // Apply sorting
  if (sort) {
    filteredProducts.sort((a, b) => {
      const field = sort.field as keyof Product;
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
  const totalRecords = filteredProducts.length;
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  const paginatedProducts = filteredProducts.slice(start, end);

  return {
    data: paginatedProducts,
    totalRecords,
    meta: {
      categories: [...new Set(mockDatabase.map(p => p.category))],
      brands: [...new Set(mockDatabase.map(p => p.brand))],
      priceRange: {
        min: Math.min(...mockDatabase.map(p => p.price)),
        max: Math.max(...mockDatabase.map(p => p.price)),
      },
    },
  };
};

// Product Card Component
const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
  <div className="product-card">
    <img src={product.imageUrl} alt={product.name} />
    <div className="product-info">
      <h3>{product.name}</h3>
      <p className="product-category">{product.category}</p>
      <p className="product-brand">{product.brand}</p>
      <div className="product-rating">
        {'★'.repeat(product.rating)}{'☆'.repeat(5 - product.rating)}
        <span>({product.reviews})</span>
      </div>
      <div className="product-footer">
        <span className="product-price">${product.price}</span>
        <span className={`product-stock ${product.inStock ? 'in-stock' : 'out-stock'}`}>
          {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
        </span>
      </div>
    </div>
  </div>
);

// Loading Skeleton
const ProductSkeleton: React.FC = () => (
  <div className="product-card skeleton">
    <div className="skeleton-img"></div>
    <div className="product-info">
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
      <div className="skeleton-text"></div>
    </div>
  </div>
);

// Main Component
export const ProductList: React.FC = () => {
  const [showFilters, setShowFilters] = useState(true);

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
    setSort,
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
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    enablePresets: true,
  });

  // Predefined filter presets
  const predefinedPresets = [
    {
      name: 'Affordable Electronics',
      filters: {
        category: 'Electronics',
        priceRange: { min: 0, max: 300 },
        inStock: true,
      },
    },
    {
      name: 'Premium Items',
      filters: {
        priceRange: { min: 500, max: 1000 },
        rating: 4,
      },
    },
    {
      name: 'Best Rated Books',
      filters: {
        category: 'Books',
        rating: 5,
      },
    },
  ];

  return (
    <div className="product-list-container">
      {/* Header */}
      <div className="product-list-header">
        <h2>Product Catalog</h2>
        <button 
          className="toggle-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      <div className="product-list-layout">
        {/* Filters Sidebar */}
        {showFilters && (
          <aside className="filters-sidebar">
            <div className="filter-header">
              <h3>Filters {hasActiveFilters() && `(${getActiveFiltersCount()})`}</h3>
              {hasActiveFilters() && (
                <button onClick={resetFilters} className="clear-filters-btn">
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilterValue('search', e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="filter-group">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilterValue('category', e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            {/* Brands */}
            <div className="filter-group">
              <label>Brands</label>
              {['TechCorp', 'StyleMax', 'BookWorld', 'HomePlus', 'SportPro'].map(brand => (
                <label key={brand} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={(e) => {
                      const newBrands = e.target.checked
                        ? [...filters.brands, brand]
                        : filters.brands.filter(b => b !== brand);
                      setFilterValue('brands', newBrands);
                    }}
                  />
                  {brand}
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label>Price Range: ${filters.priceRange.min} - ${filters.priceRange.max}</label>
              <div className="range-inputs">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange.min}
                  onChange={(e) => setFilterValue('priceRange', {
                    ...filters.priceRange,
                    min: parseInt(e.target.value),
                  })}
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange.max}
                  onChange={(e) => setFilterValue('priceRange', {
                    ...filters.priceRange,
                    max: parseInt(e.target.value),
                  })}
                />
              </div>
            </div>

            {/* Rating */}
            <div className="filter-group">
              <label>Minimum Rating</label>
              <div className="rating-filter">
                {[0, 1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    className={filters.rating === rating ? 'active' : ''}
                    onClick={() => setFilterValue('rating', rating)}
                  >
                    {rating === 0 ? 'All' : `${rating}★+`}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock */}
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => setFilterValue('inStock', e.target.checked)}
                />
                In Stock Only
              </label>
            </div>

            {/* Presets */}
            <div className="filter-group">
              <label>Quick Filters</label>
              {predefinedPresets.map((preset, idx) => (
                <button
                  key={idx}
                  className="preset-btn"
                  onClick={() => setFilters(preset.filters as Partial<ProductFilters>)}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Save Current Filters */}
            {presets && (
              <div className="filter-group">
                <button
                  className="save-preset-btn"
                  onClick={() => {
                    const name = prompt('Enter preset name:');
                    if (name) {
                      presets.savePreset(name);
                    }
                  }}
                >
                  Save Current Filters
                </button>
                
                {/* Saved Presets */}
                {presets.getPresets().length > 0 && (
                  <div className="saved-presets">
                    <label>Saved Filters</label>
                    {presets.getPresets().map((preset) => (
                      <div key={preset.id} className="saved-preset">
                        <button onClick={() => presets.loadPreset(preset)}>
                          {preset.name}
                        </button>
                        <button
                          className="delete-preset"
                          onClick={() => presets.deletePreset(preset.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className="products-main">
          {/* Results Header */}
          <div className="results-header">
            <div className="results-info">
              <span>{pagination.totalRecords} products found</span>
              {hasActiveFilters() && (
                <span className="active-filters-count">
                  ({getActiveFiltersCount()} filters active)
                </span>
              )}
            </div>

            <div className="results-controls">
              {/* Sort */}
              <select
                value={`${sort?.field}-${sort?.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSort(field, direction as 'asc' | 'desc');
                }}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="rating-desc">Rating (High to Low)</option>
              </select>

              {/* Page Size */}
              <select
                value={pagination.pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
              >
                {[6, 12, 24, 48].map(size => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {isLoading ? (
              Array.from({ length: pagination.pageSize }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
            ) : data && data.length > 0 ? (
              data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="no-results">
                <p>No products found matching your criteria.</p>
                <button onClick={resetFilters}>Clear filters</button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage(1)}
              >
                ⟨⟨
              </button>
              <button
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage(pagination.page - 1)}
              >
                ⟨
              </button>

              {/* Page Numbers */}
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={pagination.page === pageNum ? 'active' : ''}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(pagination.page + 1)}
              >
                ⟩
              </button>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(pagination.totalPages)}
              >
                ⟩⟩
              </button>

              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>
          )}
        </main>
      </div>

      {/* URL Display for Testing */}
      <div className="url-display">
        <strong>Current URL:</strong>
        <code>{window.location.href}</code>
      </div>
    </div>
  );
};