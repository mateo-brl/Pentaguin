import { getLocale, type Locale } from '@/i18n/strings';

import rawEn from './exercises.en.json';
import raw from './exercises.json';
import { practiceBankSchema, type PracticeExercise } from './schema';

const cache = new Map<Locale, PracticeExercise[]>();

/**
 * Exercices de pratique de la langue active (mêmes identifiants d'une langue à
 * l'autre). Repli sur le français tant que la traduction est absente.
 */
export function getPracticeExercises(locale: Locale = getLocale()): PracticeExercise[] {
  const cached = cache.get(locale);
  if (cached) return cached;
  const source = locale === 'en' && rawEn.length > 0 ? rawEn : raw;
  const parsed = practiceBankSchema.parse(source);
  cache.set(locale, parsed);
  return parsed;
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
