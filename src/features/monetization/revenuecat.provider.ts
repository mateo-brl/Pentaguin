import type { Entitlements, ProOffer, PurchasesProvider } from './provider';

// Types minimaux de react-native-purchases (chargé paresseusement : le module
// natif n'existe pas en Expo Go, il ne doit jamais être requis là-bas —
// active-provider.ts garantit que ce provider n'y est pas construit).
type CustomerInfo = { entitlements: { active: Record<string, unknown> } };
type StoreProduct = { identifier: string; priceString: string; price?: number };
type PurchasesModule = {
  configure(options: { apiKey: string }): void;
  getCustomerInfo(): Promise<CustomerInfo>;
  getProducts(ids: string[], category?: string): Promise<StoreProduct[]>;
  purchaseStoreProduct(product: StoreProduct): Promise<{ customerInfo: CustomerInfo }>;
  restorePurchases(): Promise<CustomerInfo>;
  addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void): void;
};

/**
 * Cherche le produit en tant qu'abonnement, puis sans filtre de catégorie : selon
 * la version du SDK, la catégorie par défaut varie — on ne veut pas d'un paywall
 * vide à cause de ça.
 */
async function findProduct(purchases: PurchasesModule, productId: string) {
  const [asSubscription] = await purchases.getProducts([productId], 'SUBSCRIPTION');
  if (asSubscription) return asSubscription;
  const [any] = await purchases.getProducts([productId]);
  return any ?? null;
}

function toEntitlements(info: CustomerInfo): Entitlements {
  return new Set(Object.keys(info.entitlements.active));
}

export function createRevenueCatProvider(apiKey: string): PurchasesProvider {
  let purchases: PurchasesModule | null = null;
  const listeners = new Set<(entitlements: Entitlements) => void>();
  const publish = (entitlements: Entitlements): Entitlements => {
    listeners.forEach((listener) => listener(entitlements));
    return entitlements;
  };

  return {
    async init() {
      // Chargement paresseux volontaire : un import statique évaluerait le module natif en Expo Go.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require('react-native-purchases') as { default: PurchasesModule };
      purchases = module.default;
      purchases.configure({ apiKey });
      purchases.addCustomerInfoUpdateListener((info) => {
        const entitlements = toEntitlements(info);
        listeners.forEach((listener) => listener(entitlements));
      });
    },

    async getEntitlements() {
      if (!purchases) return new Set();
      return toEntitlements(await purchases.getCustomerInfo());
    },

    async getProOffer(productId): Promise<ProOffer | null> {
      if (!purchases) return null;
      const product = await findProduct(purchases, productId);
      return product
        ? { productId: product.identifier, priceString: product.priceString, price: product.price }
        : null;
    },

    async purchase(productId) {
      if (!purchases) throw new Error('Boutique non initialisée.');
      const product = await findProduct(purchases, productId);
      if (!product) throw new Error(`Produit introuvable : ${productId}`);
      const { customerInfo } = await purchases.purchaseStoreProduct(product);
      // Le listener natif n'est pas garanti immédiat : on diffuse nous-mêmes,
      // sinon un onglet déjà monté garde son Set vide et le contenu payé reste
      // verrouillé.
      return publish(toEntitlements(customerInfo));
    },

    async restore() {
      if (!purchases) return new Set();
      return publish(toEntitlements(await purchases.restorePurchases()));
    },

    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
