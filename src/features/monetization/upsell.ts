import { monetizationConfig, type MonetizationConfig } from '@/config/monetization';
import { getKv, setKv } from '@/db/repositories';

import type { Entitlements } from './provider';

const SHOWN_COUNT_KEY = 'upsell_shown_count';

/**
 * Règle « monétisation douce » : au plus maxSpontaneousPrompts proposition(s)
 * spontanée(s) à vie, jamais à un utilisateur déjà Pro. Fonction pure.
 */
export function canShowSpontaneousUpsell(
  shownCount: number,
  entitlements: Entitlements,
  config: MonetizationConfig = monetizationConfig,
): boolean {
  if (!config.enabled) return false;
  if (entitlements.size > 0) return false;
  return shownCount < config.upsell.maxSpontaneousPrompts;
}

/**
 * Palier d'engagement minimal avant TOUTE proposition spontanée : l'utilisateur
 * doit d'abord avoir goûté au contenu gratuit. Garantit qu'on ne propose jamais
 * Pro « dès l'inscription » — seulement à un moment où l'offre a du sens.
 */
export const UPSELL_MIN_LESSONS = 3;

export function isCrucialUpsellMoment(completedLessons: number): boolean {
  return completedLessons >= UPSELL_MIN_LESSONS;
}

export function getUpsellShownCount(): number {
  return Number(getKv(SHOWN_COUNT_KEY) ?? '0');
}

export function markUpsellShown(): void {
  setKv(SHOWN_COUNT_KEY, String(getUpsellShownCount() + 1));
}

/**
 * L'utilisateur vient-il d'épuiser le contenu GRATUIT d'un thème ? (toutes les
 * leçons gratuites du thème terminées, alors qu'il reste des leçons Pro). C'est
 * un pic de satisfaction naturel : le bon moment pour proposer la suite, une
 * seule fois. Fonction pure. `domainLessons` = les leçons du thème concerné.
 */
export function isEndOfFreeTheme(
  domainLessons: readonly { id: string; unlocked: boolean }[],
  completedIds: ReadonlySet<string>,
): boolean {
  const hasLocked = domainLessons.some((l) => !l.unlocked);
  if (!hasLocked) return false; // rien de plus à débloquer dans ce thème
  const free = domainLessons.filter((l) => l.unlocked);
  return free.length > 0 && free.every((l) => completedIds.has(l.id));
}
