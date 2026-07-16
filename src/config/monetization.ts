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
    domainIds: ['d1', 'd2'],
    questionRatioPerDomain: 0.4,
    mockExamCount: 1,
  },
  upsell: {
    maxSpontaneousPrompts: 1,
  },
};
