import { cachedFetch } from './apiCache';
import { API_BASE } from './config';

const ONE_HOUR = 60 * 60 * 1000;

interface CurrentTermResponse {
  current_term: { id: string; name: string } | null;
}

/**
 * Returns true when the university is between terms (no active term).
 * Silently returns false on network errors so callers don't need error handling.
 */
export async function isOnBreak(): Promise<boolean> {
  try {
    const res: CurrentTermResponse = await cachedFetch(
      `${API_BASE}/api/academic/terms/current`,
      { ttl: ONE_HOUR },
    );
    return res.current_term === null;
  } catch {
    return false;
  }
}
