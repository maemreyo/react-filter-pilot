# Pain Points & Solutions Guide

This guide addresses common challenges when using react-filter-pilot and provides solutions and best practices.

## 1. Performance Issues

### Pain Point: Too Many Re-renders

**Problem**: Filter changes trigger unnecessary re-renders across the app.

**Solutions**:

```tsx
// 1. Use React.memo for filter components
const FilterInput = React.memo(({ value, onChange, label }) => {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
    />
  );
});

// 2. Memoize filter configs
const filterConfigs = useMemo(() => [
  { name: 'search', defaultValue: '', debounceMs: 300 },
  { name: 'category', defaultValue: 'all' },
], []);

// 3. Use selective subscriptions
const { filters, setFilterValue } = useFilterPilot({
  filterConfigs,
  // Only re-render when specific filters change
  select: (state) => ({
    search: state.filters.search,
    category: state.filters.category,
  }),
});
```

### Pain Point: Slow Initial Load

**Problem**: Large datasets cause slow initial page load.

**Solutions**:

```tsx
// 1. Use placeholder data
const { data } = useFilterPilot({
  fetchConfig: {
    placeholderData: { data: [], totalRecords: 0 },
    // Or use suspense
    suspense: true,
  },
});

// 2. Implement virtual scrolling
import { VirtualList } from '@tanstack/react-virtual';

function OptimizedList() {
  const { data } = useFilterPilot({ /* ... */ });
  
  return (
    <VirtualList
      items={data}
      height={600}
      itemHeight={100}
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  );
}

// 3. Use server-side rendering
export async function getServerSideProps({ query }) {
  const data = await fetchProducts(query);
  return { props: { initialData: data } };
}
```

## 2. State Management Complexity

### Pain Point: Complex Filter Dependencies

**Problem**: Some filters depend on others (e.g., subcategory depends on category).

**Solution**:

```tsx
// Create a custom hook for dependent filters
function useDependentFilters() {
  const { filters, setFilterValue, setFilters } = useFilterPilot({
    filterConfigs: [
      { name: 'category', defaultValue: '' },
      { name: 'subcategory', defaultValue: '' },
    ],
  });

  // Reset subcategory when category changes
  const setCategoryWithReset = useCallback((category: string) => {
    setFilters({
      category,
      subcategory: '', // Reset dependent filter
    });
  }, [setFilters]);

  // Fetch subcategories based on category
  const { data: subcategories } = useQuery({
    queryKey: ['subcategories', filters.category],
    queryFn: () => fetchSubcategories(filters.category),
    enabled: !!filters.category,
  });

  return {
    filters,
    setFilterValue,
    setCategoryWithReset,
    subcategories,
  };
}
```

### Pain Point: Global Filter State

**Problem**: Need to share filter state across multiple components.

**Solution**:

```tsx
// Create a filter context
const FilterContext = createContext<UseFilterPilotResult<any, any> | null>(null);

export function FilterProvider({ children }) {
  const filterPilot = useFilterPilot({
    // ... config
  });

  return (
    <FilterContext.Provider value={filterPilot}>
      {children}
    </FilterContext.Provider>
  );
}

// Create typed hooks
export function useProductFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useProductFilters must be used within FilterProvider');
  return context;
}

// Usage
function FilterSidebar() {
  const { filters, setFilterValue } = useProductFilters();
  // ...
}

function ProductGrid() {
  const { data, isLoading } = useProductFilters();
  // ...
}
```

## 3. URL Synchronization Issues

### Pain Point: URL Gets Too Long

**Problem**: Complex filters create very long URLs that may exceed browser limits.

**Solutions**:

```tsx
// 1. Use shorter URL keys
const filterConfigs = [
  { name: 'searchTerm', urlKey: 'q' },
  { name: 'category', urlKey: 'c' },
  { name: 'priceRange', urlKey: 'p' },
];

// 2. Compress filter values
const compressedUrlHandler = createUrlHandler({
  getUrl: () => window.location.href,
  setUrl: (url) => {
    const compressed = LZString.compressToEncodedURIComponent(url);
    window.history.pushState(null, '', `?f=${compressed}`);
  },
});

// 3. Store complex filters in session storage
const hybridUrlHandler = {
  getParams: () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFilters = JSON.parse(sessionStorage.getItem('filters') || '{}');
    
    // Merge URL and session filters
    return new URLSearchParams({ ...sessionFilters, ...Object.fromEntries(urlParams) });
  },
  setParams: (params) => {
    const simple = ['q', 'page', 'sort'];
    const urlParams = new URLSearchParams();
    const sessionFilters = {};
    
    params.forEach((value, key) => {
      if (simple.includes(key)) {
        urlParams.set(key, value);
      } else {
        sessionFilters[key] = value;
      }
    });
    
    sessionStorage.setItem('filters', JSON.stringify(sessionFilters));
    window.history.pushState(null, '', `?${urlParams}`);
  },
};
```

### Pain Point: Browser Back/Forward Conflicts

**Problem**: Browser navigation doesn't properly restore filter state.

**Solution**:

```tsx
function useHistoryAwareFilters() {
  const [historyKey, setHistoryKey] = useState(0);
  
  useEffect(() => {
    const handlePopState = () => {
      setHistoryKey(k => k + 1); // Force re-initialization
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return useFilterPilot({
    key: historyKey, // Force new instance on history change
    // ... config
  });
}
```

