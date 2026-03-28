import { useState, useEffect } from 'react';
import { isOnBreak } from '@/api/academic';

/**
 * Returns whether the university is currently between terms.
 * Resolves once on mount; defaults to false while loading or on error.
 */
export function useBreak(): boolean {
  const [onBreak, setOnBreak] = useState(false);

  useEffect(() => {
    isOnBreak().then(setOnBreak);
  }, []);

  return onBreak;
}
