import { Product } from ".";

// Mock data generator
export const generateMockProducts = (count: number): Product[] => {
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
export const mockDatabase = generateMockProducts(150);

// Mock API fetch function
export const fetchProducts = async ({ filters, pagination, sort }: any) => {
  console.log("Fetching products...", filters, pagination, sort)

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

