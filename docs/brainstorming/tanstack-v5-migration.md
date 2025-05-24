# TanStack Query v5 Migration Notes

## Breaking Changes in v5

### 1. Removed Options
The following options have been removed from v5:
- `suspense` - Use `useSuspenseQuery` hook instead
- `useErrorBoundary` - Use `useSuspenseQuery` or error boundaries directly
- `keepPreviousData` - Use `placeholderData: (previousData) => previousData`

### 2. Renamed Properties
- `isLoading` → `isPending` in mutations
- `cacheTime` → `gcTime` (garbage collection time)

### 3. New Features
- Better TypeScript support
- Improved performance
- New hooks: `useSuspenseQuery`, `useSuspenseInfiniteQuery`

## Migration Examples

### Suspense Mode

**v4:**
```tsx
const { data } = useFilterPilot({
  fetchConfig: {
    suspense: true,
    useErrorBoundary: true,
  },
});
```

**v5:**
```tsx
// Option 1: Use the regular hook without suspense
const { data } = useFilterPilot({
  fetchConfig: {
    // No suspense option
  },
});

// Option 2: Create a custom suspense version
import { useSuspenseQuery } from '@tanstack/react-query';

function useFilterPilotSuspense(options) {
  // Custom implementation using useSuspenseQuery
}
```

### Keep Previous Data

**v4:**
```tsx
const { data } = useFilterPilot({
  fetchConfig: {
    keepPreviousData: true,
  },
});
```

**v5:**
```tsx
const { data } = useFilterPilot({
  fetchConfig: {
    placeholderData: (previousData) => previousData,
  },
});
```

### Mutations

**v4:**
```tsx
const mutation = useMutation({
  // ...
});

if (mutation.isLoading) {
  // Loading...
}
```

**v5:**
```tsx
const mutation = useMutation({
  // ...
});

if (mutation.isPending) {
  // Loading...
}
```

## Compatibility

react-filter-pilot supports both v4 and v5 with these considerations:
- Core functionality works with both versions
- Some advanced options only available in v4
- Use appropriate patterns for your version