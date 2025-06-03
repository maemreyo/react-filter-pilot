
import { FilterConfig } from '../types';
import { transformFilterValue } from './transformUtils';

/**
 * Parse URL parameters to filter values
 */
export function parseUrlParams(
  params: URLSearchParams,
  filterConfigs: FilterConfig[]
): Record<string, any> {
  const filters: Record<string, any> = {};

  filterConfigs.forEach((config) => {
    const urlKey = config.urlKey || config.name;
    const urlValue = params.get(urlKey);

    if (urlValue !== null) {
      filters[config.name] = transformFilterValue(
        urlValue,
        config.transformFromUrl
      );
    }
  });

  return filters;
}

/**
 * Build URL parameters from filter values
 */
export function buildUrlParams(
  filters: Record<string, any>,
  filterConfigs: FilterConfig[]
): URLSearchParams {
  const params = new URLSearchParams();

  filterConfigs.forEach((config) => {
    const value = filters[config.name];
    const urlKey = config.urlKey || config.name;

    // Skip default values or empty values
    if (
      value === undefined ||
      value === null ||
      value === config.defaultValue ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      return;
    }

    const transformedValue = transformFilterValue(
      value,
      config.transformToUrl
    );

    if (transformedValue !== undefined && transformedValue !== '') {
      params.set(urlKey, String(transformedValue));
    }
  });

  return params;
}

/**
 * Build URL parameters ONLY for filters that sync with URL
 */
export function buildSyncableUrlParams(
  filters: Record<string, any>,
  filterConfigs: FilterConfig[]
): URLSearchParams {
  const params = new URLSearchParams();

  filterConfigs.forEach((config) => {
    if (config.syncWithUrl === false) {
      return; // Skip filters that explicitly don't sync with URL
    }

    const value = filters[config.name];
    const urlKey = config.urlKey || config.name;

    // Skip default values or empty values
    if (
      value === undefined ||
      value === null ||
      value === config.defaultValue ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      return;
    }

    const transformedValue = transformFilterValue(
      value,
      config.transformToUrl
    );

    if (transformedValue !== undefined && transformedValue !== '') {
      params.set(urlKey, String(transformedValue));
    }
  });

  return params;
}

/**
 * Get list of URL keys that should be managed (sync with URL)
 */
export function getManagedUrlKeys(filterConfigs: FilterConfig[]): string[] {
  return filterConfigs
    .filter(config => config.syncWithUrl !== false)
    .map(config => config.urlKey || config.name);
}

/**
 * Get list of URL keys that should NOT be managed (no sync with URL)
 */
export function getNonManagedUrlKeys(filterConfigs: FilterConfig[]): string[] {
  return filterConfigs
    .filter(config => config.syncWithUrl === false)
    .map(config => config.urlKey || config.name);
}

/**
 * Clear only managed URL params while preserving non-managed ones
 */
export function clearManagedUrlParams(
  params: URLSearchParams,
  filterConfigs: FilterConfig[]
): URLSearchParams {
  const managedKeys = getManagedUrlKeys(filterConfigs);
  
  managedKeys.forEach(key => {
    params.delete(key);
  });
  
  return params;
}