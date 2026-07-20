/**
 * Point d'entrée UNIQUE de la monétisation. Le reste de l'app n'importe que
 * depuis ce module (jamais les fichiers internes) et ne connaît que
 * isUnlocked()/les entitlements — voir AGENTS.md.
 */
import { monetizationConfig } from '@/config/monetization';
import { getDefaultPack, type Lesson } from '@/content';

import { freeLessonIds, isUnlocked, packEntitlement, type GatedItem } from './gates';
import type { Entitlements } from './provider';

export { activeProvider } from './active-provider';
export { freeLessonIds, freeQuestionIds, isUnlocked, packEntitlement, type GatedItem } from './gates';
export { noopProvider } from './noop.provider';
export type { EntitlementId, Entitlements, ProOffer, PurchasesProvider } from './provider';
export {
  canShowSpontaneousUpsell,
  getUpsellShownCount,
  isCrucialUpsellMoment,
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
