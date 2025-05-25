import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { UrlHandler } from '../types';

/**
 * Custom URL handler for Next.js App Router
 * This version is designed to work without react-router-dom dependency
 */
export function useNextJsAppCustomUrlHandler(): UrlHandler {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  return {
    getParams: () => {
      // Convert Next.js searchParams to URLSearchParams
      const params = new URLSearchParams();
      // Use Array.from to iterate over entries
      Array.from(searchParams.entries()).forEach(([key, value]) => {
        params.set(key, value);
      });
      return params;
    },
    setParams: (params: URLSearchParams) => {
      const search = params.toString();
      const query = search ? `?${search}` : '';
      router.replace(`${pathname}${query}`);
    },
  };
}