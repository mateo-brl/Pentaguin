import { useSyncExternalStore } from 'react';

import { getKv, setKv } from '@/db/repositories';
import { setLocale, type Locale } from '@/i18n/strings';

import { hasSeenOnboarding } from './first-run';

const KEY = 'locale_chosen';
const listeners = new Set<() => void>();

export function hasChosenLocale(): boolean {
  // Utilisateurs déjà installés (onboarding déjà vu) : on ne leur impose pas
  // rétroactivement ce nouvel écran — leur langue actuelle vaut choix.
  return getKv(KEY) === '1' || hasSeenOnboarding();
}

/** Applique la langue retenue au premier lancement et débloque la suite. */
export function chooseLocale(locale: Locale): void {
  setLocale(locale);
  setKv(KEY, '1');
  listeners.forEach((notify) => notify());
}

/** Réactif : la garde d'entrée passe du choix de langue à l'onboarding. */
export function useHasChosenLocale(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => hasChosenLocale(),
    () => hasChosenLocale(),
  );
}

/**
 * Langue de l'appareil, pour pré-sélectionner le bon choix. Utilise `Intl`
 * (présent dans Hermes) : aucune dépendance native ajoutée. Repli sur le
 * français, notre public prioritaire.
 */
export function deviceLocaleGuess(): Locale {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    return tag.toLowerCase().startsWith('en') ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}
