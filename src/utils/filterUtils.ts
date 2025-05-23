import { FilterConfig } from '../types';

/**
 * Check if a filter is active (not default value)
 */
export function isFilterActive(
  value: any,
  defaultValue: any
): boolean {
  if (value === defaultValue) return false;
  
  // Handle arrays
  if (Array.isArray(value)) {
    if (!Array.isArray(defaultValue)) return value.length > 0;
    return JSON.stringify(value) !== JSON.stringify(defaultValue);
  }
  
  // Handle objects
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value) !== JSON.stringify(defaultValue);
  }
  
  // Handle empty strings
  if (typeof value === 'string' && value.trim() === '') {
    return defaultValue !== '';
  }
  
  return true;
}

/**
 * Get default filter values from configs
 */
export function getDefaultFilters(
  filterConfigs: FilterConfig[]
): Record<string, any> {
  const defaults: Record<string, any> = {};
  
  filterConfigs.forEach((config) => {
    defaults[config.name] = config.defaultValue;
  });
  
  return defaults;
}

/**
 * Compare two filter objects
 */
export function compareFilters(
  filters1: Record<string, any>,
  filters2: Record<string, any>
): boolean {
  const keys1 = Object.keys(filters1);
  const keys2 = Object.keys(filters2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every((key) => {
    const val1 = filters1[key];
    const val2 = filters2[key];
    
    if (val1 === val2) return true;
    
    // Deep comparison for objects and arrays
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      return JSON.stringify(val1) === JSON.stringify(val2);
    }
    
    return false;
  });
}

/**
 * Merge filters with defaults
 */
export function mergeFilters(
  filters: Partial<Record<string, any>>,
  defaults: Record<string, any>
): Record<string, any> {
  return { ...defaults, ...filters };
}