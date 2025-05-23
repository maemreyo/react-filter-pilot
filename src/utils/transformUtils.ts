/**
 * Transform a filter value using the provided transformer function
 */
export function transformFilterValue(
  value: any,
  transformer?: (value: any) => any
): any {
  if (!transformer) return value;
  
  try {
    return transformer(value);
  } catch (error) {
    console.error('Error transforming filter value:', error);
    return value;
  }
}