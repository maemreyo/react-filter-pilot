import { useRouter } from 'next/router';
import { UrlHandler } from '../types';

/**
 * URL handler for Next.js Pages Router
 */
export function useNextJsPagesUrlHandler(): UrlHandler {
  const router = useRouter();

  return {
    getParams: () => {
      const params = new URLSearchParams();
      Object.entries(router.query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else if (value) {
          params.set(key, value);
        }
      });
      return params;
    },
    setParams: (params: URLSearchParams) => {
      const query: Record<string, string> = {};
      params.forEach((value, key) => {
        query[key] = value;
      });
      
      router.push(
        {
          pathname: router.pathname,
          query,
        },
        undefined,
        { shallow: true }
      );
    },
  };
}