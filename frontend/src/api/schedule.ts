import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE } from './config';

export const uploadSchedule = async (file: File, token: string) => {
  const formData = new FormData();
  // Ensure 'file' matches the name expected in your Swagger docs
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/v1/schedules`, {
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

export interface ManualEventData {
  event_name: string;
  building_id?: string | null;
  room_number?: string | null;
  start_time: string; // HH:MM:SS
  end_time: string;
  days_of_week: number[];
  valid_from?: string | null;
  valid_until?: string | null;
}

export async function addScheduleEvent(data: ManualEventData) {
  const res = await authenticatedFetch(`${API_BASE}/api/schedules/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to add event' }));
    throw new Error(err.detail || 'Failed to add event');
  }
  return res.json();
}

export async function updateScheduleEvent(eventId: string, data: Partial<ManualEventData>) {
  const res = await authenticatedFetch(`${API_BASE}/api/schedules/events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update event' }));
    throw new Error(err.detail || 'Failed to update event');
  }
  return res.json();
}

export async function deleteScheduleEvent(eventId: string) {
  const res = await authenticatedFetch(`${API_BASE}/api/schedules/events/${eventId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete event' }));
    throw new Error(err.detail || 'Failed to delete event');
  }
}