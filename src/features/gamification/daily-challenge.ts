import type { ContentPack, Question } from '@/content';
import type { Entitlements } from '@/features/monetization';
import { hashString, pickQuestions, seededRng } from '@/features/quiz/logic';
import { playableQuestions } from '@/features/quiz/select';

export const DAILY_CHALLENGE_KV_KEY = 'daily_challenge_done';
const CHALLENGE_SIZE = 5;

/** Tirage du défi du jour : déterministe par date (même défi toute la journée). */
export function dailyChallengeQuestions(
  pack: ContentPack,
  entitlements: Entitlements,
  dateKey: string,
): Question[] {
  const pool = playableQuestions(pack, null, entitlements);
  return pickQuestions(pool, CHALLENGE_SIZE, seededRng(hashString(dateKey)));
}
