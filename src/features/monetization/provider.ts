/** Un entitlement par pack de certification, ex. "pro:secplus-sy0-701". */
export type EntitlementId = string;
export type Entitlements = ReadonlySet<EntitlementId>;

/**
 * Abstraction du fournisseur d'achats. Deux implémentations prévues :
 * noopProvider (dev, Expo Go, monétisation coupée) et, au jalon M6,
 * un RevenueCatProvider (react-native-purchases).
 */
export interface PurchasesProvider {
  /** À appeler une fois au démarrage de l'app. */
  init(): Promise<void>;
  getEntitlements(): Promise<Entitlements>;
  purchase(productId: string): Promise<Entitlements>;
  restore(): Promise<Entitlements>;
  /** Notifie tout changement (achat, restore, révocation). Retourne un unsubscribe. */
  onChange(listener: (entitlements: Entitlements) => void): () => void;
}
