# Source Code Structure

This directory contains the complete source code for react-filter-pilot.

## Directory Structure

```
src/
├── hooks/                  # Core React hooks
│   ├── useFilterPilot.ts          # Main hook with filter, pagination, sort
│   ├── useFilterPilotInfinite.ts  # Infinite scrolling variant
│   ├── useFilterMutation.ts       # Mutation helper for data updates
│   ├── useDebounce.ts            # Debounce hook for performance
│   └── useUrlHandler.ts          # Default URL synchronization
│
├── adapters/              # URL synchronization adapters
│   ├── reactRouterDom.ts         # React Router v6 integration
│   ├── nextJs.ts                 # Next.js App Router integration  
│   ├── nextJsPages.ts            # Next.js Pages Router integration
│   └── universal.ts              # Universal adapters (hash, memory, custom)
│
├── types/                 # TypeScript type definitions
│   └── index.ts                  # All interfaces and types
│
├── utils/                 # Utility functions
│   ├── index.ts                  # Utility exports
│   ├── transformUtils.ts         # Value transformation helpers
│   ├── urlUtils.ts               # URL parameter parsing/building
│   ├── filterUtils.ts            # Filter state management utilities
│   └── debounce.ts               # Debounce implementation
│
├── test-utils/            # Testing utilities
│   └── index.ts                  # Mock creators and test helpers
│
├── examples/              # Usage examples
│   ├── mutations.example.tsx     # CRUD operations with mutations
│   └── infinite-scroll.example.tsx # Infinite scrolling implementation
│
└── index.ts               # Main package exports
```

## Core Concepts

### 1. **Hooks**
The main functionality is provided through React hooks:
- `useFilterPilot`: Primary hook for filter, pagination, and sorting
- `useFilterPilotInfinite`: Specialized for infinite scrolling
- `useFilterMutation`: Helper for data mutations with optimistic updates

### 2. **Adapters**
URL synchronization is handled through adapters:
- Each routing library has its own adapter
- Custom adapters can be created using `createUrlHandler`
- Memory adapter available for testing

### 3. **Type Safety**
Full TypeScript support with:
- Generic types for data and filters
- Strict type checking for configurations
- Exported types for custom implementations

### 4. **Utilities**
Helper functions for:
- URL parameter transformation
- Filter value comparison
- Debouncing for performance
- Test utilities for mocking

## Key Features Implementation

### Filter Management
- Filters are stored in React state
- Debouncing is handled per-filter
- URL synchronization is automatic
- Value transformations for URL/API

### TanStack Query Integration
- Deep integration with v4 and v5
- All query options supported
- Mutation helpers with optimistic updates
- Smart cache invalidation

### URL Synchronization
- Two-way binding with URL
- Custom transformation functions
- Support for complex data types
- Adapter pattern for flexibility

### Performance Optimizations
- Individual filter debouncing
- Efficient re-render prevention
- Smart query key structure
- Request cancellation support

## Extension Points

### Custom Adapters
```typescript
const myAdapter = createUrlHandler({
  getUrl: () => myCustomUrlGetter(),
  setUrl: (url) => myCustomUrlSetter(url),
});
```

### Custom Transformations
```typescript
{
  name: 'dateRange',
  transformToUrl: (value) => customSerialize(value),
  transformFromUrl: (value) => customDeserialize(value),
  transformForApi: (value) => apiFormat(value),
}
```

### Custom Fetch Logic
```typescript
fetchFn: async (params) => {
  // Your custom API logic
  const result = await myApi.search(params);
  return {
    data: result.items,
    totalRecords: result.total,
    meta: result.additionalInfo,
  };
}
```

## Testing

The package includes comprehensive test utilities:
- Mock creators for all main functions
- Test wrappers with providers
- Debounce helpers for async testing
- Type-safe mock data generators

## Development

### 🚀 **Modern Build System**
This package uses **tsup** for ultra-fast, zero-config builds:

```bash
# Development with watch mode
pnpm dev

# Production build
pnpm build

# Clean build artifacts
pnpm clean
```

### 📊 **Performance & Analysis**
```bash
# Bundle size analysis
pnpm run size
pnpm run analyze:bundle

# Build performance benchmarks
pnpm run benchmark

# Test console log removal
node test-console-removal.js
```

### 🔧 **Build Features**
- **⚡ 10x faster builds** with esbuild (159ms vs 1000ms+)
- **🗑️ Automatic console removal** in production
- **📦 Dual format output**: ESM + CJS
- **🎯 Tree-shaking optimized**
- **🗺️ Source maps** for debugging
- **📋 TypeScript declarations** auto-generated

## Contributing

When adding new features:
1. Add types to `/types/index.ts`
2. Export from `/index.ts`
3. Add tests using test utilities
4. Update documentation
5. Add usage examples
6. Run `pnpm build` to verify build works

## Version Compatibility

- React: 16.8+ (Hooks support)
- TanStack Query: v4 or v5
- TypeScript: 4.0+ recommended
- Node.js: 14+ for development