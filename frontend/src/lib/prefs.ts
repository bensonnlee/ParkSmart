export type PermitSlug = 'gold' | 'gold-plus' | 'blue';

export interface Prefs {
  parkingPass: PermitSlug;
  arrivalBuffer: number;
  walkingSpeed: number;
  preferredPermitId: string | null;
}

export const DEFAULT_PREFS: Prefs = {
  parkingPass: 'gold',
  arrivalBuffer: 10,
  walkingSpeed: 2,
  preferredPermitId: null,
};

/**
 * Load user preferences from localStorage / DB-backed user object.
 * Priority: DB-backed fields > localStorage prefs > defaults.
 */
export function loadPrefs(key?: string, user?: Record<string, unknown> | null): Prefs {
  // Derive key from localStorage user if not provided
  if (!key) {
    const storedUser = localStorage.getItem("user");
    user = user ?? (storedUser ? JSON.parse(storedUser) : null);
    const uid = (user as any)?.id || (user as any)?.user_id || (user as any)?.supabase_id;
    key = uid ? `prefs:${uid}` : "prefs:guest";
  }

  let localPrefs: Partial<Prefs> = {};
  const raw = localStorage.getItem(key);
  if (raw) {
    try { localPrefs = JSON.parse(raw); } catch { /* ignore */ }
  }

  // DB-backed values from user object (stored after successful API save)
  const dbParkingPass = user && typeof (user as any).parking_pass_slug === 'string'
    ? (user as any).parking_pass_slug as PermitSlug : undefined;
  const dbArrivalBuffer = user && typeof (user as any).arrival_buffer === 'number'
    ? (user as any).arrival_buffer as number : undefined;
  const dbWalkingSpeed = user && typeof (user as any).walking_speed === 'number'
    ? (user as any).walking_speed as number : undefined;

  const dbPreferredPermitId = user && typeof (user as any).preferred_permit_id === 'string'
    ? (user as any).preferred_permit_id as string : null;

  return {
    parkingPass: dbParkingPass ?? (localPrefs.parkingPass as PermitSlug | undefined) ?? DEFAULT_PREFS.parkingPass,
    arrivalBuffer: dbArrivalBuffer ?? (typeof localPrefs.arrivalBuffer === 'number' ? localPrefs.arrivalBuffer : DEFAULT_PREFS.arrivalBuffer),
    walkingSpeed: dbWalkingSpeed ?? (typeof localPrefs.walkingSpeed === 'number' ? localPrefs.walkingSpeed : DEFAULT_PREFS.walkingSpeed),
    preferredPermitId: dbPreferredPermitId,
  };
}
