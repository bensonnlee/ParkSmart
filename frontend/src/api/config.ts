export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://parksmart-api.onrender.com";

export const PREDICTIONS_PAUSED =
  import.meta.env.VITE_PAUSE_PREDICTIONS === "true";
