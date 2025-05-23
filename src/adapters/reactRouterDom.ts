import { useSearchParams } from 'react-router-dom';
import { UrlHandler } from '../types';

/**
 * URL handler for React Router DOM v6+
 */
export function useReactRouterDomUrlHandler(): UrlHandler {
  const [searchParams, setSearchParams] = useSearchParams();

  return {
    getParams: () => searchParams,
    setParams: (params: URLSearchParams) => {
      setSearchParams(params, { replace: true });
    },
  };
}