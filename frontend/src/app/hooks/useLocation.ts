import { useState, useEffect, useCallback } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  isDenied: boolean;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    isDenied: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation not supported", loading: false }));
      return;
    }

    setState(s => ({ ...s, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState(s => ({
          ...s,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        }));
      },
      (error) => {
        setState(s => ({ ...s, error: error.message, loading: false }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Track browser permission state and listen for changes
  useEffect(() => {
    let aborted = false;
    let permStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      if (aborted || !permStatus) return;
      setState(s => ({ ...s, isDenied: permStatus!.state === 'denied' }));
      if (permStatus.state === 'granted') {
        requestLocation();
      }
    };

    navigator.permissions?.query({ name: 'geolocation' }).then((status) => {
      if (aborted) return;
      permStatus = status;
      setState(s => ({ ...s, isDenied: status.state === 'denied' }));
      status.addEventListener('change', handlePermissionChange);
    });

    return () => {
      aborted = true;
      permStatus?.removeEventListener('change', handlePermissionChange);
    };
  }, [requestLocation]);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...state, requestLocation };
};
