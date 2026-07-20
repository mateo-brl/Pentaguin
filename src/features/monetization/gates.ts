import type { MonetizationConfig } from '@/config/monetization';

import type { Entitlements } from './provider';

/** Entitlement qui débloque l'intégralité d'un pack de certification. */
export function packEntitlement(packId: string): string {
  return `pro:${packId}`;
}

export type GatedItem =
  | { kind: 'lesson'; domainId: string; entitlement: string }
  | { kind: 'exam'; examIndex: number; entitlement: string }
  | { kind: 'full-question-bank'; domainId: string; entitlement: string };

/**
 * Décide si un contenu est accessible. Fonction pure : toute la politique
 * gratuit/payant de l'app passe par ici (et uniquement par ici).
 */
export function isUnlocked(
  item: GatedItem,
  entitlements: Entitlements,
  config: MonetizationConfig,
): boolean {
  if (!config.enabled) return true;
  if (entitlements.has(item.entitlement)) return true;

  switch (item.kind) {
    case 'lesson':
      return config.free.domainIds.includes(item.domainId);
    case 'exam':
      return item.examIndex < config.free.mockExamCount;
    case 'full-question-bank':
      return config.free.domainIds.includes(item.domainId);
  }
}

/**
 * Sous-ensemble gratuit de la banque de questions d'un domaine non gratuit.
 * Déterministe (tri par id puis coupe) : le même pour tous les utilisateurs
 * et stable d'une session à l'autre.
 */
export function freeQuestionIds(questionIds: readonly string[], ratio: number): Set<string> {
  const clamped = Math.min(1, Math.max(0, ratio));
  const sorted = [...questionIds].sort();
  return new Set(sorted.slice(0, Math.ceil(sorted.length * clamped)));
}

export type FreeLessonInput = { id: string; domainId: string; level?: number; order: number };

/**
 * Leçons gratuites (« eau à la bouche ») : toutes celles des domaines gratuits,
 * plus les N premières (par niveau puis ordre croissants) de chaque autre thème
 * — un avant-goût de tout le contenu. Fonction pure.
 */
export function freeLessonIds(
  lessons: readonly FreeLessonInput[],
  config: MonetizationConfig,
): Set<string> {
  const free = new Set<string>();
  const perDomain = new Map<string, FreeLessonInput[]>();
  for (const lesson of lessons) {
    if (config.free.domainIds.includes(lesson.domainId)) {
      free.add(lesson.id);
      continue;
    }
    const arr = perDomain.get(lesson.domainId) ?? [];
    arr.push(lesson);
    perDomain.set(lesson.domainId, arr);
  }
  const n = config.free.lessonsPerDomain ?? 0;
  for (const arr of perDomain.values()) {
    arr
      .slice()
      .sort((a, b) => (a.level ?? 99) - (b.level ?? 99) || a.order - b.order)
      .slice(0, n)
      .forEach((l) => free.add(l.id));
  }
  return free;
}
