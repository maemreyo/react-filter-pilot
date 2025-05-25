import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useFilterPilot, useFilterMutation, useFilterPilotInfinite } from 'react-filter-pilot';
import './AdvancedExample.css';

// Types
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  brand: string;
  tags: string[];
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductFilters {
  search: string;
  category: string;
  subcategory: string;
  brands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  inStock: boolean;
  tags: string[];
  dateRange: {
    min: string;
    max: string;
  };
}

// Mock data generator
const generateMockProducts = (count: number): Product[] => {
  const categories = ['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports'];
  const subcategories: Record<string, string[]> = {
    'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Accessories', 'Audio'],
    'Clothing': ['Men', 'Women', 'Kids', 'Shoes', 'Accessories'],
    'Home': ['Furniture', 'Decor', 'Kitchen', 'Bedding', 'Lighting'],
    'Beauty': ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Bath & Body'],
    'Sports': ['Fitness', 'Outdoor', 'Team Sports', 'Apparel', 'Equipment']
  };
  
  const brands: Record<string, string[]> = {
    'Electronics': ['Apple', 'Samsung', 'Sony', 'Dell', 'LG', 'Bose', 'Microsoft'],
    'Clothing': ['Nike', 'Adidas', 'Zara', 'H&M', 'Levi\'s', 'Gap', 'Uniqlo'],
    'Home': ['IKEA', 'Crate & Barrel', 'West Elm', 'Pottery Barn', 'Wayfair'],
    'Beauty': ['L\'Oreal', 'Estée Lauder', 'MAC', 'Clinique', 'Neutrogena', 'Dove'],
    'Sports': ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok', 'The North Face']
  };
  
  const allTags = [
    'New', 'Bestseller', 'Sale', 'Limited Edition', 'Eco-friendly', 
    'Premium', 'Handmade', 'Imported', 'Organic', 'Vegan', 
    'Waterproof', 'Wireless', 'Bluetooth', 'USB-C', 'Fast Charging',
    'Lightweight', 'Durable', 'Compact', 'Portable', 'High Resolution'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    // Generate random dates within the last 2 years
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 730));
    
    const updatedDate = new Date(createdDate);
    updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const subcategory = subcategories[category][Math.floor(Math.random() * subcategories[category].length)];
    const brand = brands[category][Math.floor(Math.random() * brands[category].length)];
    
    const price = Math.floor(Math.random() * 990) + 10; // $10 - $999
    const hasDiscount = Math.random() > 0.7;
    const discountPrice = hasDiscount ? Math.floor(price * (0.7 + Math.random() * 0.2)) : undefined;
    
    // Generate random tags (1-4 tags per product)
    const productTags = [];
    const tagCount = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < tagCount; j++) {
      const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
      if (!productTags.includes(randomTag)) {
        productTags.push(randomTag);
      }
    }
    
    return {
      id: `prod-${i + 1}`,
      name: `${brand} ${subcategory} Product ${i + 1}`,
      description: `This is a high-quality ${subcategory.toLowerCase()} product from ${brand}. Perfect for everyday use and designed with premium materials.`,
      category,
      subcategory,
      price,
      discountPrice,
      rating: Math.floor(Math.random() * 50 + 1) / 10, // 0.1 - 5.0
      reviewCount: Math.floor(Math.random() * 500),
      inStock: Math.random() > 0.2, // 80% in stock
      brand,
      tags: productTags,
      imageUrl: `https://picsum.photos/400/400?random=${i}`,
      createdAt: createdDate.toISOString().split('T')[0],
      updatedAt: updatedDate.toISOString().split('T')[0],
    };
  });
};

// Mock database
let mockProducts = generateMockProducts(200);

