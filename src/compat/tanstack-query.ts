/**
 * Compatibility layer for TanStack Query v4 and v5
 * 
 * This file provides helpers to ensure the package works with both versions
 */

// Type to handle both v4 (cacheTime) and v5 (gcTime) naming
export interface QueryOptionsCompat {
  staleTime?: number;
  cacheTime?: number; // v4
  gcTime?: number;    // v5
  [key: string]: any;
}

/**
 * Normalize query options for compatibility
 */
export function normalizeQueryOptions(options: QueryOptionsCompat): QueryOptionsCompat {
  const normalized = { ...options };
  
  // If gcTime is not provided but cacheTime is, use cacheTime as gcTime (for v5)
  if (normalized.gcTime === undefined && normalized.cacheTime !== undefined) {
    normalized.gcTime = normalized.cacheTime;
  }
  
  // If cacheTime is not provided but gcTime is, use gcTime as cacheTime (for v4)
  if (normalized.cacheTime === undefined && normalized.gcTime !== undefined) {
    normalized.cacheTime = normalized.gcTime;
  }
  
  return normalized;
}

/**
 * Helper to detect TanStack Query version
 */
export function detectTanStackQueryVersion(): '4' | '5' | 'unknown' {
  try {
    // This is a simplified detection - in a real implementation,
    // you might check the actual package version
    const { QueryClient } = require('@tanstack/react-query');
    
    // v5 has different method signatures
    const client = new QueryClient();
    
    // Check for v5-specific methods or properties
    if ('gcTime' in (client.getDefaultOptions().queries || {})) {
      return '5';
    }
    
    return '4';
  } catch {
    return 'unknown';
  }
}

/**
 * Create version-specific query options
 */
export function createQueryOptions(
  baseOptions: QueryOptionsCompat,
  version: '4' | '5' | 'unknown' = detectTanStackQueryVersion()
): any {
  const normalized = normalizeQueryOptions(baseOptions);
  
  if (version === '5') {
    // For v5, prefer gcTime
    const { cacheTime, ...rest } = normalized;
    return rest;
  } else if (version === '4') {
    // For v4, prefer cacheTime
    const { gcTime, ...rest } = normalized;
    return rest;
  }
  
  // For unknown version, include both
  return normalized;
}

/**
 * Version-agnostic infinite query options
 */
export function createInfiniteQueryOptions(
  baseOptions: any,
  version: '4' | '5' | 'unknown' = detectTanStackQueryVersion()
): any {
  const queryOptions = createQueryOptions(baseOptions, version);
  
  // Handle differences in infinite query options between versions
  if (version === '5') {
    // v5 specific adjustments
    return {
      ...queryOptions,
      initialPageParam: baseOptions.initialPageParam ?? null,
    };
  }
  
  // v4 format
  return queryOptions;
}