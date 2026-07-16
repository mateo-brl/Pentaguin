import exams from './exams.json';
import lessonsD1 from './lessons/d1.json';
import pack from './pack.json';
import questionsD1 from './questions/d1.json';

// Chaque nouveau fichier de leçons/questions doit être importé puis ajouté
// aux tableaux ci-dessous (workflow détaillé dans docs/AUTHORING.md).
export default {
  ...pack,
  lessons: [...lessonsD1],
  questions: [...questionsD1],
  exams,
};
