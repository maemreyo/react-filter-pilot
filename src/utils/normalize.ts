export function normalizeQueryKey(
  queryKey?: string | (string | number | boolean | object)[]
): unknown[] {
  if (!queryKey) return ['filterPilot'];
  if (typeof queryKey === 'string') return [queryKey];
  return queryKey;
}
