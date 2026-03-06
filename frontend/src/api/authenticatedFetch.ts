import { getAccessToken, getRefreshToken, setTokens, clearSession } from './tokenStorage';
import { API_BASE } from './config';

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");

  const data = await res.json();
  const newAccess = data.access_token ?? data.token;
  const newRefresh = data.refresh_token ?? refreshToken;
  if (!newAccess) throw new Error("No access token in refresh response");

  setTokens(newAccess, newRefresh);
  return newAccess;
}

/**
 * Drop-in replacement for fetch() that auto-attaches the Bearer token,
 * intercepts 401s, refreshes via the backend, and retries once.
 *
 * Uses a mutex so concurrent 401s only trigger a single refresh call.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    try {
      // Free the connection from the 401 response
      await response.body?.cancel();

      // Mutex: only the first caller triggers the refresh
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;

      // Retry original request with new token
      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(input, { ...init, headers: retryHeaders });
    } catch {
      clearSession();
      window.location.href = "/welcome";
      return response;
    }
  }

  return response;
}
