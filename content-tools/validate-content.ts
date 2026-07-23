import { validatePackIntegrity } from '../src/content/integrity';
import { rawPacksByLocale } from '../src/content/packs';
import placementEnRaw from '../src/content/placement/questions.en.json';
import placementRaw from '../src/content/placement/questions.json';
import { placementBankSchema } from '../src/content/placement/schema';
import practiceEnRaw from '../src/content/practice/exercises.en.json';
import practiceRaw from '../src/content/practice/exercises.json';
import missionsEnRaw from '../src/content/practice/missions.en.json';
import missionsRaw from '../src/content/practice/missions.json';
import { missionBankSchema, practiceBankSchema } from '../src/content/practice/schema';
import { contentPackSchema } from '../src/content/schema';
import { validateExercise, validateMission } from '../src/features/practice/logic';

let failed = false;

// Les deux langues sont validées : une traduction cassée doit faire échouer la CI.
const rawPacks = [...rawPacksByLocale.fr, ...rawPacksByLocale.en];

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
for (const [locale, source] of [
  ['fr', placementRaw],
  ['en', placementEnRaw],
] as const) {
const placement = placementBankSchema.safeParse(source);
if (!placement.success) {
  failed = true;
  console.error(`✖ positionnement (${locale}) : schéma invalide`);
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
  const counts: number[] = [];
  for (let d = 1; d <= 15; d += 1) {
    const count = perDifficulty.get(d) ?? 0;
    counts.push(count);
    if (count < 2) errors.push(`difficulté ${d} : ${count} question(s) (minimum 2)`);
  }
  if (errors.length > 0) {
    failed = true;
    for (const error of errors) console.error(`  ✖ ${error}`);
  } else {
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    console.log(
      `✔ positionnement (${locale}) — ${placement.data.length} questions (difficultés 1-15 : ${min}-${max} par niveau)`,
    );
  }
}
}

// — Banque de pratique -------------------------------------------------------------
for (const [locale, source] of [
  ['fr', practiceRaw],
  ['en', practiceEnRaw],
] as const) {
const practice = practiceBankSchema.safeParse(source);
if (!practice.success) {
  failed = true;
  console.error(`✖ pratique (${locale}) : schéma invalide`);
  for (const issue of practice.error.issues) {
    console.error(`    ${issue.path.join('.') || '(racine)'} — ${issue.message}`);
  }
} else {
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const ex of practice.data) {
    if (seen.has(ex.id)) errors.push(`exercice en double : ${ex.id}`);
    seen.add(ex.id);
    errors.push(...validateExercise(ex));
  }
  if (errors.length > 0) {
    failed = true;
    for (const error of errors) console.error(`  ✖ ${error}`);
  } else {
    const kinds = practice.data.reduce<Record<string, number>>((acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1;
      return acc;
    }, {});
    console.log(
      `✔ pratique (${locale}) — ${practice.data.length} exercices (${Object.entries(kinds)
        .map(([k, n]) => `${k}:${n}`)
        .join(' ')})`,
    );
  }
}
}

// — Missions scénarisées -----------------------------------------------------------
for (const [locale, source, exercisesSource] of [
  ['fr', missionsRaw, practiceRaw],
  ['en', missionsEnRaw, practiceEnRaw],
] as const) {
  const missions = missionBankSchema.safeParse(source);
  if (!missions.success) {
    failed = true;
    console.error(`✖ missions (${locale}) : schéma invalide`);
    for (const issue of missions.error.issues) {
      console.error(`    ${issue.path.join('.') || '(racine)'} — ${issue.message}`);
    }
    continue;
  }
  const exerciseIds = new Set(
    practiceBankSchema.safeParse(exercisesSource).data?.map((e) => e.id) ?? [],
  );
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const mission of missions.data) {
    if (seen.has(mission.id)) errors.push(`mission en double : ${mission.id}`);
    seen.add(mission.id);
    errors.push(...validateMission(mission, exerciseIds));
  }
  if (errors.length > 0) {
    failed = true;
    for (const error of errors) console.error(`  ✖ ${error}`);
  } else {
    console.log(`✔ missions (${locale}) — ${missions.data.length} mission(s)`);
  }
}

// — Parité FR/EN (mêmes ids des deux côtés : la bascule de langue ne casse rien) ----
const parityChecks: [string, { id: string }[], { id: string }[]][] = [
  ['pratique', practiceRaw, practiceEnRaw],
  ['missions', missionsRaw, missionsEnRaw],
];
for (const [label, fr, en] of parityChecks) {
  if (en.length === 0) continue; // traduction pas encore livrée : repli FR assumé
  const frIds = new Set(fr.map((e) => e.id));
  const enIds = new Set(en.map((e) => e.id));
  const missing = [...frIds].filter((id) => !enIds.has(id));
  const extra = [...enIds].filter((id) => !frIds.has(id));
  if (missing.length > 0 || extra.length > 0) {
    failed = true;
    if (missing.length > 0) console.error(`  ✖ ${label} : ids absents en EN — ${missing.join(', ')}`);
    if (extra.length > 0) console.error(`  ✖ ${label} : ids EN sans équivalent FR — ${extra.join(', ')}`);
  } else {
    console.log(`✔ parité FR/EN (${label})`);
  }
}

process.exit(failed ? 1 : 0);
