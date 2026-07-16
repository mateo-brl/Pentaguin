import type { Entitlements, PurchasesProvider } from './provider';

const none: Entitlements = new Set();

/**
 * Fournisseur inerte : aucun entitlement, achat impossible. Utilisé en dev
 * (Expo Go, où react-native-purchases n'existe pas) et quand la monétisation
 * est coupée — dans ce cas c'est config.enabled=false qui débloque tout,
 * jamais le provider.
 */
export const noopProvider: PurchasesProvider = {
  async init() {},
  async getEntitlements() {
    return none;
  },
  async purchase() {
    throw new Error('Achats indisponibles dans cette build.');
  },
  async restore() {
    return none;
  },
  onChange() {
    return () => {};
  },
};
