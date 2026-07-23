import { describe, expect, it } from '@jest/globals';

import type { MonetizationConfig } from '@/config/monetization';

import {
  canShowSpontaneousUpsell,
  isCrucialUpsellMoment,
  isEndOfFreeTheme,
  UPSELL_MIN_LESSONS,
} from '../upsell';

const config: MonetizationConfig = {
  enabled: true,
  free: { domainIds: [], questionRatioPerDomain: 0.4, mockExamCount: 1 },
  upsell: { maxSpontaneousPrompts: 1 },
};

const none = new Set<string>();

describe('canShowSpontaneousUpsell', () => {
  it('autorise la toute première proposition', () => {
    expect(canShowSpontaneousUpsell(0, none, config)).toBe(true);
  });

  it('refuse au-delà du plafond (1 seule à vie)', () => {
    expect(canShowSpontaneousUpsell(1, none, config)).toBe(false);
    expect(canShowSpontaneousUpsell(5, none, config)).toBe(false);
  });

  it('jamais à un utilisateur déjà Pro', () => {
    expect(canShowSpontaneousUpsell(0, new Set(['pro:secplus-sy0-701']), config)).toBe(false);
  });

  it('jamais quand la monétisation est coupée', () => {
    expect(canShowSpontaneousUpsell(0, none, { ...config, enabled: false })).toBe(false);
  });
});

describe('isCrucialUpsellMoment', () => {
  it('refuse tant que le contenu gratuit n’a pas été goûté', () => {
    expect(isCrucialUpsellMoment(0)).toBe(false);
    expect(isCrucialUpsellMoment(UPSELL_MIN_LESSONS - 1)).toBe(false);
  });

  it('autorise une fois le palier d’engagement atteint', () => {
    expect(isCrucialUpsellMoment(UPSELL_MIN_LESSONS)).toBe(true);
    expect(isCrucialUpsellMoment(UPSELL_MIN_LESSONS + 5)).toBe(true);
  });
});

describe('isEndOfFreeTheme', () => {
  const themed = [
    { id: 'a', unlocked: true },
    { id: 'b', unlocked: true },
    { id: 'c', unlocked: false },
  ];

  it('faux tant qu’une leçon gratuite du thème n’est pas terminée', () => {
    expect(isEndOfFreeTheme(themed, new Set(['a']))).toBe(false);
  });

  it('vrai quand tout le gratuit est fait et qu’il reste du Pro à débloquer', () => {
    expect(isEndOfFreeTheme(themed, new Set(['a', 'b']))).toBe(true);
  });

  it('faux si le thème n’a rien de verrouillé (rien à proposer)', () => {
    const allFree = [
      { id: 'a', unlocked: true },
      { id: 'b', unlocked: true },
    ];
    expect(isEndOfFreeTheme(allFree, new Set(['a', 'b']))).toBe(false);
  });

  it('faux si le thème est entièrement Pro (aucune leçon gratuite explorée)', () => {
    const allPro = [
      { id: 'a', unlocked: false },
      { id: 'b', unlocked: false },
    ];
    expect(isEndOfFreeTheme(allPro, new Set())).toBe(false);
  });
});
