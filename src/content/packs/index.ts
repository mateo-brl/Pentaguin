import type { Locale } from '@/i18n/strings';

import secplusSy0701, { packEn, packFr } from './secplus-sy0-701';

/** Packs de contenu embarqués dans l'app. Chaque nouveau pack doit être ajouté ici. */
export const rawPacks: unknown[] = [secplusSy0701];

/** Mêmes packs, déclinés par langue (mêmes identifiants de contenu). */
export const rawPacksByLocale: Record<Locale, unknown[]> = {
  fr: [packFr],
  en: [packEn],
};
