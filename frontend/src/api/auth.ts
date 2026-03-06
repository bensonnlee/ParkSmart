import { authenticatedFetch } from './authenticatedFetch';
import { clearSession } from './tokenStorage';
import { API_BASE } from './config';

export async function login(email: string, password: string) {
  const response = await fetch(
    `${API_BASE}/api/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!response.ok) {
    const errorDetail = await response.json();
    throw new Error(errorDetail.detail?.[0]?.msg || "Login failed");
  }

  return response.json();
}

export async function logout() {
  const response = await authenticatedFetch(
    `${API_BASE}/api/auth/logout`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  // Even if the server request fails, we should clear local data
  clearSession();

  if (!response.ok) {
    throw new Error("Logout failed on server");
  }

  return true;
}