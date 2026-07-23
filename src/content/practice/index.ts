import { getLocale, type Locale } from '@/i18n/strings';

import rawEn from './exercises.en.json';
import raw from './exercises.json';
import missionsRawEn from './missions.en.json';
import missionsRaw from './missions.json';
import {
  missionBankSchema,
  practiceBankSchema,
  type PracticeExercise,
  type PracticeMission,
} from './schema';

const cache = new Map<Locale, PracticeExercise[]>();
const missionCache = new Map<Locale, PracticeMission[]>();

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

/** Missions scénarisées de la langue active (mêmes ids FR/EN, repli FR). */
export function getPracticeMissions(locale: Locale = getLocale()): PracticeMission[] {
  const cached = missionCache.get(locale);
  if (cached) return cached;
  const source = locale === 'en' && missionsRawEn.length > 0 ? missionsRawEn : missionsRaw;
  const parsed = missionBankSchema.parse(source);
  missionCache.set(locale, parsed);
  return parsed;
}

export function getPracticeMission(id: string): PracticeMission | undefined {
  return getPracticeMissions().find((m) => m.id === id);
}

export type {
  AnalysisExercise,
  OrderExercise,
  PracticeExercise,
  PracticeMission,
  ScenarioExercise,
  TerminalExercise,
} from './schema';
