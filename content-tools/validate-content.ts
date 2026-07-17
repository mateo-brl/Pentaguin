import { validatePackIntegrity } from '../src/content/integrity';
import { rawPacks } from '../src/content/packs';
import placementRaw from '../src/content/placement/questions.json';
import { placementBankSchema } from '../src/content/placement/schema';
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

// — Banque de positionnement -------------------------------------------------------
const placement = placementBankSchema.safeParse(placementRaw);
if (!placement.success) {
  failed = true;
  console.error('✖ positionnement : schéma invalide');
  for (const issue of placement.error.issues) {
    console.error(`    ${issue.path.join('.') || '(racine)'} — ${issue.message}`);
  }
} else {
  const errors: string[] = [];
  const seen = new Set<string>();
  const perDifficulty = new Map<number, number>();
  for (const q of placement.data) {
    if (seen.has(q.id)) errors.push(`question de positionnement en double : ${q.id}`);
    seen.add(q.id);
    if (!q.choices.some((c) => c.id === q.correct))
      errors.push(`${q.id} : réponse correcte « ${q.correct} » absente des choix`);
    if (new Set(q.choices.map((c) => c.id)).size !== q.choices.length)
      errors.push(`${q.id} : ids de choix en double`);
    perDifficulty.set(q.difficulty, (perDifficulty.get(q.difficulty) ?? 0) + 1);
  }
  for (let d = 1; d <= 15; d += 1) {
    const count = perDifficulty.get(d) ?? 0;
    if (count !== 2) errors.push(`difficulté ${d} : ${count} question(s) au lieu de 2`);
  }
  if (errors.length > 0) {
    failed = true;
    for (const error of errors) console.error(`  ✖ ${error}`);
  } else {
    console.log(`✔ positionnement — ${placement.data.length} questions (2 par difficulté 1-15)`);
  }
}

process.exit(failed ? 1 : 0);
