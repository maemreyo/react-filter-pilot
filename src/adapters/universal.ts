import { UrlHandler } from '../types';

/**
 * Universal URL handler with custom getter and setter
 */
export function createUrlHandler(options: {
  getUrl: () => string;
  setUrl: (url: string) => void;
  baseUrl?: string;
}): UrlHandler {
  const { getUrl, setUrl, baseUrl = window.location.origin } = options;

  return {
    getParams: () => {
      const currentUrl = getUrl();
      const url = new URL(currentUrl, baseUrl);
      return url.searchParams;
    },
    setParams: (params: URLSearchParams) => {
      const currentUrl = getUrl();
      const url = new URL(currentUrl, baseUrl);
      
      // Clear existing search params
      url.search = '';
      
      // Set new params
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      
      setUrl(url.toString());
    },
  };
}

/**
 * Hash-based URL handler (for hash routing)
 */
export function useHashUrlHandler(): UrlHandler {
  return createUrlHandler({
    getUrl: () => window.location.hash.slice(1) || '/',
    setUrl: (url) => {
      const urlObj = new URL(url, window.location.origin);
      window.location.hash = urlObj.pathname + urlObj.search;
    },
  });
}

/**
 * Memory-based URL handler (for testing or React Native)
 */
export function createMemoryUrlHandler(initialUrl = '/'): UrlHandler {
  let currentUrl = initialUrl;

  return createUrlHandler({
    getUrl: () => currentUrl,
    setUrl: (url) => {
      currentUrl = url;
    },
  });
}