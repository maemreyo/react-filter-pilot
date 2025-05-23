# **react-filter-pilot**

![npm version](https://img.shields.io/npm/v/react-filter-pilot)
![license](https://img.shields.io/npm/l/react-filter-pilot)
![build status](https://img.shields.io/github/actions/workflow/status/maemreyo/react-filter-pilot/main.yml?branch=main)

react-filter-pilot is a powerful and flexible custom hook for React, designed to simplify the management of filter states, synchronize them with URL query parameters, handle pagination, and provide deep customization for data fetching processes. This library helps you build dynamic data lists and tables efficiently and with greater maintainability.

## **✨ Key Features**

- 🚀 **Intelligent Filter Management:** Easily define and manage the state of various filter types.
- 🔗 **Automatic URL Synchronization:** Two-way synchronization between filter state and URL query parameters, supporting bookmarks and shareable links.
- ⚙️ **Deeply Customizable Data Fetching:** Provides hooks to intervene at every stage of the fetching process, integrating smoothly with TanStack Query.
- 📄 **Flexible Pagination:** Supports internal pagination management or control from external state (e.g., from a Mantine Table).
- ⏱️ **Built-in Debouncing:** Allows individual debouncing for filter inputs to optimize performance.
- 🔄 **Value Transformation:** Easily transform filter values for URL representation, API requests, and when reading from the URL.
- ⏳ **Asynchronous Initial Filters:** Supports setting initial filter values fetched from an API.
- 💾 **Filter Presets:** Core functions to enable saving and loading filter configurations (saved searches).
- 🔀 **Multi-Select & Range Filters:** First-class support for array-based and object-based filter values.
- 🧩 **Built-in URL Adapters:** Ready-to-use adapters for React Router DOM and Next.js.
- ⚡ **Optimized with Caching:** Designed to work effectively with TanStack Query's caching mechanisms.

## **🎯 Requirements**

- React 16.8+
- @tanstack/react-query v4+ or v5+ (for data fetching and caching)
- Optional: A routing library like react-router-dom v6+ or Next.js (if using a custom urlHandler for advanced URL integration). The library provides a default internal URL handler.

## **📦 Installation**

```bash
# Using npm
npm install react-filter-pilot

# Using yarn
yarn add react-filter-pilot

# Using pnpm
pnpm add react-filter-pilot
```

## **🚀 Quick Start**

```jsx
import React from 'react';
import { useFilterPilot } from 'react-filter-pilot';
// Ensure you have QueryClientProvider set up at the root of your app

// 1. Define your data fetching function
const fetchMyItems = async ({ filters, pagination, sort }) => {
  const params = new URLSearchParams();
  if (filters.searchTerm) params.set('q', String(filters.searchTerm));
  params.set('page', String(pagination.page));
  params.set('limit', String(pagination.pageSize));
  if (sort?.field) {
    params.set('sortBy', sort.field);
    params.set('sortOrder', sort.direction);
  }

  // Replace with your actual API endpoint
  const response = await fetch(`/api/items?${params.toString()}`);
  if (!response.ok) throw new Error('Network response was not ok');
  const result = await response.json(); // Assuming API returns { items: [], totalCount: 0 }
  return { data: result.items, totalRecords: result.totalCount };
};

// 2. Use the hook in your component
function MyFilteredListComponent() {
  const { filters, setFilterValue, data, isLoading, pagination, sort } = useFilterPilot({
    filterConfigs: [
      { name: 'searchTerm', defaultValue: '', urlKey: 'q', debounceMs: 300 },
      { name: 'category', defaultValue: 'all' },
    ],
    paginationConfig: {
      initialPageSize: 10,
    },
    sortConfig: {
      // Optional sorting
      initialSortField: 'name',
      initialSortDirection: 'asc',
    },
    fetchConfig: {
      fetchFn: fetchMyItems,
    },
    // No urlHandler provided, uses default internal URL sync.
  });

  return (
    <div>
      <input
        type='text'
        placeholder='Search...'
        value={filters.searchTerm || ''}
        onChange={(e) => setFilterValue('searchTerm', e.target.value)}
      />
      {/* Add other filter UIs, sorting controls, and display the data list */}
      {isLoading && <p>Loading...</p>}
      <ul>
        {data?.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
      {/* Add pagination UI using pagination state and methods */}
      {/* Add sorting UI using sort state and methods */}
    </div>
  );
}
```

## **🔌 Using with React Router DOM**

react-filter-pilot provides a built-in adapter for React Router DOM v6+:

```jsx
import { useFilterPilot, useReactRouterDomUrlHandler } from 'react-filter-pilot';

function MyComponent() {
  // Create a URL handler using React Router DOM
  const urlHandler = useReactRouterDomUrlHandler();

  const { filters, setFilterValue /* ... */ } = useFilterPilot({
    // ...other options
    urlHandler, // Use the React Router DOM URL handler
  });

  // Rest of your component
}
```

## **🔌 Using with Next.js**

react-filter-pilot provides a built-in adapter for Next.js App Router:

```jsx
import { useFilterPilot, useNextJsUrlHandler } from 'react-filter-pilot';

function MyComponent() {
  // Create a URL handler using Next.js
  const urlHandler = useNextJsUrlHandler();

  const { filters, setFilterValue /* ... */ } = useFilterPilot({
    // ...other options
    urlHandler, // Use the Next.js URL handler
  });

  // Rest of your component
}
```

## **📚 Detailed Documentation**

To learn more about installation, configuration, and all the features of react-filter-pilot, please refer to our [**Full Documentation**](https://github.com/maemreyo/react-filter-pilot/tree/main/docs).

## **� Development & Playground**

This repository includes a playground to test and experiment with the library:

```bash
# Clone the repository
git clone https://github.com/maemreyo/react-filter-pilot.git
cd react-filter-pilot

# Install dependencies
pnpm install

# Start the playground
cd playground
pnpm install
pnpm dev
```

The playground will be available at http://localhost:3000.

## **�🤝 Contributing**

We welcome contributions from the community! Please read our [Contributing Guidelines](https://github.com/maemreyo/react-filter-pilot/blob/main/docs/CONTRIBUTING.md) for more details.

## **📄 License**

[MIT](https://github.com/maemreyo/react-filter-pilot/blob/main/LICENSE)
