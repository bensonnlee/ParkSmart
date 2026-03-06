import { clearApiCache } from './cacheUtils';

const ACCESS_KEY = "token"; // keep existing key for compat
const REFRESH_KEY = "refresh_token";

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** Clear all auth-related local state (tokens, user, API cache). */
export function clearSession() {
  clearTokens();
  localStorage.removeItem("user");
  clearApiCache();
}
