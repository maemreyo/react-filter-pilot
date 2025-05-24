# Routing Integration Guide

react-filter-pilot provides built-in adapters for popular routing libraries and a flexible system for custom integrations.

## React Router DOM v6

### Basic Setup

```tsx
import { useFilterPilot, useReactRouterDomUrlHandler } from 'react-filter-pilot';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/products" element={<ProductList />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProductList() {
  const urlHandler = useReactRouterDomUrlHandler();
  
  const { filters, setFilterValue } = useFilterPilot({
    urlHandler,
    filterConfigs: [
      { name: 'search', urlKey: 'q' },
      { name: 'category', urlKey: 'cat' },
    ],
    // ... other config
  });

  // URL updates automatically: /products?q=laptop&cat=electronics
}
```

### Programmatic Navigation

```tsx
import { useNavigate } from 'react-router-dom';

function FilteredPage() {
  const navigate = useNavigate();
  const urlHandler = useReactRouterDomUrlHandler();
  
  const { filters } = useFilterPilot({ urlHandler, /* ... */ });

  const shareFilters = () => {
    const params = new URLSearchParams(window.location.search);
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const navigateWithFilters = () => {
    navigate({
      pathname: '/other-page',
      search: window.location.search, // Preserve filters
    });
  };
}
```

## Next.js App Router

### Basic Setup

```tsx
'use client';

import { useFilterPilot, useNextJsUrlHandler } from 'react-filter-pilot';

export default function ProductsPage() {
  const urlHandler = useNextJsUrlHandler();
  
  const { filters, setFilterValue } = useFilterPilot({
    urlHandler,
    filterConfigs: [
      { name: 'search', urlKey: 'q' },
      { name: 'category', urlKey: 'cat' },
    ],
    // ... other config
  });

  // URL updates automatically: /products?q=laptop&cat=electronics
}
```

### Server Components Integration

```tsx
// app/products/page.tsx
import { ProductList } from './ProductList';

// Server component
export default function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; cat?: string };
}) {
  // Pass initial values to client component
  return (
    <ProductList
      initialSearch={searchParams.q || ''}
      initialCategory={searchParams.cat || 'all'}
    />
  );
}

// app/products/ProductList.tsx
'use client';

import { useFilterPilot, useNextJsUrlHandler } from 'react-filter-pilot';

export function ProductList({
  initialSearch,
  initialCategory,
}: {
  initialSearch: string;
  initialCategory: string;
}) {
  const urlHandler = useNextJsUrlHandler();
  
  const { filters } = useFilterPilot({
    urlHandler,
    filterConfigs: [
      { name: 'search', defaultValue: initialSearch },
      { name: 'category', defaultValue: initialCategory },
    ],
    // ... other config
  });
}
```

### Parallel Routes

```tsx
// app/@modal/products/[id]/page.tsx
export default function ProductModal({ params }: { params: { id: string } }) {
  const urlHandler = useNextJsUrlHandler();
  
  // Modal can access and modify parent route filters
  const { filters } = useFilterPilot({
    urlHandler,
    // ... config
  });
}
```

## Next.js Pages Router

### Basic Setup

```tsx
import { useFilterPilot, useNextJsPagesUrlHandler } from 'react-filter-pilot';

export default function ProductsPage() {
  const urlHandler = useNextJsPagesUrlHandler();
  
  const { filters, setFilterValue } = useFilterPilot({
    urlHandler,
    filterConfigs: [
      { name: 'search', urlKey: 'q' },
      { name: 'category', urlKey: 'cat' },
    ],
    // ... other config
  });
}
```

### With getServerSideProps

```tsx
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const search = query.q || '';
  const category = query.cat || 'all';
  
  // Optionally pre-fetch data
  const initialData = await fetchProducts({ search, category });
  
  return {
    props: {
      initialSearch: search,
      initialCategory: category,
      initialData,
    },
  };
};

export default function ProductsPage({ initialSearch, initialCategory, initialData }) {
  const urlHandler = useNextJsPagesUrlHandler();
  
  const { filters } = useFilterPilot({
    urlHandler,
    filterConfigs: [
      { name: 'search', defaultValue: initialSearch },
      { name: 'category', defaultValue: initialCategory },
    ],
    fetchConfig: {
      placeholderData: initialData, // Use SSR data as placeholder
      // ... other config
    },
  });
}
```

## Hash-based Routing

For SPAs that use hash routing:

```tsx
import { useFilterPilot, useHashUrlHandler } from 'react-filter-pilot';

function App() {
  const urlHandler = useHashUrlHandler();
  
  const { filters } = useFilterPilot({
    urlHandler,
    // ... config
  });

  // URL: example.com/#/products?q=laptop&cat=electronics
}
```

