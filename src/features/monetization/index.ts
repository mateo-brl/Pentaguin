/**
 * Point d'entrée UNIQUE de la monétisation. Le reste de l'app n'importe que
 * depuis ce module (jamais les fichiers internes) et ne connaît que
 * isUnlocked()/les entitlements — voir AGENTS.md.
 */
import { monetizationConfig } from '@/config/monetization';

import { isUnlocked, type GatedItem } from './gates';
import type { Entitlements } from './provider';

export { activeProvider } from './active-provider';
export { freeQuestionIds, isUnlocked, packEntitlement, type GatedItem } from './gates';
export { noopProvider } from './noop.provider';
export type { EntitlementId, Entitlements, ProOffer, PurchasesProvider } from './provider';
export { canShowSpontaneousUpsell, getUpsellShownCount, markUpsellShown } from './upsell';
export { useEntitlements } from './use-entitlements';

/** isUnlocked() appliqué au curseur courant de l'app (raccourci pour les écrans). */
export function isUnlockedNow(item: GatedItem, entitlements: Entitlements): boolean {
  return isUnlocked(item, entitlements, monetizationConfig);
}
