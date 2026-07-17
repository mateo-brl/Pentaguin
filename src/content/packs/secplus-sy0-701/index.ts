import exams from './exams.json';
import lessonsD1 from './lessons/d1.json';
import lessonsD2 from './lessons/d2.json';
import lessonsD3 from './lessons/d3.json';
import lessonsD4 from './lessons/d4.json';
import lessonsD5 from './lessons/d5.json';
import pack from './pack.json';
import questionsD1 from './questions/d1.json';
import questionsD2 from './questions/d2.json';
import questionsD3 from './questions/d3.json';
import questionsD4 from './questions/d4.json';
import questionsD5 from './questions/d5.json';

// Chaque nouveau fichier de leçons/questions doit être importé puis ajouté
// aux tableaux ci-dessous (workflow détaillé dans docs/AUTHORING.md).
export default {
  ...pack,
  lessons: [...lessonsD1, ...lessonsD2, ...lessonsD3, ...lessonsD4, ...lessonsD5],
  questions: [
    ...questionsD1,
    ...questionsD2,
    ...questionsD3,
    ...questionsD4,
    ...questionsD5,
  ],
  exams,
};
