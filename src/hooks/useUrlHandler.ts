import { useState, useEffect } from 'react';
import { UrlHandler } from '../types';

/**
 * Default URL handler using browser's history API
 */
export function useDefaultUrlHandler(): UrlHandler {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    () => new URLSearchParams(window.location.search)
  );

  useEffect(() => {
    const handlePopState = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    getParams: () => searchParams,
    setParams: (params: URLSearchParams) => {
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
      setSearchParams(params);
    },
  };
}