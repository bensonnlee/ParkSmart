import { useState, useEffect, useCallback } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation not supported", loading: false }));
      return;
    }

    setState(s => ({ ...s, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState(s => ({ ...s, error: error.message, loading: false }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...state, requestLocation };
};
