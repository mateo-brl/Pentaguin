import { validatePackIntegrity } from '../src/content/integrity';
import { rawPacks } from '../src/content/packs';
import { contentPackSchema } from '../src/content/schema';

let failed = false;

for (const raw of rawPacks) {
  const label =
    typeof raw === 'object' && raw !== null && 'id' in raw
      ? String((raw as { id: unknown }).id)
      : '(pack sans id)';
  const parsed = contentPackSchema.safeParse(raw);

  if (!parsed.success) {
    failed = true;
    console.error(`✖ ${label} : schéma invalide`);
    for (const issue of parsed.error.issues) {
      console.error(`    ${issue.path.join('.') || '(racine)'} — ${issue.message}`);
    }
    continue;
  }

  const { errors, warnings } = validatePackIntegrity(parsed.data);
  for (const warning of warnings) console.warn(`  ⚠ ${warning}`);

  if (errors.length > 0) {
    failed = true;
    for (const error of errors) console.error(`  ✖ ${error}`);
  } else {
    const { domains, lessons, questions, exams } = parsed.data;
    console.log(
      `✔ ${parsed.data.id} — ${domains.length} domaines, ${lessons.length} leçons, ${questions.length} questions, ${exams.length} examen(s)`,
    );
  }
}

process.exit(failed ? 1 : 0);
