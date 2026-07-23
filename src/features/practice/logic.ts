import type { PracticeExercise, PracticeMission, TerminalExercise } from '@/content/practice';

/** La commande saisie satisfait-elle l'étape courante du terminal ? */
export function matchTerminalStep(input: string, step: TerminalExercise['steps'][number]): boolean {
  try {
    return new RegExp(step.expect, 'i').test(input.trim());
  } catch {
    return false;
  }
}

/** La séquence proposée correspond-elle exactement à l'ordre attendu ? */
export function isCorrectOrder(sequence: readonly string[], correct: readonly string[]): boolean {
  return sequence.length === correct.length && sequence.every((id, i) => id === correct[i]);
}

/**
 * Vérifie la cohérence d'un exercice (utilisé par la validation de contenu) :
 * renvoie la liste des problèmes (vide si l'exercice est bon).
 */
export function validateExercise(ex: PracticeExercise): string[] {
  const errs: string[] = [];
  switch (ex.kind) {
    case 'terminal':
      ex.steps.forEach((s, i) => {
        try {
          new RegExp(s.expect);
        } catch {
          errs.push(`${ex.id} · étape ${i + 1} : regex invalide`);
          return;
        }
        // Mode composer : la commande construite avec les jetons doit passer.
        if (s.tokens && !matchTerminalStep(s.tokens.join(' '), s)) {
          errs.push(`${ex.id} · étape ${i + 1} : tokens.join(' ') ne satisfait pas expect`);
        }
      });
      break;
    case 'analysis':
      if (ex.correctLine < 0 || ex.correctLine >= ex.lines.length)
        errs.push(`${ex.id} : correctLine hors des lignes`);
      break;
    case 'order': {
      const ids = new Set(ex.items.map((i) => i.id));
      if (ex.correctOrder.length !== ex.items.length)
        errs.push(`${ex.id} : correctOrder n'a pas le même nombre d'éléments que items`);
      for (const id of ex.correctOrder)
        if (!ids.has(id)) errs.push(`${ex.id} : correctOrder référence un id inconnu « ${id} »`);
      if (new Set(ex.correctOrder).size !== ex.correctOrder.length)
        errs.push(`${ex.id} : correctOrder contient des doublons`);
      break;
    }
    case 'scenario': {
      if (!ex.nodes[ex.start]) errs.push(`${ex.id} : nœud de départ « ${ex.start} » absent`);
      let hasEnd = false;
      for (const [nid, node] of Object.entries(ex.nodes)) {
        const terminal = !node.choices || node.choices.length === 0;
        if (terminal && node.outcome) hasEnd = true;
        for (const c of node.choices ?? [])
          if (!ex.nodes[c.to]) errs.push(`${ex.id} · ${nid} : choix vers un nœud inconnu « ${c.to} »`);
      }
      if (!hasEnd) errs.push(`${ex.id} : aucun nœud terminal avec une issue`);
      break;
    }
  }
  return errs;
}

/**
 * Cohérence d'une mission (validation de contenu) : toutes les étapes doivent
 * référencer un exercice existant, sans doublon d'étape.
 */
export function validateMission(mission: PracticeMission, exerciseIds: ReadonlySet<string>): string[] {
  const errs: string[] = [];
  for (const stepId of mission.steps) {
    if (!exerciseIds.has(stepId)) {
      errs.push(`mission ${mission.id} : étape vers un exercice inconnu « ${stepId} »`);
    }
  }
  if (new Set(mission.steps).size !== mission.steps.length) {
    errs.push(`mission ${mission.id} : étapes en double`);
  }
  return errs;
}
