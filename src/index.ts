// Main exports
export { useFilterPilot } from './hooks/useFilterPilot';
export { useFilterPilotInfinite } from './hooks/useFilterPilotInfinite';
export { useFilterMutation } from './hooks/useFilterMutation';
export {
  useFetchControl,
  useRequiredFilters,
  useDependentFilters,
  useFilterCombinations,
} from './hooks/useAdvancedFetchControl';

// URL Adapters
export { useReactRouterDomUrlHandler } from './adapters/reactRouterDom';
export { useNextJsUrlHandler } from './adapters/nextJs';
export { useNextJsPagesUrlHandler } from './adapters/nextJsPages';
export { useNextJsAppCustomUrlHandler } from './adapters/nextJsAppCustom';
export { useDefaultUrlHandler } from './hooks/useUrlHandler';
export { createUrlHandler, useHashUrlHandler, createMemoryUrlHandler } from './adapters/universal';

// Type exports
export type {
  FilterConfig,
  PaginationConfig,
  SortConfig,
  FetchConfig,
  UseFilterPilotOptions,
  UseFilterPilotResult,
  UrlHandler,
  FilterValue,
  RangeValue,
  FilterPreset,
  FetchParams,
  FetchResult,
  PaginationState,
  SortState,
} from './types';

// Also export the infinite hook result type
export type { UseFilterPilotInfiniteResult } from './hooks/useFilterPilotInfinite';

// Utility exports
export {
  transformFilterValue,
  parseUrlParams,
  buildUrlParams,
  debounce,
  isFilterActive,
  getDefaultFilters,
  compareFilters,
  mergeFilters,
} from './utils';

// Test utilities are not exported in the production build
// They are available in the source code for testing purposes only

// TanStack Query compatibility utilities
export {
  normalizeQueryOptions,
  detectTanStackQueryVersion,
  createQueryOptions,
  createInfiniteQueryOptions,
} from './compat/tanstack-query';
