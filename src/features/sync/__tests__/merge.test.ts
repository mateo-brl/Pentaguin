import { describe, expect, it } from '@jest/globals';

import { emptySnapshot, mergeSnapshots, type Snapshot } from '../merge';

const snap = (over: Partial<Snapshot>): Snapshot => ({ ...emptySnapshot(), ...over });

describe('mergeSnapshots', () => {
  it('restaure tout sur une base vide (cas réinstallation)', () => {
    const remote = snap({
      lessons: { 'p::l1': 100 },
      activity: { '2026-07-01': 30 },
      kv: { player_rank: '6', streak: '4' },
    });
    const merged = mergeSnapshots(remote, emptySnapshot());
    expect(merged.lessons['p::l1']).toBe(100);
    expect(merged.activity['2026-07-01']).toBe(30);
    expect(merged.kv.player_rank).toBe('6');
  });

  it('prend l’union des leçons et la première complétion', () => {
    const a = snap({ lessons: { 'p::l1': 200, 'p::l2': 50 } });
    const b = snap({ lessons: { 'p::l1': 100, 'p::l3': 70 } });
    const m = mergeSnapshots(a, b);
    expect(Object.keys(m.lessons).sort()).toEqual(['p::l1', 'p::l2', 'p::l3']);
    expect(m.lessons['p::l1']).toBe(100); // la plus ancienne complétion
  });

  it('ne fait jamais régresser l’XP d’un jour ni le rang', () => {
    const a = snap({ activity: { d: 20 }, kv: { player_rank: '8' } });
    const b = snap({ activity: { d: 50 }, kv: { player_rank: '5' } });
    const m = mergeSnapshots(a, b);
    expect(m.activity.d).toBe(50);
    expect(m.kv.player_rank).toBe('8'); // max, pas la valeur la plus fraîche
  });

  it('garde le max des stats par question', () => {
    const a = snap({ qstats: { 'p::q': [3, 1, 300, 300] } });
    const b = snap({ qstats: { 'p::q': [1, 1, 500, 0] } });
    expect(mergeSnapshots(a, b).qstats['p::q']).toEqual([3, 1, 500, 300]);
  });

  it('laisse le snapshot le plus frais gagner sur les préférences', () => {
    const a = snap({ kv: { daily_goal_level: 'light', locale: 'fr' } });
    const b = snap({ kv: { daily_goal_level: 'intense' } });
    const m = mergeSnapshots(a, b);
    expect(m.kv.daily_goal_level).toBe('intense'); // b (frais) gagne
    expect(m.kv.locale).toBe('fr'); // présent seulement dans a
  });

  it('fait l’union des flags anti-farm (présence)', () => {
    const a = snap({ kv: { 'qc_xp:q1': '1' } });
    const b = snap({ kv: { 'practice_done:x': '1' } });
    const m = mergeSnapshots(a, b);
    expect(m.kv['qc_xp:q1']).toBe('1');
    expect(m.kv['practice_done:x']).toBe('1');
  });
});
