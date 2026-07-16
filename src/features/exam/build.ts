import { monetizationConfig, type MonetizationConfig } from '@/config/monetization';
import type { ContentPack, MockExam, Question } from '@/content';
import type { Entitlements } from '@/features/monetization';
import { pickQuestions, shuffle, type Rng } from '@/features/quiz/logic';
import { playableQuestions } from '@/features/quiz/select';

/**
 * Tirage pondéré d'un examen blanc : répartit questionCount entre les domaines
 * au prorata des poids officiels, borne chaque quota à la banque jouable, puis
 * redistribue le manque aux domaines qui ont encore du stock. Ordre final
 * mélangé. Peut retourner moins que questionCount si la banque est trop petite.
 */
export function buildExamQuestions(
  pack: ContentPack,
  exam: MockExam,
  entitlements: Entitlements,
  config: MonetizationConfig = monetizationConfig,
  rng: Rng = Math.random,
): Question[] {
  const domains = [...pack.domains].sort((a, b) => a.order - b.order);
  const pools = domains.map((domain) => playableQuestions(pack, domain.id, entitlements, config));
  const totalWeight = domains.reduce((sum, domain) => sum + domain.weightPercent, 0);

  // Quotas au prorata ; le reste va aux plus grandes parts fractionnaires.
  const exact = domains.map((domain) => (exam.questionCount * domain.weightPercent) / totalWeight);
  const quotas = exact.map(Math.floor);
  let remainder = exam.questionCount - quotas.reduce((a, b) => a + b, 0);
  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (const { index } of byFraction) {
    if (remainder <= 0) break;
    quotas[index] += 1;
    remainder -= 1;
  }

  // Borne à la banque disponible puis redistribue le manque.
  const take = quotas.map((quota, index) => Math.min(quota, pools[index].length));
  let shortfall = exam.questionCount - take.reduce((a, b) => a + b, 0);
  while (shortfall > 0) {
    const index = take.findIndex((taken, i) => taken < pools[i].length);
    if (index === -1) break; // banque globale insuffisante
    take[index] += 1;
    shortfall -= 1;
  }

  const picked = domains.flatMap((_, index) => pickQuestions(pools[index], take[index], rng));
  return shuffle(picked, rng);
}
