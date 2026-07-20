import raw from './exercises.json';
import { practiceBankSchema, type PracticeExercise } from './schema';

let cache: PracticeExercise[] | null = null;

/** Banque d'exercices de pratique, parsée + validée au premier accès. */
export function getPracticeExercises(): PracticeExercise[] {
  if (!cache) cache = practiceBankSchema.parse(raw);
  return cache;
}

export function getPracticeExercise(id: string): PracticeExercise | undefined {
  return getPracticeExercises().find((e) => e.id === id);
}

export type {
  AnalysisExercise,
  OrderExercise,
  PracticeExercise,
  ScenarioExercise,
  TerminalExercise,
} from './schema';
