import type { ContentPack, Lesson } from '@/content';

/**
 * Sélectionne les leçons « à ton niveau » à partir du rang du joueur : celles
 * dont le `level` est dans une fenêtre autour du rang (rang-1 → rang+1 par
 * défaut), triées par proximité au rang puis par niveau croissant. C'est le
 * cœur de l'orientation : après le test de positionnement, on met en avant ce
 * qui correspond au niveau réel.
 */
export function recommendedLessons(
  pack: ContentPack,
  rank: number,
  options: { window?: number; limit?: number; exclude?: ReadonlySet<string> } = {},
): Lesson[] {
  const { window = 1, limit = 8, exclude } = options;
  return pack.lessons
    .filter(
      (l) =>
        l.level != null && Math.abs(l.level - rank) <= window && !(exclude && exclude.has(l.id)),
    )
    .sort((a, b) => {
      const da = Math.abs((a.level as number) - rank);
      const db = Math.abs((b.level as number) - rank);
      if (da !== db) return da - db;
      return (a.level as number) - (b.level as number);
    })
    .slice(0, limit);
}

/** Un contenu (leçon, exercice…) est-il « à ton rang » (badge de mise en avant) ? */
export function isRecommended(item: { level?: number }, rank: number, window = 1): boolean {
  return item.level != null && Math.abs(item.level - rank) <= window;
}