## 4. Data Fetching Challenges

### Pain Point: Race Conditions

**Problem**: Fast filter changes cause race conditions with async requests.

**Solution**:

```tsx
// TanStack Query handles this automatically, but for custom implementations:
function useRaceConditionSafeFilters() {
  const abortControllerRef = useRef<AbortController>();
  
  const fetchData = useCallback(async (filters) => {
    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/products', {
        signal: abortControllerRef.current.signal,
        // ... options
      });
      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Ignored
      }
      throw error;
    }
  }, []);
}
```

### Pain Point: Optimistic Updates Break

**Problem**: Optimistic updates fail when server response differs from expected.

**Solution**:

```tsx
// Implement rollback with validation
const mutation = useFilterMutation({
  filterPilot,
  mutationFn: updateProduct,
  optimisticUpdate: (variables) => {
    return data.map(item =>
      item.id === variables.id ? { ...item, ...variables } : item
    );
  },
  onSuccess: (result, variables) => {
    // Validate server response
    if (result.id !== variables.id) {
      // Force refetch if mismatch
      queryClient.invalidateQueries({ queryKey: filterPilot.getQueryKey() });
    }
  },
});
```

## 5. Type Safety Issues

### Pain Point: Loose Filter Types

**Problem**: Filter types are not properly inferred or validated.

**Solution**:

```tsx
// 1. Define strict filter types
interface ProductFilters {
  search: string;
  category: 'electronics' | 'clothing' | 'books' | 'all';
  priceRange: { min: number; max: number };
  inStock: boolean;
}

// 2. Create typed filter configs
const createFilterConfig = <K extends keyof ProductFilters>(
  name: K,
  config: Omit<FilterConfig, 'name'> & {
    defaultValue: ProductFilters[K];
  }
): FilterConfig => ({
  name,
  ...config,
});

const filterConfigs = [
  createFilterConfig('search', { defaultValue: '', debounceMs: 300 }),
  createFilterConfig('category', { defaultValue: 'all' }),
  createFilterConfig('priceRange', { defaultValue: { min: 0, max: 1000 } }),
];

// 3. Use zod for runtime validation
import { z } from 'zod';

const FilterSchema = z.object({
  search: z.string(),
  category: z.enum(['electronics', 'clothing', 'books', 'all']),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }),
});

const validateFilters = (filters: unknown): ProductFilters => {
  return FilterSchema.parse(filters);
};
```

## 6. Testing Difficulties

### Pain Point: Hard to Test Filter Logic

**Problem**: URL handlers and async operations make testing complex.

**Solution**:

```tsx
// 1. Create test utilities
export const createMockFilterPilot = <TData, TFilters>(
  initialData: TData[] = [],
  initialFilters: TFilters
) => {
  return {
    filters: initialFilters,
    setFilterValue: jest.fn(),
    setFilters: jest.fn(),
    data: initialData,
    isLoading: false,
    // ... other properties
  };
};

// 2. Mock URL handler
const mockUrlHandler = {
  getParams: jest.fn(() => new URLSearchParams()),
  setParams: jest.fn(),
};

// 3. Test example
describe('ProductList', () => {
  it('should filter products', async () => {
    const mockPilot = createMockFilterPilot<Product, ProductFilters>(
      mockProducts,
      { search: '', category: 'all' }
    );
    
    render(<ProductList filterPilot={mockPilot} />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    
    expect(mockPilot.setFilterValue).toHaveBeenCalledWith('search', 'laptop');
  });
});
```

## 7. Mobile Experience

### Pain Point: Complex Filters on Mobile

**Problem**: Desktop filter UI doesn't work well on mobile devices.

**Solution**:

```tsx
// Create responsive filter UI
function ResponsiveFilters() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const { filters, hasActiveFilters } = useFilterPilot({
    // ... config
  });

  if (isMobile) {
    return (
      <>
        <button onClick={() => setMobileFiltersOpen(true)}>
          Filters {hasActiveFilters() && `(${getActiveFiltersCount()})`}
        </button>
        
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent side="bottom" className="h-[80vh]">
            <FilterForm />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return <FilterSidebar />;
}
```

## 8. Accessibility Concerns

### Pain Point: Filter UI Not Accessible

**Problem**: Dynamic filter updates not announced to screen readers.

**Solution**:

```tsx
// Add ARIA live regions
function AccessibleFilters() {
  const { filters, data, isLoading } = useFilterPilot({
    // ... config
  });

  return (
    <>
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isLoading ? 'Loading results...' : `${data.length} results found`}
      </div>
      
      <form role="search" aria-label="Product filters">
        {/* Filter inputs with proper labels */}
      </form>
    </>
  );
}
```

## Future Improvements Roadmap

### 1. **Built-in Virtualization**
- Add native support for windowing/virtualization
- Integrate with @tanstack/react-virtual

### 2. **Filter Analytics**
- Track filter usage patterns
- Provide insights on popular filter combinations

### 3. **AI-Powered Filters**
- Natural language search processing
- Smart filter suggestions based on user behavior

### 4. **Offline Support**
- Cache filters and results in IndexedDB
- Sync when connection restored

### 5. **Filter Templates**
- Pre-built filter UI components
- Customizable themes

### 6. **Performance Monitoring**
- Built-in performance metrics
- Automatic optimization suggestions