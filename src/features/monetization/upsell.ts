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
