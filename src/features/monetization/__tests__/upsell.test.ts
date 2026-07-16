import { describe, expect, it } from '@jest/globals';

import type { MonetizationConfig } from '@/config/monetization';

import { canShowSpontaneousUpsell } from '../upsell';

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
