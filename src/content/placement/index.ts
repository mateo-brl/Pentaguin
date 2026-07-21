import { getLocale, type Locale } from '@/i18n/strings';

import rawEn from './questions.en.json';
import raw from './questions.json';
import { placementBankSchema, type PlacementQuestion } from './schema';

const cache = new Map<Locale, PlacementQuestion[]>();

/**
 * Banque de positionnement de la langue active, parsée + validée au premier
 * accès. Les identifiants sont communs aux deux langues (un test entamé reste
 * valable si la langue change). Repli sur le français tant que la traduction est
 * absente.
 */
export function getPlacementQuestions(locale: Locale = getLocale()): PlacementQuestion[] {
  const cached = cache.get(locale);
  if (cached) return cached;
  const source = locale === 'en' && rawEn.length > 0 ? rawEn : raw;
  const parsed = placementBankSchema.parse(source);
  cache.set(locale, parsed);
  return parsed;
}

export type { PlacementQuestion } from './schema';
