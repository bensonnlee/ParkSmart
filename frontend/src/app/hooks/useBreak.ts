import { useState, useEffect } from 'react';
import { isOnBreak } from '@/api/academic';

/**
 * Returns whether the university is currently between terms.
 * Resolves once on mount; defaults to false while loading or on error.
 */
export function useBreak(): boolean {
  const [onBreak, setOnBreak] = useState(false);

  useEffect(() => {
    let stale = false;
    isOnBreak().then((v) => { if (!stale) setOnBreak(v); });
    return () => { stale = true; };
  }, []);

  return onBreak;
}
