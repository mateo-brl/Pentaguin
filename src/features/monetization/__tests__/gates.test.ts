import { describe, expect, it } from '@jest/globals';

import type { MonetizationConfig } from '@/config/monetization';

import { freeQuestionIds, isUnlocked, packEntitlement } from '../gates';

const config: MonetizationConfig = {
  enabled: true,
  free: {
    domainIds: ['d1', 'd2'],
    questionRatioPerDomain: 0.4,
    mockExamCount: 1,
  },
  upsell: { maxSpontaneousPrompts: 1 },
};

const pro = packEntitlement('secplus-sy0-701');
const noEntitlements = new Set<string>();
const proEntitlements = new Set([pro]);

describe('isUnlocked', () => {
  it('débloque tout quand la monétisation est coupée', () => {
    const off = { ...config, enabled: false };
    expect(
      isUnlocked({ kind: 'lesson', domainId: 'd5', entitlement: pro }, noEntitlements, off),
    ).toBe(true);
    expect(isUnlocked({ kind: 'exam', examIndex: 9, entitlement: pro }, noEntitlements, off)).toBe(
      true,
    );
  });

  it('laisse les domaines gratuits accessibles sans achat', () => {
    expect(
      isUnlocked({ kind: 'lesson', domainId: 'd1', entitlement: pro }, noEntitlements, config),
    ).toBe(true);
    expect(
      isUnlocked(
        { kind: 'full-question-bank', domainId: 'd2', entitlement: pro },
        noEntitlements,
        config,
      ),
    ).toBe(true);
  });

  it('verrouille les domaines payants sans entitlement', () => {
    expect(
      isUnlocked({ kind: 'lesson', domainId: 'd3', entitlement: pro }, noEntitlements, config),
    ).toBe(false);
  });

  it("débloque les domaines payants avec l'entitlement du pack", () => {
    expect(
      isUnlocked({ kind: 'lesson', domainId: 'd3', entitlement: pro }, proEntitlements, config),
    ).toBe(true);
  });

  it('offre les N premiers examens blancs, verrouille les suivants', () => {
    expect(isUnlocked({ kind: 'exam', examIndex: 0, entitlement: pro }, noEntitlements, config)).toBe(
      true,
    );
    expect(isUnlocked({ kind: 'exam', examIndex: 1, entitlement: pro }, noEntitlements, config)).toBe(
      false,
    );
    expect(isUnlocked({ kind: 'exam', examIndex: 1, entitlement: pro }, proEntitlements, config)).toBe(
      true,
    );
  });
});

describe('freeQuestionIds', () => {
  const ids = ['q-05', 'q-01', 'q-03', 'q-02', 'q-04'];

  it('retourne un sous-ensemble stable, indépendant de l’ordre d’entrée', () => {
    const a = freeQuestionIds(ids, 0.4);
    const b = freeQuestionIds([...ids].reverse(), 0.4);
    expect([...a].sort()).toEqual([...b].sort());
  });

  it('arrondit au plafond (ceil)', () => {
    expect(freeQuestionIds(ids, 0.4).size).toBe(2);
    expect(freeQuestionIds(ids, 0.5).size).toBe(3);
  });

  it('gère les bornes 0 et 1', () => {
    expect(freeQuestionIds(ids, 0).size).toBe(0);
    expect(freeQuestionIds(ids, 1).size).toBe(5);
    expect(freeQuestionIds(ids, 2).size).toBe(5);
  });

  it('prend les premiers ids par ordre lexicographique', () => {
    expect(freeQuestionIds(ids, 0.4)).toEqual(new Set(['q-01', 'q-02']));
  });
});
