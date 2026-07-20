/**
 * LE curseur gratuit/payant de Pentaguin. C'est le SEUL endroit où l'on décide
 * de ce qui est gratuit — ajustable et poussable en OTA sans toucher au reste
 * de l'app. Les écrans ne consultent jamais ce fichier directement : ils
 * passent par isUnlocked() (src/features/monetization/).
 *
 * Monétisation douce, règles non négociables :
 * - le gratuit doit rester réellement utilisable (jamais une démo frustrante) ;
 * - au plus UNE proposition d'achat spontanée, au bon moment ;
 * - pas de fausse urgence, pas de dark patterns.
 */
export type MonetizationConfig = {
  /** false = tout est débloqué (dev, Expo Go, ou pour tout offrir). */
  enabled: boolean;
  free: {
    /** Domaines entièrement gratuits (leçons + banque de questions complète). */
    domainIds: string[];
    /**
     * « Eau à la bouche » : nombre de leçons gratuites au début de CHAQUE autre
     * thème (les plus faciles, par niveau croissant) — un avant-goût de tout.
     * Optionnel (défaut 0).
     */
    lessonsPerDomain?: number;
    /** Part de la banque de questions accessible gratuitement dans les autres domaines (0 à 1). */
    questionRatioPerDomain: number;
    /** Nombre d'examens blancs gratuits (les premiers, dans l'ordre du pack). */
    mockExamCount: number;
  };
  upsell: {
    /** Nombre maximal de propositions d'achat spontanées, à vie. */
    maxSpontaneousPrompts: number;
  };
};

export const monetizationConfig: MonetizationConfig = {
  enabled: process.env.EXPO_PUBLIC_MONETIZATION !== 'off',
  free: {
    // Thèmes fondateurs entièrement gratuits + un avant-goût (2 leçons) de
    // chaque autre thème : l'utilisateur goûte à tout avant de passer Pro.
    domainIds: ['d-fond', 'd-net'],
    lessonsPerDomain: 2,
    questionRatioPerDomain: 0.4,
    mockExamCount: 1,
  },
  upsell: {
    maxSpontaneousPrompts: 1,
  },
};

/**
 * Config boutique. La clé SDK RevenueCat est **publique par conception** :
 * RevenueCat la destine au code client, elle est extractible de tout binaire
 * — ce n'est PAS un secret (contrairement aux clés API secrètes / .p8, qui
 * restent hors du repo). On la met donc en dur en repli, pour qu'elle soit
 * toujours présente (builds ET OTA) sans dépendre d'une variable d'env ;
 * EXPO_PUBLIC_REVENUECAT_IOS_KEY permet quand même de la surcharger.
 *
 * Les ids produit App Store Connect et les entitlements RevenueCat doivent
 * correspondre : entitlement `pro:<packId>` (voir packEntitlement()).
 */
export const purchasesConfig = {
  revenueCatIosKey:
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? 'appl_ZcJDQirsburfcDexXoeYuNNcQcO',
  iosProductByPack: {
    'secplus-sy0-701': 'pentaguin.pro.secplus',
  } as Record<string, string>,
};
