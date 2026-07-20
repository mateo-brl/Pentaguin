import { z } from 'zod';

/**
 * Exercices de PRATIQUE SIMULÉE (offline, aucun vrai lab). Quatre types, tous
 * pilotés par la donnée comme le reste du contenu. Chaque exercice porte un
 * `level` 1-15 pour l'orientation par rang.
 */

const base = {
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  title: z.string().min(1),
  level: z.number().int().min(1).max(15),
  /** Mise en situation affichée en tête. */
  brief: z.string().min(1),
  tags: z.array(z.string()).default([]),
};

/** 1) Faux terminal scénarisé : une suite d'étapes guidées. */
export const terminalExerciseSchema = z.object({
  ...base,
  kind: z.literal('terminal'),
  /** Invite affichée avant le curseur, ex. "analyst@soc:~$". */
  shell: z.string().default('user@pentaguin:~$'),
  steps: z
    .array(
      z.object({
        /** Consigne de l'étape. */
        instruction: z.string().min(1),
        /** Regex (insensible à la casse) que la commande saisie doit satisfaire. */
        expect: z.string().min(1),
        /** Sortie affichée quand la commande est acceptée. */
        output: z.string().min(1),
        /** Indice optionnel (commande attendue en clair). */
        hint: z.string().optional(),
      }),
    )
    .min(1),
  success: z.string().min(1),
});

/** 2) Défi d'analyse : repérer la ligne fautive dans un artefact. */
export const analysisExerciseSchema = z.object({
  ...base,
  kind: z.literal('analysis'),
  /** Type d'artefact (pour l'affichage/l'icône) : log, e-mail, requête… */
  artifactKind: z.enum(['log', 'email', 'http', 'code', 'url']).default('log'),
  /** Lignes de l'artefact (affichées en monospace, sélectionnables). */
  lines: z.array(z.string()).min(2),
  question: z.string().min(1),
  /** Index (0-based) de la ligne fautive. */
  correctLine: z.number().int().min(0),
  explanation: z.string().min(1),
});

/** 3) Construire / ordonner : remettre des étapes dans le bon ordre. */
export const orderExerciseSchema = z.object({
  ...base,
  kind: z.literal('order'),
  prompt: z.string().min(1),
  /** Éléments proposés (présentés mélangés à l'écran). */
  items: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2),
  /** Ordre correct (liste d'ids). */
  correctOrder: z.array(z.string().min(1)).min(2),
  explanation: z.string().min(1),
});

/** 4) Scénario à choix : arbre de décision. */
export const scenarioExerciseSchema = z.object({
  ...base,
  kind: z.literal('scenario'),
  start: z.string().min(1),
  nodes: z.record(
    z.string(),
    z.object({
      text: z.string().min(1),
      /** Choix menant à un autre nœud (absent si nœud terminal). */
      choices: z
        .array(z.object({ text: z.string().min(1), to: z.string().min(1) }))
        .optional(),
      /** Nœud terminal : issue de la décision. */
      outcome: z.enum(['good', 'bad', 'neutral']).optional(),
    }),
  ),
});

export const practiceExerciseSchema = z.discriminatedUnion('kind', [
  terminalExerciseSchema,
  analysisExerciseSchema,
  orderExerciseSchema,
  scenarioExerciseSchema,
]);

export type TerminalExercise = z.infer<typeof terminalExerciseSchema>;
export type AnalysisExercise = z.infer<typeof analysisExerciseSchema>;
export type OrderExercise = z.infer<typeof orderExerciseSchema>;
export type ScenarioExercise = z.infer<typeof scenarioExerciseSchema>;
export type PracticeExercise = z.infer<typeof practiceExerciseSchema>;

export const practiceBankSchema = z.array(practiceExerciseSchema);
