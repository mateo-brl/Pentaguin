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

export function getUpsellShownCount(): number {
  return Number(getKv(SHOWN_COUNT_KEY) ?? '0');
}

export function markUpsellShown(): void {
  setKv(SHOWN_COUNT_KEY, String(getUpsellShownCount() + 1));
}
