import { FetchControlConfig } from '../types';
import { useCallback, useMemo, useRef, useEffect } from 'react';

// Hook for fetch control
export function useFetchControl<TFilters>(
  filters: TFilters,
  config?: FetchControlConfig<TFilters>
) {
  // Refs for debouncing
  const debouncedFilters = useRef<TFilters>(filters);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Update debounced filters with debounce
  // @ts-ignore
  useEffect(() => {
    if (config?.debounceMs) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        debouncedFilters.current = filters;
      }, config.debounceMs);

      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    } else {
      debouncedFilters.current = filters;
    }
  }, [filters, config?.debounceMs]);

  // Check if fetch should be enabled
  const shouldFetch = useMemo(() => {
    const filtersToCheck = config?.debounceMs ? debouncedFilters.current : filters;
    if (!config) return { enabled: true, reason: '' };

    // Basic enabled check
    if (config.enabled !== undefined) {
      const enabled =
        typeof config.enabled === 'function' ? config.enabled(filtersToCheck) : config.enabled;

      if (!enabled) {
        return { enabled: false, reason: 'Fetch is disabled' };
      }
    }

    // Check required filters
    if (config.requiredFilters) {
      for (const filterKey of config.requiredFilters) {
        const value = filtersToCheck[filterKey];
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return {
            enabled: false,
            reason: `Required filter "${String(filterKey)}" is missing`,
          };
        }
      }
    }

    // Check conditional requirements
    if (config.conditionalRequirements) {
      for (const condition of config.conditionalRequirements) {
        if (condition.when(filters)) {
          for (const requiredKey of condition.require) {
            const value = filters[requiredKey];
            if (
              value === undefined ||
              value === null ||
              value === '' ||
              (Array.isArray(value) && value.length === 0)
            ) {
              return {
                enabled: false,
                reason:
                  condition.message ||
                  `Conditional requirement not met: "${String(requiredKey)}" is required`,
              };
            }
          }
        }
      }
    }

    // Check minimum values
    if (config.minimumValues) {
      for (const [key, minValue] of Object.entries(config.minimumValues)) {
        const value = filters[key as keyof TFilters];
        if (typeof value === 'string' && value.length < (minValue as number)) {
          return {
            enabled: false,
            reason: `"${key}" must be at least ${minValue} characters`,
          };
        }
        if (typeof value === 'number' && value < (minValue as number)) {
          return {
            enabled: false,
            reason: `"${key}" must be at least ${minValue}`,
          };
        }
      }
    }

    // Custom validation
    if (config.validate) {
      const validation = config.validate(filters);
      if (!validation.valid) {
        return {
          enabled: false,
          reason: validation.message || 'Validation failed',
        };
      }
    }

    return { enabled: true, reason: '' };
  }, [filters, config]);

  // Wrap fetch function with control logic
  const controlledFetch = useCallback(
    async (fetchFn: () => Promise<any>) => {
      if (!shouldFetch.enabled) {
        config?.onFetchSkipped?.(shouldFetch.reason, filters);
        throw new Error(shouldFetch.reason);
      }

      config?.onFetchStart?.(filters);

      try {
        const result = await fetchFn();
        config?.onFetchEnd?.(result);
        return result;
      } catch (error) {
        config?.onFetchError?.(error as Error, filters);
        throw error;
      }
    },
    [shouldFetch, filters, config]
  );

  return {
    shouldFetch: shouldFetch.enabled,
    fetchReason: shouldFetch.reason,
    controlledFetch,
  };
}

// // Example: Integration with useFilterPilot
// export function useFilterPilotWithControl<TData, TFilters = Record<string, any>>(
//   options: UseFilterPilotOptionsExtended<TData, TFilters>
// ) {
//   const baseResult = useFilterPilot(options);

//   const { shouldFetch, fetchReason, controlledFetch } = useFetchControl(
//     baseResult.filters,
//     options.fetchControl
//   );

//   // Override the fetch config
//   const enhancedOptions = {
//     ...options,
//     fetchConfig: {
//       ...options.fetchConfig,
//       enabled: shouldFetch && options.fetchConfig.enabled !== false,
//       fetchFn: async (params: any) => {
//         return controlledFetch(() => options.fetchConfig.fetchFn(params));
//       },
//     },
//   };

//   // Return enhanced result
//   return {
//     ...baseResult,
//     fetchControl: {
//       isEnabled: shouldFetch,
//       reason: fetchReason,
//       retry: () => baseResult.refetch(),
//     },
//   };
// }

// Helper hooks for common patterns
export function useRequiredFilters<TFilters>(filters: TFilters, required: (keyof TFilters)[]) {
  return useMemo(() => {
    const missing: string[] = [];

    for (const key of required) {
      const value = filters[key];
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        missing.push(String(key));
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
      message: missing.length > 0 ? `Missing required filters: ${missing.join(', ')}` : '',
    };
  }, [filters, required]);
}

// Hook for dependent filters
export function useDependentFilters<TFilters>(
  filters: TFilters,
  dependencies: Array<{
    if: keyof TFilters;
    equals?: any;
    then: keyof TFilters | (keyof TFilters)[];
  }>
) {
  return useMemo(() => {
    const errors: string[] = [];

    for (const dep of dependencies) {
      const ifValue = filters[dep.if];
      const shouldCheck = dep.equals !== undefined ? ifValue === dep.equals : Boolean(ifValue);

      if (shouldCheck) {
        const requiredKeys = Array.isArray(dep.then) ? dep.then : [dep.then];

        for (const key of requiredKeys) {
          const value = filters[key];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            errors.push(
              `When "${String(dep.if)}" is set${
                dep.equals !== undefined ? ` to "${dep.equals}"` : ''
              }, "${String(key)}" is required`
            );
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [filters, dependencies]);
}

// Hook for filter combinations
export function useFilterCombinations<TFilters>(
  filters: TFilters,
  rules: Array<{
    filters: (keyof TFilters)[];
    condition: 'all' | 'any' | 'none';
    message?: string;
  }>
) {
  return useMemo(() => {
    const errors: string[] = [];

    for (const rule of rules) {
      const activeFilters = rule.filters.filter((key) => {
        const value = filters[key];
        return (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        );
      });

      let isValid = false;

      switch (rule.condition) {
        case 'all':
          isValid = activeFilters.length === rule.filters.length;
          if (!isValid) {
            errors.push(
              rule.message || `All of these filters must be set: ${rule.filters.join(', ')}`
            );
          }
          break;

        case 'any':
          isValid = activeFilters.length > 0;
          if (!isValid) {
            errors.push(
              rule.message ||
                `At least one of these filters must be set: ${rule.filters.join(', ')}`
            );
          }
          break;

        case 'none':
          isValid = activeFilters.length === 0;
          if (!isValid) {
            errors.push(
              rule.message ||
                `None of these filters should be set together: ${rule.filters.join(', ')}`
            );
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [filters, rules]);
}
