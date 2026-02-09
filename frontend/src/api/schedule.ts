const API_BASE_URL = 'https://parksmart-api.onrender.com';

export const uploadSchedule = async (file: File, token: string) => {
  const formData = new FormData();
  // Ensure 'file' matches the name expected in your Swagger docs
  formData.append('file', file); 

  const response = await fetch(`${API_BASE_URL}/api/v1/schedules`, {
    method: 'POST',
    body: formData,
    headers: {
      // Include your token if the API requires authentication
      'Authorization': `Bearer ${token}`,
      // Note: Do NOT set Content-Type header; fetch sets it automatically for FormData
    },
  });

  if (!response.ok) {
    throw new Error('Failed to upload schedule');
  }

  return response.json();
};