## Custom URL Handlers

### Basic Custom Handler

```tsx
import { createUrlHandler } from 'react-filter-pilot';

const customUrlHandler = createUrlHandler({
  getUrl: () => window.location.href,
  setUrl: (url) => {
    window.history.pushState(null, '', url);
  },
});
```

### Storage-based URL Handler

```tsx
// For React Native or Electron
const storageUrlHandler = createUrlHandler({
  getUrl: () => localStorage.getItem('app-url') || '/',
  setUrl: (url) => {
    localStorage.setItem('app-url', url);
    // Trigger re-render if needed
    window.dispatchEvent(new Event('storage'));
  },
});
```

### WebView URL Handler

```tsx
// For mobile WebView integration
const webViewUrlHandler = createUrlHandler({
  getUrl: () => {
    // Get URL from WebView bridge
    return window.ReactNativeWebView?.url || '/';
  },
  setUrl: (url) => {
    // Send URL to native app
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: 'url-change', url })
    );
  },
});
```

## Memory URL Handler (Testing)

```tsx
import { createMemoryUrlHandler } from 'react-filter-pilot';

// For unit tests
describe('ProductList', () => {
  it('should update filters', () => {
    const urlHandler = createMemoryUrlHandler('/products');
    
    render(
      <ProductList urlHandler={urlHandler} />
    );
    
    // Test filter changes without actual URL updates
  });
});
```

## Advanced Patterns

### Shared Filter State

```tsx
// Create a context for shared URL handler
const UrlHandlerContext = createContext<UrlHandler | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const urlHandler = useReactRouterDomUrlHandler();
  
  return (
    <UrlHandlerContext.Provider value={urlHandler}>
      {children}
    </UrlHandlerContext.Provider>
  );
}

// Use in multiple components
function useSharedFilters() {
  const urlHandler = useContext(UrlHandlerContext);
  
  return useFilterPilot({
    urlHandler,
    // Shared configuration
  });
}
```

### Filter Persistence

```tsx
function PersistentFilters() {
  const urlHandler = useReactRouterDomUrlHandler();
  
  const { filters } = useFilterPilot({
    urlHandler,
    initialFiltersProvider: async () => {
      // Load from localStorage first
      const saved = localStorage.getItem('user-filters');
      if (saved) return JSON.parse(saved);
      
      // Then from URL
      const params = urlHandler.getParams();
      return parseUrlParams(params, filterConfigs);
    },
    // ... config
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('user-filters', JSON.stringify(filters));
  }, [filters]);
}
```

### Cross-Tab Synchronization

```tsx
function SyncedFilters() {
  const [syncKey, setSyncKey] = useState(0);
  
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'filter-sync') {
        setSyncKey(k => k + 1); // Force re-render
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const urlHandler = useReactRouterDomUrlHandler();
  
  const { filters, setFilters } = useFilterPilot({
    key: syncKey, // Force new instance on sync
    urlHandler,
    // ... config
  });

  // Broadcast changes
  useEffect(() => {
    localStorage.setItem('filter-sync', JSON.stringify({
      filters,
      timestamp: Date.now(),
    }));
  }, [filters]);
}
```

## SEO Considerations

### Meta Tags Update

```tsx
import { Helmet } from 'react-helmet-async';

function SEOFriendlyFilters() {
  const { filters } = useFilterPilot({
    // ... config
  });

  const title = filters.search 
    ? `Search results for "${filters.search}"`
    : `Products - ${filters.category}`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={`Browse ${filters.category} products`} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      {/* ... */}
    </>
  );
}
```

### Structured Data

```tsx
function StructuredDataFilters() {
  const { filters, data } = useFilterPilot({
    // ... config
  });

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    url: window.location.href,
    query: filters.search,
    numberOfItems: data?.length || 0,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      {/* ... */}
    </>
  );
}
```

## Performance Tips

### 1. Shallow Routing

```tsx
// Next.js - use shallow routing for filter changes
const urlHandler = useNextJsUrlHandler();

// This prevents full page reload
router.push(url, undefined, { shallow: true });
```

### 2. Debounce URL Updates

```tsx
const debouncedUrlHandler = useMemo(() => {
  const handler = useReactRouterDomUrlHandler();
  
  return {
    getParams: handler.getParams,
    setParams: debounce(handler.setParams, 500),
  };
}, []);
```

### 3. Batch Updates

```tsx
// Update multiple filters at once
setFilters({
  search: 'laptop',
  category: 'electronics',
  priceRange: { min: 500, max: 1500 },
});

// Instead of multiple calls
// setFilterValue('search', 'laptop');
// setFilterValue('category', 'electronics');
// setFilterValue('priceRange', { min: 500, max: 1500 });
```