// Mock API fetch function
const fetchProducts = async ({ filters, pagination, sort }: any) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  let filteredProducts = [...mockProducts];

  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredProducts = filteredProducts.filter(
      p => p.name.toLowerCase().includes(searchLower) || 
           p.description.toLowerCase().includes(searchLower) ||
           p.brand.toLowerCase().includes(searchLower)
    );
  }

  if (filters.category && filters.category !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === filters.category);
  }

  if (filters.subcategory && filters.subcategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.subcategory === filters.subcategory);
  }

  if (filters.brands && filters.brands.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      filters.brands.includes(p.brand)
    );
  }

  if (filters.priceRange) {
    if (filters.priceRange.min > 0) {
      filteredProducts = filteredProducts.filter(p => p.price >= filters.priceRange.min);
    }
    if (filters.priceRange.max < 1000) {
      filteredProducts = filteredProducts.filter(p => p.price <= filters.priceRange.max);
    }
  }

  if (filters.rating > 0) {
    filteredProducts = filteredProducts.filter(p => p.rating >= filters.rating);
  }

  if (filters.inStock !== undefined) {
    filteredProducts = filteredProducts.filter(p => p.inStock === filters.inStock);
  }

  if (filters.tags && filters.tags.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      filters.tags.some((tag: string) => p.tags.includes(tag))
    );
  }

  if (filters.dateRange) {
    if (filters.dateRange.min) {
      filteredProducts = filteredProducts.filter(p => p.createdAt >= filters.dateRange.min);
    }
    if (filters.dateRange.max) {
      filteredProducts = filteredProducts.filter(p => p.createdAt <= filters.dateRange.max);
    }
  }

  // Apply sorting
  if (sort) {
    filteredProducts.sort((a, b) => {
      let aValue = a[sort.field as keyof Product];
      let bValue = b[sort.field as keyof Product];
      
      // Special case for discounted price
      if (sort.field === 'price' && a.discountPrice) {
        aValue = a.discountPrice;
      }
      if (sort.field === 'price' && b.discountPrice) {
        bValue = b.discountPrice;
      }
      
      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // Calculate pagination
  const totalRecords = filteredProducts.length;
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  const paginatedProducts = filteredProducts.slice(start, end);

  // Get all available brands and tags for filters
  const allBrands = [...new Set(mockProducts.map(p => p.brand))];
  const allTags = [...new Set(mockProducts.flatMap(p => p.tags))];
  const allCategories = [...new Set(mockProducts.map(p => p.category))];
  const allSubcategories = [...new Set(mockProducts.map(p => p.subcategory))];

  return {
    data: paginatedProducts,
    totalRecords,
    meta: {
      brands: allBrands,
      tags: allTags,
      categories: allCategories,
      subcategories: allSubcategories,
    },
  };
};

// Mock API fetch function for infinite scroll
const fetchProductsInfinite = async ({ filters, cursor }: any) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  let filteredProducts = [...mockProducts];

  // Apply filters (same as above)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredProducts = filteredProducts.filter(
      p => p.name.toLowerCase().includes(searchLower) || 
           p.description.toLowerCase().includes(searchLower) ||
           p.brand.toLowerCase().includes(searchLower)
    );
  }

  if (filters.category && filters.category !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === filters.category);
  }

  if (filters.brands && filters.brands.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      filters.brands.includes(p.brand)
    );
  }

  // Handle cursor pagination
  const pageSize = 12;
  let startIndex = 0;
  
  if (cursor) {
    const cursorIndex = filteredProducts.findIndex(product => product.id === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1; // Start after the cursor
    }
  }
  
  const endIndex = startIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  const nextCursor = paginatedProducts.length > 0 ? paginatedProducts[paginatedProducts.length - 1].id : null;
  
  return {
    data: paginatedProducts,
    totalRecords: filteredProducts.length,
    nextCursor,
  };
};

// Mock API update function
const updateProduct = async (productData: Partial<Product> & { id: string }): Promise<Product> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Find and update the product
  const productIndex = mockProducts.findIndex(p => p.id === productData.id);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  
  // Update product data
  mockProducts[productIndex] = { ...mockProducts[productIndex], ...productData, updatedAt: new Date().toISOString().split('T')[0] };
  
  return mockProducts[productIndex];
};

// Mock API delete function
const deleteProduct = async (productId: string): Promise<{ success: boolean, id: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Find and remove the product
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  
  // Remove product
  mockProducts = mockProducts.filter(p => p.id !== productId);
  
  return { success: true, id: productId };
};

