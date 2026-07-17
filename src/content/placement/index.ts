import raw from './questions.json';
import { placementBankSchema, type PlacementQuestion } from './schema';

let cache: PlacementQuestion[] | null = null;

/** Banque de positionnement parsée + validée (au premier accès). */
export function getPlacementQuestions(): PlacementQuestion[] {
  if (!cache) cache = placementBankSchema.parse(raw);
  return cache;
}

export type { PlacementQuestion } from './schema';
