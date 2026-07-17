import { useSyncExternalStore } from 'react';

import { getKv, setKv } from '@/db/repositories';

export type ThemeMode = 'system' | 'light' | 'dark';

const KEY = 'theme_mode';
let current: ThemeMode = 'system';
const listeners = new Set<() => void>();

/** À appeler une fois au démarrage (lecture du choix persistant). */
export function initThemeMode(): void {
  const stored = getKv(KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') current = stored;
}

export function getThemeMode(): ThemeMode {
  return current;
}

export function setThemeMode(mode: ThemeMode): void {
  current = mode;
  setKv(KEY, mode);
  listeners.forEach((notify) => notify());
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => current,
    () => current,
  );
}
