import { useSyncExternalStore } from 'react';

import { getKv, setKv } from '@/db/repositories';

const KEY = 'onboarding_seen';
const listeners = new Set<() => void>();

export function hasSeenOnboarding(): boolean {
  return getKv(KEY) === '1';
}

export function completeOnboarding(): void {
  setKv(KEY, '1');
  listeners.forEach((notify) => notify());
}

/** Réactif : la garde d'entrée bascule de l'onboarding vers la connexion. */
export function useHasSeenOnboarding(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => hasSeenOnboarding(),
    () => hasSeenOnboarding(),
  );
}
