import exams from './exams.json';
import lessonsCrypto from './lessons/d-crypto.json';
import lessonsDefense from './lessons/d-defense.json';
import lessonsFond from './lessons/d-fond.json';
import lessonsNet from './lessons/d-net.json';
import lessonsOffensive from './lessons/d-offensive.json';
import lessonsSys from './lessons/d-sys.json';
import lessonsThreats from './lessons/d-threats.json';
import lessonsWeb from './lessons/d-web.json';
import pack from './pack.json';
import questionsCrypto from './questions/d-crypto.json';
import questionsDefense from './questions/d-defense.json';
import questionsFond from './questions/d-fond.json';
import questionsNet from './questions/d-net.json';
import questionsOffensive from './questions/d-offensive.json';
import questionsSys from './questions/d-sys.json';
import questionsThreats from './questions/d-threats.json';
import questionsWeb from './questions/d-web.json';

// Un fichier de leçons + un fichier de questions par thème (domaine). Le contenu
// se remplit par vagues (voir docs/AUTHORING-LESSONS.md).
export default {
  ...pack,
  lessons: [
    ...lessonsFond,
    ...lessonsNet,
    ...lessonsCrypto,
    ...lessonsWeb,
    ...lessonsSys,
    ...lessonsThreats,
    ...lessonsDefense,
    ...lessonsOffensive,
  ],
  questions: [
    ...questionsFond,
    ...questionsNet,
    ...questionsCrypto,
    ...questionsWeb,
    ...questionsSys,
    ...questionsThreats,
    ...questionsDefense,
    ...questionsOffensive,
  ],
  exams,
};
