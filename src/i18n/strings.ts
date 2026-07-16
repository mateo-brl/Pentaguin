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
  lesson: {
    quickcheck: 'Vérifie tes acquis',
    markDone: 'Marquer comme terminée',
    done: 'Terminée ✓',
    locked: 'Contenu Pro',
  },
  quiz: {
    title: 'Quiz',
    domain: 'Domaine',
    allDomains: 'Tous les domaines',
    count: 'Nombre de questions',
    availableCount: 'question(s) disponible(s)',
    start: 'Lancer le quiz',
    noQuestions: 'Aucune question disponible pour cette sélection.',
    question: 'Question',
    multiHint: 'Plusieurs réponses attendues.',
    validate: 'Valider',
    next: 'Question suivante',
    seeResults: 'Voir les résultats',
    correct: 'Bonne réponse !',
    incorrect: 'Raté…',
    resultsTitle: 'Résultats',
    correctCount: 'bonnes réponses',
    review: 'À revoir',
    replay: 'Refaire un quiz',
    backTrain: 'Retour à l’entraînement',
  },
  exam: {
    listTitle: 'Examens blancs',
    intro: 'Conditions réelles : chrono, aucun feedback avant la fin, résultat détaillé par domaine.',
    questions: 'questions',
    rules:
      'Pas de feedback pendant l’épreuve. Tu peux naviguer entre les questions et marquer 🚩 celles à revoir. Les questions sans réponse comptent fausses.',
    bankNote: 'question(s) dans la banque actuelle',
    start: 'Commencer l’examen',
    locked: 'Contenu Pro',
    flag: '🚩 Marquer',
    unflag: '🚩 Marquée',
    previous: 'Précédente',
    next: 'Suivante',
    finish: 'Terminer l’examen',
    confirmTitle: 'Terminer l’examen ?',
    confirmBody: 'question(s) sans réponse — elles seront comptées fausses.',
    keepGoing: 'Continuer',
    confirm: 'Terminer',
    resultsTitle: 'Résultat de l’examen',
    byDomain: 'Par domaine',
    review: 'À revoir',
    backTrain: 'Retour à l’entraînement',
  },
  mistakes: {
    title: 'Mes erreurs',
    empty: 'Rien à revoir pour l’instant — joue quelques quiz !',
    count: 'question(s) à retravailler',
    replay: 'Rejouer mes erreurs',
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
  lesson: {
    quickcheck: 'Check your understanding',
    markDone: 'Mark as completed',
    done: 'Completed ✓',
    locked: 'Pro content',
  },
  quiz: {
    title: 'Quiz',
    domain: 'Domain',
    allDomains: 'All domains',
    count: 'Number of questions',
    availableCount: 'question(s) available',
    start: 'Start quiz',
    noQuestions: 'No questions available for this selection.',
    question: 'Question',
    multiHint: 'Multiple answers expected.',
    validate: 'Check answer',
    next: 'Next question',
    seeResults: 'See results',
    correct: 'Correct!',
    incorrect: 'Not quite…',
    resultsTitle: 'Results',
    correctCount: 'correct answers',
    review: 'To review',
    replay: 'New quiz',
    backTrain: 'Back to practice',
  },
  exam: {
    listTitle: 'Mock exams',
    intro: 'Real conditions: timed, no feedback until the end, detailed per-domain results.',
    questions: 'questions',
    rules:
      'No feedback during the exam. Navigate between questions and flag 🚩 the ones to revisit. Unanswered questions count as wrong.',
    bankNote: 'question(s) in the current bank',
    start: 'Start exam',
    locked: 'Pro content',
    flag: '🚩 Flag',
    unflag: '🚩 Flagged',
    previous: 'Previous',
    next: 'Next',
    finish: 'Finish exam',
    confirmTitle: 'Finish exam?',
    confirmBody: 'unanswered question(s) — they will count as wrong.',
    keepGoing: 'Keep going',
    confirm: 'Finish',
    resultsTitle: 'Exam result',
    byDomain: 'By domain',
    review: 'To review',
    backTrain: 'Back to practice',
  },
  mistakes: {
    title: 'My mistakes',
    empty: 'Nothing to review yet — play a few quizzes!',
    count: 'question(s) to rework',
    replay: 'Replay my mistakes',
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
