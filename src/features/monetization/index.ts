/**
 * Point d'entrée UNIQUE de la monétisation. Le reste de l'app n'importe que
 * depuis ce module (jamais les fichiers internes) et ne connaît que
 * isUnlocked()/les entitlements — voir AGENTS.md.
 */
import { noopProvider } from './noop.provider';
import type { PurchasesProvider } from './provider';

export { freeQuestionIds, isUnlocked, packEntitlement, type GatedItem } from './gates';
export { noopProvider } from './noop.provider';
export type { EntitlementId, Entitlements, PurchasesProvider } from './provider';

// TODO(M6) : remplacer par le RevenueCatProvider dans les builds natives.
export const activeProvider: PurchasesProvider = noopProvider;
