import { FilterConfig } from '../types';

/**
 * Check if a filter is active (not default value)
 */
export function isFilterActive(value: any, defaultValue: any): boolean {
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
export function getDefaultFilters(filterConfigs: FilterConfig[]): Record<string, any> {
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
  console.log('[Debug compareFilters] Comparing filters:', filters1, 'AND', filters2);

  const keys1 = Object.keys(filters1);
  const keys2 = Object.keys(filters2);
  console.log('[Debug compareFilters] Keys from filters1:', keys1);
  console.log('[Debug compareFilters] Keys from filters2:', keys2);

  if (keys1.length !== keys2.length) {
    console.log(
      '[Debug compareFilters] Length of keys is different. keys1.length:',
      keys1.length,
      'keys2.length:',
      keys2.length,
      '. Returning false.'
    );
    return false;
  }

  const result = keys1.every((key) => {
    const val1 = filters1[key];
    const val2 = filters2[key];
    console.log(`[Debug compareFilters] Comparing key: "${key}". val1:`, val1, `val2:`, val2);

    if (val1 === val2) {
      console.log(`[Debug compareFilters] Key "${key}": Simple equality (val1 === val2) is true.`);
      return true;
    }

    // Deep comparison for objects and arrays
    if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
      const stringifiedVal1 = JSON.stringify(val1);
      const stringifiedVal2 = JSON.stringify(val2);
      console.log(
        `[Debug compareFilters] Key "${key}": Performing deep comparison. stringifiedVal1:`,
        stringifiedVal1,
        `stringifiedVal2:`,
        stringifiedVal2
      );
      if (stringifiedVal1 === stringifiedVal2) {
        console.log(
          `[Debug compareFilters] Key "${key}": Deep comparison (JSON.stringify) is true.`
        );
        return true;
      } else {
        console.log(
          `[Debug compareFilters] Key "${key}": Deep comparison (JSON.stringify) is false.`
        );
        return false;
      }
    }

    console.log(
      `[Debug compareFilters] Key "${key}": No equality condition met. Returning false for this key.`
    );
    return false;
  });

  console.log('[Debug compareFilters] Overall comparison result (every key matched):', result);
  return result;
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
