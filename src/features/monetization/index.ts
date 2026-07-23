/**
 * Point d'entrée UNIQUE de la monétisation. Le reste de l'app n'importe que
 * depuis ce module (jamais les fichiers internes) et ne connaît que
 * isUnlocked()/les entitlements — voir AGENTS.md.
 */
import { monetizationConfig } from '@/config/monetization';
import { getDefaultPack, type Lesson } from '@/content';

import { freeLessonIds, isUnlocked, packEntitlement, type GatedItem } from './gates';
import type { Entitlements } from './provider';
import { isEndOfFreeTheme } from './upsell';

export { activeProvider } from './active-provider';
export { freeLessonIds, freeQuestionIds, isUnlocked, packEntitlement, type GatedItem } from './gates';
export { noopProvider } from './noop.provider';
export type { EntitlementId, Entitlements, ProOffer, PurchasesProvider } from './provider';
export {
  canShowSpontaneousUpsell,
  getUpsellShownCount,
  isCrucialUpsellMoment,
  isEndOfFreeTheme,
  markUpsellShown,
} from './upsell';
export { useEntitlements } from './use-entitlements';

/** isUnlocked() appliqué au curseur courant de l'app (raccourci pour les écrans). */
export function isUnlockedNow(item: GatedItem, entitlements: Entitlements): boolean {
  return isUnlocked(item, entitlements, monetizationConfig);
}

// Ensemble des leçons gratuites, mémoïsé (le pack ne change pas en session).
let freeLessonCache: Set<string> | null = null;
function freeLessons(): Set<string> {
  if (!freeLessonCache) freeLessonCache = freeLessonIds(getDefaultPack().lessons, monetizationConfig);
  return freeLessonCache;
}

/**
 * Une leçon est-elle accessible ? Débloquée si la monétisation est coupée, si le
 * pack est acheté, ou si la leçon fait partie du gratuit (« eau à la bouche »).
 * Les écrans passent par ici — ils ne raisonnent jamais sur la politique.
 */
export function isLessonUnlockedNow(lesson: Lesson, entitlements: Entitlements): boolean {
  if (!monetizationConfig.enabled) return true;
  if (entitlements.has(packEntitlement(getDefaultPack().id))) return true;
  return freeLessons().has(lesson.id);
}

/** Vrai si l'utilisateur (non Pro) a Pro entièrement débloqué ou monétisation coupée. */
function isFullyUnlocked(entitlements: Entitlements): boolean {
  return !monetizationConfig.enabled || entitlements.has(packEntitlement(getDefaultPack().id));
}

/**
 * Ce qui reste verrouillé, pour un pitch de paywall CONCRET (jamais culpabilisant :
 * on parle de ce qui attend, pas de ce qui manque). Renvoie 0/0 si tout est débloqué.
 */
export function lockedContentSummary(entitlements: Entitlements): {
  lockedThemes: number;
  lockedLessons: number;
} {
  if (isFullyUnlocked(entitlements)) return { lockedThemes: 0, lockedLessons: 0 };
  const pack = getDefaultPack();
  const free = freeLessons();
  const freeDomains = new Set(monetizationConfig.free.domainIds);
  return {
    lockedThemes: pack.domains.filter((d) => !freeDomains.has(d.id)).length,
    lockedLessons: pack.lessons.filter((l) => !free.has(l.id)).length,
  };
}

/**
 * L'utilisateur vient de terminer `justCompleted` : a-t-il épuisé le gratuit de
 * ce thème (moment idéal pour LA proposition spontanée) ? `completedIds` doit
 * inclure la leçon qu'on vient de terminer.
 */
export function isEndOfFreeThemeMoment(
  justCompleted: Lesson,
  completedIds: ReadonlySet<string>,
  entitlements: Entitlements,
): boolean {
  if (isFullyUnlocked(entitlements)) return false;
  const domainLessons = getDefaultPack()
    .lessons.filter((l) => l.domainId === justCompleted.domainId)
    .map((l) => ({ id: l.id, unlocked: isLessonUnlockedNow(l, entitlements) }));
  return isEndOfFreeTheme(domainLessons, completedIds);
}
