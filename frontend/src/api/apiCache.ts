import { authenticatedFetch } from './authenticatedFetch';

// Re-export cache utilities so existing imports from '@/api/apiCache' still work
export { invalidateCache, clearApiCache } from './cacheUtils';

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
  options?: { ttl?: number; headers?: HeadersInit; authenticated?: boolean }
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

  const fetcher = options?.authenticated ? authenticatedFetch : fetch;
  const response = await fetcher(url, { headers: options?.headers });
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
