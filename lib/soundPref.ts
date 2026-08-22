export const SOUND_COOKIE = 'workit_sound';
export const SOUND_STORAGE_KEY = 'workit_sound';

export function normalizeSoundOn(value: unknown): boolean {
  if (value === false || value === 0 || value === '0' || value === 'off' || value === 'false') {
    return false;
  }
  return true;
}

export function readStoredSoundOn(): boolean | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
  if (stored == null) return null;
  return normalizeSoundOn(stored);
}

export function storeSoundOn(enabled: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? '1' : '0');
}