// Product Card Component
const ProductCard: React.FC<{ 
  product: Product, 
  onEdit: (product: Product) => void,
  onDelete: (productId: string) => void
}> = ({ product, onEdit, onDelete }) => (
  <div className="product-card">
    <div className="product-image">
      <img src={product.imageUrl} alt={product.name} />
      {product.discountPrice && (
        <span className="discount-badge">
          {Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
        </span>
      )}
      {!product.inStock && <div className="out-of-stock">Out of Stock</div>}
    </div>
    <div className="product-content">
      <div className="product-category">{product.category} &gt; {product.subcategory}</div>
      <h3 className="product-title">{product.name}</h3>
      <div className="product-brand">{product.brand}</div>
      <div className="product-rating">
        {'★'.repeat(Math.floor(product.rating))}
        {'☆'.repeat(5 - Math.floor(product.rating))}
        <span className="review-count">({product.reviewCount})</span>
      </div>
      <div className="product-price">
        {product.discountPrice ? (
          <>
            <span className="original-price">${product.price}</span>
            <span className="discount-price">${product.discountPrice}</span>
          </>
        ) : (
          <span>${product.price}</span>
        )}
      </div>
      <div className="product-tags">
        {product.tags.map(tag => (
          <span key={tag} className="product-tag">{tag}</span>
        ))}
      </div>
      <div className="product-actions">
        <button onClick={() => onEdit(product)} className="edit-btn">Edit</button>
        <button onClick={() => onDelete(product.id)} className="delete-btn">Delete</button>
      </div>
    </div>
  </div>
);

// Product Edit Modal
const ProductEditModal: React.FC<{
  product: Product | null,
  onSave: (productData: Partial<Product> & { id: string }) => void,
  onCancel: () => void,
  allCategories: string[],
  allSubcategories: string[],
  allBrands: string[],
  allTags: string[]
}> = ({ product, onSave, onCancel, allCategories, allSubcategories, allBrands, allTags }) => {
  const [formData, setFormData] = useState<Partial<Product> & { id: string }>(
    product ? { ...product } : { id: '', name: '', price: 0, category: '', subcategory: '', brand: '', inStock: true, tags: [] }
  );

  if (!product) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'price' || name === 'discountPrice' || name === 'rating') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => {
      const currentTags = prev.tags || [];
      if (currentTags.includes(tag)) {
        return { ...prev, tags: currentTags.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...currentTags, tag] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content product-edit-modal">
        <h2>Edit Product</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
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
              <label htmlFor="brand">Brand</label>
              <select
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
              >
                {allBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {allCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="subcategory">Subcategory</label>
              <select
                id="subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                required
              >
                {allSubcategories.map(subcategory => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="discountPrice">Discount Price ($)</label>
              <input
                type="number"
                id="discountPrice"
                name="discountPrice"
                value={formData.discountPrice || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rating">Rating (0-5)</label>
              <input
                type="number"
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                min="0"
                max="5"
                step="0.1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reviewCount">Review Count</label>
              <input
                type="number"
                id="reviewCount"
                name="reviewCount"
                value={formData.reviewCount}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="inStock"
                checked={formData.inStock}
                onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
              />
              In Stock
            </label>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-selector">
              {allTags.map(tag => (
                <label key={tag} className={`tag-option ${formData.tags?.includes(tag) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.tags?.includes(tag) || false}
                    onChange={() => handleTagToggle(tag)}
                  />
                  {tag}
                </label>
              ))}
            </div>
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
export const AdvancedExample: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'infinite'>('grid');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Standard Grid View with useFilterPilot
  const filterPilot = useFilterPilot<Product, ProductFilters>({
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
        name: 'subcategory',
        defaultValue: 'all',
        urlKey: 'subcat',
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
        urlKey: 'price',
        transformToUrl: (value) => `${value.min}-${value.max}`,
        transformFromUrl: (value) => {
          const [min, max] = value.split('-').map(Number);
          return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? 1000 : max };
        },
      },
      {
        name: 'rating',
        defaultValue: 0,
        urlKey: 'rating',
        transformToUrl: (value) => value.toString(),
        transformFromUrl: (value) => parseFloat(value) || 0,
      },
      {
        name: 'inStock',
        defaultValue: false,
        urlKey: 'instock',
        transformToUrl: (value) => value ? '1' : '0',
        transformFromUrl: (value) => value === '1',
      },
      {
        name: 'tags',
        defaultValue: [],
        urlKey: 'tags',
        transformToUrl: (value: string[]) => value.join(','),
        transformFromUrl: (value: string) => value ? value.split(',') : [],
      },
      {
        name: 'dateRange',
        defaultValue: { min: '', max: '' },
        urlKey: 'dates',
        transformToUrl: (value) => `${value.min || ''}:${value.max || ''}`,
        transformFromUrl: (value) => {
          const [min, max] = value.split(':');
          return { min, max };
        },
      },
    ],
    paginationConfig: {
      initialPageSize: 12,
      pageSizeOptions: [6, 12, 24, 48],
      resetOnFilterChange: true,
      syncWithUrl: true,
    },
    sortConfig: {
      initialSortField: 'name',
      initialSortDirection: 'asc',
      syncWithUrl: true,
    },
    fetchConfig: {
      fetchFn: fetchProducts,
      staleTime: 2 * 60 * 1000, // 2 minutes
      onSuccess: (data) => {
        if (data.meta) {
          setAvailableBrands(data.meta.brands);
          setAvailableTags(data.meta.tags);
          setAvailableCategories(data.meta.categories);
          setAvailableSubcategories(data.meta.subcategories);
        }
      },
    },
    enablePresets: true,
  });

  // Infinite Scroll View with useFilterPilotInfinite
  const infiniteFilterPilot = useFilterPilotInfinite<Product, ProductFilters>({
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
    ],
    fetchConfig: {
      fetchFn: fetchProductsInfinite,
      staleTime: 2 * 60 * 1000, // 2 minutes
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  });

  // Mutation for updating products
  const updateMutation = useFilterMutation<Product, ProductFilters, Product, Partial<Product> & { id: string }>({
    filterPilot,
    mutationFn: updateProduct,
    invalidateOnSuccess: true,
    optimisticUpdate: (variables) => {
      // Return optimistically updated data
      return filterPilot.data?.map(product => 
        product.id === variables.id ? { ...product, ...variables } : product
      ) || [];
    },
    onSuccess: () => {
      setEditingProduct(null);
    },
    onError: (error) => {
      alert(`Error updating product: ${error.message}`);
    },
  });

  // Mutation for deleting products
  const deleteMutation = useFilterMutation<Product, ProductFilters, { success: boolean, id: string }, string>({
    filterPilot,
    mutationFn: deleteProduct,
    invalidateOnSuccess: true,
    optimisticUpdate: (productId) => {
      // Return data with the product removed
      return filterPilot.data?.filter(product => product.id !== productId) || [];
    },
    onSuccess: () => {
      setDeletingProductId(null);
    },
    onError: (error) => {
      alert(`Error deleting product: ${error.message}`);
    },
  });

  // Handle product edit
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  // Handle product save
  const handleSaveProduct = (productData: Partial<Product> & { id: string }) => {
    updateMutation.mutate(productData);
  };

  // Handle product delete confirmation
  const handleDeleteConfirm = (productId: string) => {
    setDeletingProductId(productId);
  };

  // Handle product delete
  const handleDeleteProduct = () => {
    if (deletingProductId) {
      deleteMutation.mutate(deletingProductId);
    }
  };

  // Intersection Observer for infinite scrolling
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && infiniteFilterPilot.hasNextPage && !infiniteFilterPilot.isFetchingNextPage) {
        infiniteFilterPilot.fetchNextPage();
      }
    },
    [infiniteFilterPilot]
  );

  // Set up the intersection observer
  useEffect(() => {
    if (viewMode !== 'infinite') return;
    
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px 400px 0px', // Load more when 400px from bottom
    });
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver, viewMode]);

  // Extract values from filterPilot
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
    toggleSort,
    hasActiveFilters,
    getActiveFiltersCount,
    presets,
  } = filterPilot;

  return (
    <div className="advanced-example">
      <div className="example-header">
        <h2>Advanced Product Catalog</h2>
        <p>Demonstrating all features of React Filter Pilot</p>
        
        <div className="view-mode-toggle">
          <button 
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
          >
            Grid View (Pagination)
          </button>
          <button 
            className={viewMode === 'infinite' ? 'active' : ''}
            onClick={() => setViewMode('infinite')}
          >
            Infinite Scroll
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filters {hasActiveFilters() && <span className="filter-count">({getActiveFiltersCount()})</span>}</h3>
          <button onClick={resetFilters} className="reset-btn" disabled={!hasActiveFilters()}>
            Reset All
          </button>
        </div>

        <div className="filters-grid">
          {/* Search Filter */}
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              value={viewMode === 'grid' ? filters.search : infiniteFilterPilot.filters.search}
              onChange={(e) => viewMode === 'grid' 
                ? setFilterValue('search', e.target.value)
                : infiniteFilterPilot.setFilterValue('search', e.target.value)
              }
              placeholder="Search products..."
              className="search-input"
            />
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label>Category</label>
            <select
              value={viewMode === 'grid' ? filters.category : infiniteFilterPilot.filters.category}
              onChange={(e) => viewMode === 'grid'
                ? setFilterValue('category', e.target.value)
                : infiniteFilterPilot.setFilterValue('category', e.target.value)
              }
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Only show these filters in grid view */}
          {viewMode === 'grid' && (
            <>
              {/* Subcategory Filter */}
              <div className="filter-group">
                <label>Subcategory</label>
                <select
                  value={filters.subcategory}
                  onChange={(e) => setFilterValue('subcategory', e.target.value)}
                  className="filter-select"
                  disabled={filters.category === 'all'}
                >
                  <option value="all">All Subcategories</option>
                  {availableSubcategories
                    .filter(subcat => filters.category === 'all' || 
                      mockProducts.some(p => p.category === filters.category && p.subcategory === subcat))
                    .map(subcategory => (
                      <option key={subcategory} value={subcategory}>{subcategory}</option>
                    ))
                  }
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="filter-group">
                <label>Price Range: ${filters.priceRange.min} - ${filters.priceRange.max}</label>
                <div className="range-slider">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={filters.priceRange.min}
                    onChange={(e) => setFilterValue('priceRange', { 
                      ...filters.priceRange, 
                      min: parseInt(e.target.value) 
                    })}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={filters.priceRange.max}
                    onChange={(e) => setFilterValue('priceRange', { 
                      ...filters.priceRange, 
                      max: parseInt(e.target.value) 
                    })}
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="filter-group">
                <label>Minimum Rating: {filters.rating} ★</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.rating}
                  onChange={(e) => setFilterValue('rating', parseFloat(e.target.value))}
                />
              </div>

              {/* In Stock Filter */}
              <div className="filter-group checkbox-filter">
                <label>
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => setFilterValue('inStock', e.target.checked)}
                  />
                  In Stock Only
                </label>
              </div>
            </>
          )}

          {/* Brand Filter - Show in both views */}
          <div className="filter-group">
            <label>Brands</label>
            <div className="multi-select">
              {availableBrands.slice(0, 10).map(brand => (
                <label key={brand} className="multi-select-option">
                  <input
                    type="checkbox"
                    checked={viewMode === 'grid' 
                      ? filters.brands.includes(brand)
                      : infiniteFilterPilot.filters.brands.includes(brand)
                    }
                    onChange={() => {
                      if (viewMode === 'grid') {
                        const newBrands = filters.brands.includes(brand)
                          ? filters.brands.filter(b => b !== brand)
                          : [...filters.brands, brand];
                        setFilterValue('brands', newBrands);
                      } else {
                        const newBrands = infiniteFilterPilot.filters.brands.includes(brand)
                          ? infiniteFilterPilot.filters.brands.filter(b => b !== brand)
                          : [...infiniteFilterPilot.filters.brands, brand];
                        infiniteFilterPilot.setFilterValue('brands', newBrands);
                      }
                    }}
                  />
                  {brand}
                </label>
              ))}
            </div>
          </div>

          {/* Only show these filters in grid view */}
          {viewMode === 'grid' && (
            <>
              {/* Tags Filter */}
              <div className="filter-group">
                <label>Tags</label>
                <div className="tags-filter">
                  {availableTags.slice(0, 10).map(tag => (
                    <button
                      key={tag}
                      className={`tag-btn ${filters.tags.includes(tag) ? 'active' : ''}`}
                      onClick={() => {
                        const newTags = filters.tags.includes(tag)
                          ? filters.tags.filter(t => t !== tag)
                          : [...filters.tags, tag];
                        setFilterValue('tags', newTags);
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="filter-group date-range-filter">
                <label>Created Date Range</label>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={filters.dateRange.min}
                    onChange={(e) => setFilterValue('dateRange', { 
                      ...filters.dateRange, 
                      min: e.target.value 
                    })}
                    placeholder="From"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={filters.dateRange.max}
                    onChange={(e) => setFilterValue('dateRange', { 
                      ...filters.dateRange, 
                      max: e.target.value 
                    })}
                    placeholder="To"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filter Presets - Only in grid view */}
        {viewMode === 'grid' && presets && (
          <div className="filter-presets">
            <div className="presets-header">
              <h4>Saved Filters</h4>
              <button
                onClick={() => {
                  const name = prompt('Enter a name for this filter preset:');
                  if (name) {
                    presets.savePreset(name);
                  }
                }}
                className="save-preset-btn"
              >
                Save Current Filters
              </button>
            </div>
            
            <div className="presets-list">
              {presets.getPresets().map((preset) => (
                <div key={preset.id} className="preset-item">
                  <span className="preset-name">{preset.name}</span>
                  <div className="preset-actions">
                    <button onClick={() => presets.loadPreset(preset)} className="apply-preset-btn">
                      Apply
                    </button>
                    <button onClick={() => presets.deletePreset(preset.id)} className="delete-preset-btn">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {presets.getPresets().length === 0 && (
                <p className="no-presets">No saved filters yet. Use the button above to save your current filters.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid View with Pagination */}
      {viewMode === 'grid' && (
        <>
          {/* Sorting and Results Count */}
          <div className="results-header">
            <div className="results-count">
              Showing {data?.length || 0} of {pagination.totalRecords} products
            </div>
            
            <div className="sorting-controls">
              <label>Sort by:</label>
              <select
                value={`${sort?.field || 'name'}-${sort?.direction || 'asc'}`}
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
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: pagination.pageSize }).map((_, index) => (
                <div key={index} className="product-card skeleton">
                  <div className="product-image skeleton-img"></div>
                  <div className="product-content">
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-actions"></div>
                  </div>
                </div>
              ))
            ) : data?.length === 0 ? (
              // No results
              <div className="no-results">
                <h3>No products found</h3>
                <p>Try adjusting your filters to find what you're looking for.</p>
                <button onClick={resetFilters} className="reset-filters-btn">
                  Reset All Filters
                </button>
              </div>
            ) : (
              // Product cards
              data?.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteConfirm}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Page {pagination.page} of {pagination.totalPages}
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
              
              {/* Page numbers */}
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  // Calculate which page numbers to show
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
                      onClick={() => setPage(pageNum)}
                      className={`page-number ${pagination.page === pageNum ? 'active' : ''}`}
                      disabled={isLoading}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
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
                  {[6, 12, 24, 48].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                per page
              </label>
            </div>
          </div>
        </>
      )}

      {/* Infinite Scroll View */}
      {viewMode === 'infinite' && (
        <>
          <div className="results-header">
            <div className="results-count">
              Showing {infiniteFilterPilot.data.length} of {infiniteFilterPilot.totalRecords} products
            </div>
          </div>

          {/* Products Grid for Infinite Scroll */}
          <div className="products-grid">
            {infiniteFilterPilot.isLoading && infiniteFilterPilot.data.length === 0 ? (
              // Initial loading skeletons
              Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="product-card skeleton">
                  <div className="product-image skeleton-img"></div>
                  <div className="product-content">
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-actions"></div>
                  </div>
                </div>
              ))
            ) : infiniteFilterPilot.data.length === 0 ? (
              // No results
              <div className="no-results">
                <h3>No products found</h3>
                <p>Try adjusting your filters to find what you're looking for.</p>
                <button onClick={infiniteFilterPilot.resetFilters} className="reset-filters-btn">
                  Reset All Filters
                </button>
              </div>
            ) : (
              // Product cards
              infiniteFilterPilot.data.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteConfirm}
                />
              ))
            )}
            
            {/* Loading more skeletons */}
            {infiniteFilterPilot.isFetchingNextPage && (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`loading-more-${index}`} className="product-card skeleton">
                  <div className="product-image skeleton-img"></div>
                  <div className="product-content">
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text short"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-actions"></div>
                  </div>
                </div>
              ))
            )}
            
            {/* Observer target for infinite scrolling */}
            <div ref={observerTarget} className="observer-target"></div>
          </div>

          {/* Load more button (alternative to infinite scroll) */}
          {infiniteFilterPilot.hasNextPage && (
            <button 
              onClick={() => infiniteFilterPilot.fetchNextPage()} 
              disabled={infiniteFilterPilot.isFetchingNextPage}
              className="load-more-btn"
            >
              {infiniteFilterPilot.isFetchingNextPage ? 'Loading more...' : 'Load More Products'}
            </button>
          )}
          
          {/* End of results message */}
          {!infiniteFilterPilot.hasNextPage && infiniteFilterPilot.data.length > 0 && (
            <div className="end-message">
              You've reached the end of the results.
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <ProductEditModal 
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => setEditingProduct(null)}
          allCategories={availableCategories}
          allSubcategories={availableSubcategories}
          allBrands={availableBrands}
          allTags={availableTags}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <ConfirmationModal
          message="Are you sure you want to delete this product? This action cannot be undone."
          onConfirm={handleDeleteProduct}
          onCancel={() => setDeletingProductId(null)}
        />
      )}
    </div>
  );
};