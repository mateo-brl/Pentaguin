import { getLocale, type Locale } from '@/i18n/strings';

import { rawPacksByLocale } from './packs';
import {
  contentPackSchema,
  type ContentPack,
  type Domain,
  type Lesson,
  type Question,
} from './schema';

const cache = new Map<Locale, ContentPack[]>();

/**
 * Identifiant du pack par défaut. IDENTIQUE dans toutes les langues, et stable au
 * niveau module : à utiliser pour la progression (clés de stockage) et dans les
 * dépendances de hooks, là où `getDefaultPack().id` casserait la mémoïsation.
 */
export const DEFAULT_PACK_ID = (rawPacksByLocale.fr[0] as { id: string }).id;

/**
 * Parse et met en cache les packs de la langue demandée (validation Zod au
 * premier accès). Les identifiants sont communs à toutes les langues.
 */
export function getPacks(locale: Locale = getLocale()): ContentPack[] {
  const cached = cache.get(locale);
  if (cached) return cached;
  const parsed = rawPacksByLocale[locale].map((raw) => contentPackSchema.parse(raw));
  cache.set(locale, parsed);
  return parsed;
}

/**
 * Pack courant, dans la langue active. À appeler DANS le composant (et non au
 * niveau module) pour que l'écran suive un changement de langue.
 */
export function getDefaultPack(locale: Locale = getLocale()): ContentPack {
  return getPacks(locale)[0];
}

export function getDomain(pack: ContentPack, domainId: string): Domain | undefined {
  return pack.domains.find((d) => d.id === domainId);
}

export function lessonsByDomain(pack: ContentPack, domainId: string): Lesson[] {
  return pack.lessons
    .filter((l) => l.domainId === domainId)
    .sort((a, b) => a.order - b.order);
}

export function questionsByDomain(pack: ContentPack, domainId: string): Question[] {
  return pack.questions.filter((q) => q.domainId === domainId);
}

export type { ContentPack, Domain, Lesson, LessonBlock, MockExam, Question } from './schema';
