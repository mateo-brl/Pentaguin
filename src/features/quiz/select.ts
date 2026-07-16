import { monetizationConfig, type MonetizationConfig } from '@/config/monetization';
import type { ContentPack, Question } from '@/content';
import {
  freeQuestionIds,
  isUnlocked,
  packEntitlement,
  type Entitlements,
} from '@/features/monetization';

/**
 * Questions jouables pour un domaine (ou tous si null), selon le curseur
 * gratuit/payant : banque complète si domaine gratuit ou pack acheté, sinon
 * sous-ensemble gratuit stable.
 */
export function playableQuestions(
  pack: ContentPack,
  domainId: string | null,
  entitlements: Entitlements,
  config: MonetizationConfig = monetizationConfig,
): Question[] {
  const entitlement = packEntitlement(pack.id);
  const domains = domainId ? pack.domains.filter((d) => d.id === domainId) : pack.domains;
  const result: Question[] = [];

  for (const domain of domains) {
    const questions = pack.questions.filter((q) => q.domainId === domain.id);
    const fullBank = isUnlocked(
      { kind: 'full-question-bank', domainId: domain.id, entitlement },
      entitlements,
      config,
    );
    if (fullBank) {
      result.push(...questions);
    } else {
      const free = freeQuestionIds(
        questions.map((q) => q.id),
        config.free.questionRatioPerDomain,
      );
      result.push(...questions.filter((q) => free.has(q.id)));
    }
  }

  return result;
}
