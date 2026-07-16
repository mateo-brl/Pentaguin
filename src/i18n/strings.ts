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
    tagline: 'Prépare ta certification, cinq minutes à la fois.',
    streakLabel: 'Série en cours',
    day: 'jour',
    days: 'jours',
    continueCta: 'Commencer à apprendre',
    dailyChallenge: 'Défi du jour',
    challengeDesc: '5 questions, nouveau tirage chaque jour',
    challengeDone: 'Défi du jour terminé',
    streakRecord: 'Record',
  },
  learn: {
    lessons: 'leçon(s)',
    examWeight: 'de l’examen',
  },
  domain: {
    minutes: 'min',
    empty: 'Les leçons de ce domaine ne sont pas encore rédigées.',
  },
  lesson: {
    quickcheck: 'Question rapide',
    markDone: 'Marquer comme terminée',
    done: 'Terminée',
    locked: 'Contenu Pro',
    calloutTip: 'Astuce',
    calloutWarning: 'Attention',
    calloutExam: 'Réflexe examen',
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
    correct: 'Bonne réponse',
    incorrect: 'Mauvaise réponse',
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
      'Pas de feedback pendant l’épreuve. Tu peux naviguer entre les questions et marquer celles à revoir. Les questions sans réponse comptent fausses.',
    bankNote: 'question(s) dans la banque actuelle',
    start: 'Commencer l’examen',
    locked: 'Contenu Pro',
    flag: 'Marquer pour révision',
    unflag: 'Marquée pour révision',
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
    empty: 'Aucune question à revoir pour le moment.',
    count: 'question(s) à retravailler',
    replay: 'Rejouer mes erreurs',
  },
  notifications: {
    reminderTitle: 'Garde ta série',
    reminderBody: 'Quelques minutes de révision suffisent pour prolonger ta série.',
  },
  paywall: {
    title: 'Pentaguin Pro',
    pitch: 'Débloque l’intégralité du pack Security+ :',
    bulletDomains: 'Les 5 domaines et toutes les leçons',
    bulletBank: 'La banque de questions complète',
    bulletExams: 'Tous les examens blancs',
    oneTime: 'Achat unique — pas d’abonnement.',
    buy: 'Débloquer',
    restore: 'Restaurer mes achats',
    restored: 'Achats restaurés.',
    nothingToRestore: 'Aucun achat à restaurer.',
    alreadyPro: 'Pack débloqué',
    unavailable:
      'Achats indisponibles dans cette build (Expo Go ou boutique non configurée).',
    error: 'L’achat n’a pas abouti. Réessaie plus tard.',
    close: 'Fermer',
    upsellTitle: 'Pentaguin Pro',
    upsellDesc: 'Tous les domaines et examens blancs, en un achat unique.',
    upsellCta: 'Voir l’offre',
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
  leaderboard: {
    title: 'Classement',
    optInTitle: 'Participer au classement',
    optInBody:
      'Compare ton XP avec les autres. Seuls un pseudo et tes points sont partagés — aucune donnée personnelle, et tu peux arrêter quand tu veux.',
    pseudoPlaceholder: 'Ton pseudo (3-20 caractères)',
    join: 'Participer',
    invalidPseudo: 'Pseudo invalide : 3 à 20 caractères (lettres, chiffres, espaces, . _ -).',
    periodAll: 'Général',
    period7d: '7 jours',
    empty: 'Personne au classement pour l’instant.',
    error: 'Classement indisponible. Vérifie ta connexion.',
    you: 'toi',
    points: 'XP',
  },
  profile: {
    statsSoon: 'Tes statistiques de progression arriveront ici.',
    leaderboard: 'Classement',
    xpTotal: 'XP au total',
    bestStreak: 'Meilleure série',
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
    tagline: 'Prep your certification, five minutes at a time.',
    streakLabel: 'Current streak',
    day: 'day',
    days: 'days',
    continueCta: 'Start learning',
    dailyChallenge: 'Daily challenge',
    challengeDesc: '5 questions, new draw every day',
    challengeDone: 'Daily challenge complete',
    streakRecord: 'Best',
  },
  learn: {
    lessons: 'lesson(s)',
    examWeight: 'of the exam',
  },
  domain: {
    minutes: 'min',
    empty: 'Lessons for this domain have not been written yet.',
  },
  lesson: {
    quickcheck: 'Quick question',
    markDone: 'Mark as completed',
    done: 'Completed',
    locked: 'Pro content',
    calloutTip: 'Tip',
    calloutWarning: 'Watch out',
    calloutExam: 'Exam habit',
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
    correct: 'Correct',
    incorrect: 'Incorrect',
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
      'No feedback during the exam. Navigate between questions and mark the ones to revisit. Unanswered questions count as wrong.',
    bankNote: 'question(s) in the current bank',
    start: 'Start exam',
    locked: 'Pro content',
    flag: 'Mark for review',
    unflag: 'Marked for review',
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
    empty: 'No questions to review yet.',
    count: 'question(s) to rework',
    replay: 'Replay my mistakes',
  },
  notifications: {
    reminderTitle: 'Keep your streak going',
    reminderBody: 'A few minutes of review is enough to extend your streak.',
  },
  paywall: {
    title: 'Pentaguin Pro',
    pitch: 'Unlock the full Security+ pack:',
    bulletDomains: 'All 5 domains and every lesson',
    bulletBank: 'The complete question bank',
    bulletExams: 'All mock exams',
    oneTime: 'One-time purchase — no subscription.',
    buy: 'Unlock',
    restore: 'Restore purchases',
    restored: 'Purchases restored.',
    nothingToRestore: 'No purchases to restore.',
    alreadyPro: 'Pack unlocked',
    unavailable: 'Purchases unavailable in this build (Expo Go or store not configured).',
    error: 'The purchase did not complete. Please try again later.',
    close: 'Close',
    upsellTitle: 'Pentaguin Pro',
    upsellDesc: 'Every domain and mock exam, one single purchase.',
    upsellCta: 'See the offer',
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
  leaderboard: {
    title: 'Leaderboard',
    optInTitle: 'Join the leaderboard',
    optInBody:
      'Compare your XP with others. Only a pseudonym and your points are shared — no personal data, and you can stop anytime.',
    pseudoPlaceholder: 'Your pseudonym (3-20 characters)',
    join: 'Join',
    invalidPseudo: 'Invalid pseudonym: 3 to 20 characters (letters, digits, spaces, . _ -).',
    periodAll: 'All-time',
    period7d: '7 days',
    empty: 'Nobody on the leaderboard yet.',
    error: 'Leaderboard unavailable. Check your connection.',
    you: 'you',
    points: 'XP',
  },
  profile: {
    statsSoon: 'Your progress statistics will appear here.',
    leaderboard: 'Leaderboard',
    xpTotal: 'Total XP',
    bestStreak: 'Best streak',
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

/** Accès hors composant React (ex. contenu d'une notification). */
export function getStrings(): Strings {
  return dictionaries[currentLocale];
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
