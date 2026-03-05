const CACHE_PREFIX = "api_cache:";
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

/**
 * Fetch with localStorage caching. Use for static/rarely-changing GET endpoints only.
 */
export async function cachedFetch(
  url: string,
  options?: { ttl?: number; headers?: HeadersInit }
): Promise<any> {
  const ttl = options?.ttl ?? DEFAULT_TTL;
  const key = CACHE_PREFIX + url;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.timestamp < ttl) {
        return entry.data;
      }
    }
  } catch {
    // Corrupted cache entry — fall through to network
  }

  const response = await fetch(url, { headers: options?.headers });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }

  const data = await response.json();

  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage full — silently continue without caching
  }

  return data;
}

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
