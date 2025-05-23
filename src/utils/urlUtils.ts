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