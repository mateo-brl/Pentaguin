import { getLocale, type Locale } from '@/i18n/strings';

import { rawPacksByLocale } from './packs';
import placementEnRaw from './placement/questions.en.json';
import placementRaw from './placement/questions.json';
import questionDomains from './questions-domains.json';
import type { ContentPack, Domain, Lesson, Question } from './schema';

const cache = new Map<Locale, ContentPack[]>();

/**
 * Identifiant du pack par défaut. IDENTIQUE dans toutes les langues, et stable au
 * niveau module : à utiliser pour la progression (clés de stockage) et dans les
 * dépendances de hooks, là où `getDefaultPack().id` casserait la mémoïsation.
 */
export const DEFAULT_PACK_ID = (rawPacksByLocale.fr[0] as { id: string }).id;

/**
 * La banque de positionnement (450 questions, bilingue) sert AUSSI de banque
 * jouable : quiz par thème, examens blancs, défi du jour, « mes erreurs ».
 * On ne duplique pas le JSON — on le relit avec sa carte id → domaine (10 Ko).
 * `difficulty` de positionnement (1-15) devient `level` ; `difficulty` du pack
 * (1-3) en est le tiers correspondant.
 */
const DOMAIN_BY_QUESTION = questionDomains as Record<string, string>;

function placementAsBankQuestions(locale: Locale): Question[] {
  const source = locale === 'en' && placementEnRaw.length > 0 ? placementEnRaw : placementRaw;
  const out: Question[] = [];
  for (const q of source as { id: string; difficulty: number; stem: string; choices: { id: string; text: string }[]; correct: string; explanation: string }[]) {
    const domainId = DOMAIN_BY_QUESTION[q.id];
    if (!domainId) continue; // question non classée : on ne l'expose pas
    out.push({
      id: q.id,
      domainId,
      type: 'single',
      stem: q.stem,
      choices: q.choices,
      correct: [q.correct],
      explanation: q.explanation,
      difficulty: q.difficulty <= 5 ? 1 : q.difficulty <= 10 ? 2 : 3,
      level: q.difficulty,
      tags: ['placement-v1'],
    });
  }
  return out;
}

export function getPacks(locale: Locale = getLocale()): ContentPack[] {
  const cached = cache.get(locale);
  if (cached) return cached;
  // Le contenu est validé au build (npm run validate:content, en CI). On évite
  // de re-parser ~360 Ko avec Zod sur le thread JS au tout premier rendu.
  const raw = rawPacksByLocale[locale] as ContentPack[];
  const extra = placementAsBankQuestions(locale);
  // Copie (jamais de mutation du JSON importé) : le pack par défaut reçoit la
  // banque élargie, les éventuels autres packs restent inchangés.
  const parsed = raw.map((pack, index) =>
    index === 0 ? { ...pack, questions: [...pack.questions, ...extra] } : pack,
  );
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
