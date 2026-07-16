import { useSyncExternalStore } from 'react';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

const fr = {
  tabs: {
    home: 'Accueil',
    learn: 'Apprendre',
    train: 'S’entraîner',
    profile: 'Profil',
  },
  home: {
    tagline: 'Révise la cybersécurité, cinq minutes à la fois.',
    streakLabel: 'Série en cours',
    days: 'jour(s)',
    continueCta: 'Commencer à apprendre',
    dailyChallenge: 'Défi du jour',
    comingSoon: 'Bientôt disponible',
  },
  learn: {
    lessons: 'leçon(s)',
    examWeight: 'de l’examen',
  },
  domain: {
    minutes: 'min',
    empty: 'Les leçons de ce domaine ne sont pas encore rédigées.',
    lessonSoon: 'Lecture disponible bientôt',
  },
  train: {
    quiz: 'Quiz par domaine',
    quizDesc: 'Feedback immédiat et explications détaillées.',
    exam: 'Examen blanc',
    examDesc: '90 questions chronométrées, conditions réelles.',
    mistakes: 'Mes erreurs',
    mistakesDesc: 'Rejoue les questions que tu as ratées.',
    comingSoon: 'Bientôt',
  },
  profile: {
    statsSoon: 'Tes statistiques de progression arriveront ici.',
    version: 'Version',
    disclaimer:
      'Pentaguin est une application indépendante d’entraînement. CompTIA®, Security+® et les autres marques citées appartiennent à leurs propriétaires respectifs ; aucune affiliation ni approbation n’est revendiquée.',
  },
};

export type Strings = typeof fr;

const en: Strings = {
  tabs: {
    home: 'Home',
    learn: 'Learn',
    train: 'Practice',
    profile: 'Profile',
  },
  home: {
    tagline: 'Brush up on cybersecurity, five minutes at a time.',
    streakLabel: 'Current streak',
    days: 'day(s)',
    continueCta: 'Start learning',
    dailyChallenge: 'Daily challenge',
    comingSoon: 'Coming soon',
  },
  learn: {
    lessons: 'lesson(s)',
    examWeight: 'of the exam',
  },
  domain: {
    minutes: 'min',
    empty: 'Lessons for this domain have not been written yet.',
    lessonSoon: 'Reading available soon',
  },
  train: {
    quiz: 'Quiz by domain',
    quizDesc: 'Instant feedback with detailed explanations.',
    exam: 'Mock exam',
    examDesc: '90 timed questions, real exam conditions.',
    mistakes: 'My mistakes',
    mistakesDesc: 'Replay the questions you got wrong.',
    comingSoon: 'Soon',
  },
  profile: {
    statsSoon: 'Your progress statistics will appear here.',
    version: 'Version',
    disclaimer:
      'Pentaguin is an independent training application. CompTIA®, Security+® and other cited trademarks belong to their respective owners; no affiliation or endorsement is claimed.',
  },
};

const dictionaries: Record<Locale, Strings> = { fr, en };

let currentLocale: Locale = 'fr';
const listeners = new Set<() => void>();

export function setLocale(locale: Locale) {
  currentLocale = locale;
  listeners.forEach((notify) => notify());
}

export function getLocale(): Locale {
  return currentLocale;
}

export function useStrings(): Strings {
  const locale = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => currentLocale,
    () => currentLocale,
  );
  return dictionaries[locale];
}
