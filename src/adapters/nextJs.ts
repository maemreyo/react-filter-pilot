import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { UrlHandler } from '../types';

/**
 * URL handler for Next.js App Router
 */
export function useNextJsUrlHandler(): UrlHandler {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  return {
    getParams: () => searchParams as unknown as URLSearchParams,
    setParams: (params: URLSearchParams) => {
      const search = params.toString();
      const query = search ? `?${search}` : '';
      router.replace(`${pathname}${query}`);
    },
  };
}