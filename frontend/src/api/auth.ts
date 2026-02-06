// frontend/src/api/auth.ts
export async function login(email: string, password: string) {
  const response = await fetch(
    "https://parksmart-api.onrender.com/api/auth/login",
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
    const token = localStorage.getItem("token");
  
    const response = await fetch(
      "https://parksmart-api.onrender.com/api/auth/logout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Most secure APIs require the token to know WHO is logging out
          "Authorization": `Bearer ${token}` 
        },
      }
    );
  
    // Even if the server request fails, we should clear local data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  
    if (!response.ok) {
      throw new Error("Logout failed on server");
    }
  
    return true;
  }