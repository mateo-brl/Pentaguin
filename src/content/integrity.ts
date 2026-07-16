import type { ContentPack } from './schema';

export type IntegrityReport = { errors: string[]; warnings: string[] };

/**
 * Vérifie la cohérence référentielle d'un pack déjà validé par le schéma Zod :
 * unicité des ids, références croisées (domaines, leçons, questions), règles
 * single/multi. Les manques non bloquants (domaine sans leçon…) sont des warnings.
 */
export function validatePackIntegrity(pack: ContentPack): IntegrityReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const reportDuplicates = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${label} en double : ${id}`);
      seen.add(id);
    }
  };

  reportDuplicates('domaine', pack.domains.map((d) => d.id));
  reportDuplicates('leçon', pack.lessons.map((l) => l.id));
  reportDuplicates('question', pack.questions.map((q) => q.id));
  reportDuplicates('examen', pack.exams.map((e) => e.id));

  const domainIds = new Set(pack.domains.map((d) => d.id));
  const lessonIds = new Set(pack.lessons.map((l) => l.id));
  const questionIds = new Set(pack.questions.map((q) => q.id));

  for (const lesson of pack.lessons) {
    if (!domainIds.has(lesson.domainId)) {
      errors.push(`leçon ${lesson.id} : domaine inconnu « ${lesson.domainId} »`);
    }
    for (const block of lesson.blocks) {
      if (block.type === 'quickcheck' && !questionIds.has(block.questionId)) {
        errors.push(`leçon ${lesson.id} : quickcheck vers une question inconnue « ${block.questionId} »`);
      }
    }
  }

  for (const question of pack.questions) {
    if (!domainIds.has(question.domainId)) {
      errors.push(`question ${question.id} : domaine inconnu « ${question.domainId} »`);
    }
    const choiceIds = new Set(question.choices.map((c) => c.id));
    if (choiceIds.size !== question.choices.length) {
      errors.push(`question ${question.id} : ids de choix en double`);
    }
    for (const correctId of question.correct) {
      if (!choiceIds.has(correctId)) {
        errors.push(`question ${question.id} : réponse correcte « ${correctId} » absente des choix`);
      }
    }
    if (new Set(question.correct).size !== question.correct.length) {
      errors.push(`question ${question.id} : réponses correctes en double`);
    }
    if (question.type === 'single' && question.correct.length !== 1) {
      errors.push(`question ${question.id} : type "single" mais ${question.correct.length} réponses correctes`);
    }
    if (question.type === 'multi' && question.correct.length < 2) {
      errors.push(`question ${question.id} : type "multi" mais moins de 2 réponses correctes`);
    }
    for (const lessonId of question.lessonIds ?? []) {
      if (!lessonIds.has(lessonId)) {
        errors.push(`question ${question.id} : leçon inconnue « ${lessonId} »`);
      }
    }
  }

  for (const domain of pack.domains) {
    if (!pack.lessons.some((l) => l.domainId === domain.id)) {
      warnings.push(`domaine ${domain.code} « ${domain.title} » : aucune leçon`);
    }
    if (!pack.questions.some((q) => q.domainId === domain.id)) {
      warnings.push(`domaine ${domain.code} « ${domain.title} » : aucune question`);
    }
  }

  for (const exam of pack.exams) {
    if (exam.questionCount > pack.questions.length) {
      warnings.push(
        `examen ${exam.id} : ${exam.questionCount} questions demandées, ${pack.questions.length} disponibles dans la banque`,
      );
    }
  }

  return { errors, warnings };
}
