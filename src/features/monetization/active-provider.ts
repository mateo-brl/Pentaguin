import { noopProvider } from './noop.provider';
import type { PurchasesProvider } from './provider';

// TODO(M6) : remplacer par le RevenueCatProvider dans les builds natives.
export const activeProvider: PurchasesProvider = noopProvider;
