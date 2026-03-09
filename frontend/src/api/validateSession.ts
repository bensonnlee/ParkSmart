import { getAccessToken, getRefreshToken, clearSession } from './tokenStorage';
import { refreshWithMutex } from './authenticatedFetch';

/**
 * Check whether the user has a valid session by verifying stored tokens.
 * Attempts a mutex-protected refresh to confirm validity and store fresh tokens.
 */
export async function validateSession(): Promise<boolean> {
  if (!getAccessToken() || !getRefreshToken()) {
    return false;
  }

  try {
    await refreshWithMutex();
    return true;
  } catch {
    clearSession();
    return false;
  }
}
