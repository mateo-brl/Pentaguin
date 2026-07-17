import { z } from 'zod';

/**
 * Banque du quiz de positionnement, indépendante du contenu pédagogique.
 * Chaque question porte une difficulté 1-15 (= le rang qu'elle jauge). Réponse
 * unique. Écrites par Claude (carte blanche), taguées « placement-v1 » pour la
 * relecture de Mateo — questions originales, jamais de dump d'examen.
 */
export const placementQuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  difficulty: z.number().int().min(1).max(15),
  stem: z.string().min(1),
  choices: z
    .array(z.object({ id: z.string().regex(/^[a-d]$/), text: z.string().min(1) }))
    .min(3)
    .max(4),
  /** id de l'unique bonne réponse. */
  correct: z.string().regex(/^[a-d]$/),
  explanation: z.string().min(1).optional(),
  tags: z.array(z.string()).default([]),
});

export type PlacementQuestion = z.infer<typeof placementQuestionSchema>;

export const placementBankSchema = z.array(placementQuestionSchema);
