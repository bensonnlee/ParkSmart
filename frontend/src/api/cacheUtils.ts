const CACHE_PREFIX = "api_cache:";

function removeCacheKeys(filter?: (key: string) => boolean): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX) && (!filter || filter(key))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

/** Remove all cache entries whose URL contains the given substring. */
export function invalidateCache(urlSubstring: string): void {
  removeCacheKeys((key) => key.includes(urlSubstring));
}

/** Clear all API cache entries (call on logout). */
export function clearApiCache(): void {
  removeCacheKeys();
}
