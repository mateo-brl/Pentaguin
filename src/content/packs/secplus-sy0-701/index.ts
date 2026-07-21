import exams from './exams.json';
import lessonsCrypto from './lessons/d-crypto.json';
import lessonsDefense from './lessons/d-defense.json';
import lessonsFond from './lessons/d-fond.json';
import lessonsNet from './lessons/d-net.json';
import lessonsOffensive from './lessons/d-offensive.json';
import lessonsSys from './lessons/d-sys.json';
import lessonsThreats from './lessons/d-threats.json';
import lessonsWeb from './lessons/d-web.json';
import lessonsCryptoEn from './lessons/en/d-crypto.json';
import lessonsDefenseEn from './lessons/en/d-defense.json';
import lessonsFondEn from './lessons/en/d-fond.json';
import lessonsNetEn from './lessons/en/d-net.json';
import lessonsOffensiveEn from './lessons/en/d-offensive.json';
import lessonsSysEn from './lessons/en/d-sys.json';
import lessonsThreatsEn from './lessons/en/d-threats.json';
import lessonsWebEn from './lessons/en/d-web.json';
import pack from './pack.json';
import questionsCrypto from './questions/d-crypto.json';
import questionsDefense from './questions/d-defense.json';
import questionsFond from './questions/d-fond.json';
import questionsNet from './questions/d-net.json';
import questionsOffensive from './questions/d-offensive.json';
import questionsSys from './questions/d-sys.json';
import questionsThreats from './questions/d-threats.json';
import questionsWeb from './questions/d-web.json';
import questionsCryptoEn from './questions/en/d-crypto.json';
import questionsDefenseEn from './questions/en/d-defense.json';
import questionsFondEn from './questions/en/d-fond.json';
import questionsNetEn from './questions/en/d-net.json';
import questionsOffensiveEn from './questions/en/d-offensive.json';
import questionsSysEn from './questions/en/d-sys.json';
import questionsThreatsEn from './questions/en/d-threats.json';
import questionsWebEn from './questions/en/d-web.json';

// Un fichier de leçons + un fichier de questions par thème (domaine), en français
// et en anglais (mêmes identifiants d'un côté et de l'autre : la progression et le
// test de positionnement restent valables si l'utilisateur change de langue).
// Tant qu'une traduction est vide, on RETOMBE sur le français (jamais d'écran vide).

const lessonsFr = [
  ...lessonsFond,
  ...lessonsNet,
  ...lessonsCrypto,
  ...lessonsWeb,
  ...lessonsSys,
  ...lessonsThreats,
  ...lessonsDefense,
  ...lessonsOffensive,
];
const questionsFr = [
  ...questionsFond,
  ...questionsNet,
  ...questionsCrypto,
  ...questionsWeb,
  ...questionsSys,
  ...questionsThreats,
  ...questionsDefense,
  ...questionsOffensive,
];

/** Repli : une traduction absente/incomplète ne doit jamais vider un écran. */
function withFallback<T>(translated: T[], french: T[]): T[] {
  return translated.length > 0 ? translated : french;
}

const lessonsEn = [
  ...withFallback(lessonsFondEn, lessonsFond),
  ...withFallback(lessonsNetEn, lessonsNet),
  ...withFallback(lessonsCryptoEn, lessonsCrypto),
  ...withFallback(lessonsWebEn, lessonsWeb),
  ...withFallback(lessonsSysEn, lessonsSys),
  ...withFallback(lessonsThreatsEn, lessonsThreats),
  ...withFallback(lessonsDefenseEn, lessonsDefense),
  ...withFallback(lessonsOffensiveEn, lessonsOffensive),
];
const questionsEn = [
  ...withFallback(questionsFondEn, questionsFond),
  ...withFallback(questionsNetEn, questionsNet),
  ...withFallback(questionsCryptoEn, questionsCrypto),
  ...withFallback(questionsWebEn, questionsWeb),
  ...withFallback(questionsSysEn, questionsSys),
  ...withFallback(questionsThreatsEn, questionsThreats),
  ...withFallback(questionsDefenseEn, questionsDefense),
  ...withFallback(questionsOffensiveEn, questionsOffensive),
];

/** Titres de thèmes traduits (mêmes ids, mêmes codes que le pack français). */
const DOMAIN_TITLES_EN: Record<string, string> = {
  'd-fond': 'Fundamentals & hygiene',
  'd-net': 'Networking',
  'd-crypto': 'Cryptography',
  'd-web': 'Web & application security',
  'd-sys': 'Systems & Active Directory',
  'd-threats': 'Threats & malware',
  'd-defense': 'Defense, SOC & incident response',
  'd-offensive': 'Offensive security & pentesting',
};

export const packFr = { ...pack, lessons: lessonsFr, questions: questionsFr, exams };

export const packEn = {
  ...pack,
  locale: 'en',
  domains: pack.domains.map((d) => ({ ...d, title: DOMAIN_TITLES_EN[d.id] ?? d.title })),
  lessons: lessonsEn,
  questions: questionsEn,
  exams,
};

export default packFr;
