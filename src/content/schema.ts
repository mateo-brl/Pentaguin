import { z } from 'zod';

const idSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'identifiant attendu en kebab-case (ex. l-d1-001)');
const mdSchema = z.string().min(1);

export const domainSchema = z.object({
  id: idSchema,
  /** Code officiel du domaine d'examen, ex. "1.0" */
  code: z.string().regex(/^\d+\.\d+$/),
  title: z.string().min(1),
  /** Pondération officielle du domaine dans l'examen, en % */
  weightPercent: z.number().int().min(1).max(100),
  order: z.number().int().min(1),
});

export const lessonBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), md: mdSchema }),
  z.object({
    type: z.literal('callout'),
    variant: z.enum(['tip', 'warning', 'exam']),
    md: mdSchema,
  }),
  z.object({
    type: z.literal('keyterms'),
    terms: z
      .array(z.object({ term: z.string().min(1), def: z.string().min(1) }))
      .min(1),
  }),
  z.object({ type: z.literal('quickcheck'), questionId: idSchema }),
]);

export const lessonSchema = z.object({
  id: idSchema,
  domainId: idSchema,
  title: z.string().min(1),
  order: z.number().int().min(1),
  estMinutes: z.number().int().min(1),
  blocks: z.array(lessonBlockSchema).min(1),
});

export const questionSchema = z.object({
  id: idSchema,
  domainId: idSchema,
  /** Leçons qui couvrent cette question (optionnel) */
  lessonIds: z.array(idSchema).optional(),
  type: z.enum(['single', 'multi']),
  stem: z.string().min(1),
  choices: z
    .array(z.object({ id: z.string().regex(/^[a-f]$/), text: z.string().min(1) }))
    .min(2)
    .max(6),
  correct: z.array(z.string()).min(1),
  explanation: z.string().min(20, 'chaque question doit avoir une explication détaillée'),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  tags: z.array(z.string()).default([]),
});

export const mockExamSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  durationMin: z.number().int().min(1),
  questionCount: z.number().int().min(1),
  /** "weighted" : tirage aléatoire proportionnel au poids officiel des domaines */
  selection: z.literal('weighted'),
});

export const contentPackSchema = z.object({
  id: idSchema,
  /** Nom d'affichage de la certification (usage nominatif uniquement) */
  certName: z.string().min(1),
  examCode: z.string().min(1),
  locale: z.enum(['fr', 'en']),
  /** À incrémenter à chaque publication de contenu (suivi OTA) */
  version: z.number().int().min(1),
  domains: z.array(domainSchema).min(1),
  lessons: z.array(lessonSchema),
  questions: z.array(questionSchema),
  exams: z.array(mockExamSchema),
});

export type Domain = z.infer<typeof domainSchema>;
export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Question = z.infer<typeof questionSchema>;
export type MockExam = z.infer<typeof mockExamSchema>;
export type ContentPack = z.infer<typeof contentPackSchema>;
