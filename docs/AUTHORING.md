# Guide d'autorat du contenu Pentaguin

Tout le contenu pédagogique vit dans `src/content/packs/<pack-id>/` sous forme de **JSON pur** — jamais dans le code. Ce guide décrit le format, les règles et le workflow. Le contenu actuel du domaine 1 est un **seed d'exemple** (tags `seed-example`) : à relire, remplacer ou étoffer.

## Règles non négociables

1. **Questions 100 % originales.** Jamais de questions recopiées d'examens réels ou de banques existantes (« dumps ») : c'est illégal, contraire aux accords de certification, et motif de bannissement des stores.
2. **Explication obligatoire** pour chaque question (minimum 20 caractères, mais vise 2 à 4 phrases) : pourquoi la bonne réponse est bonne **et** pourquoi les autres sont fausses.
3. Français avec la **terminologie technique anglaise** conservée (l'examen se passe en anglais) — au premier usage, donner la traduction entre parenthèses.
4. Usage strictement **nominatif** des marques (CompTIA, Security+…) : jamais de logos, jamais de formulation laissant croire à une affiliation.

## Structure des fichiers

```
src/content/packs/secplus-sy0-701/
├── pack.json          # métadonnées + domaines officiels (ne change presque jamais)
├── lessons/
│   └── d1.json        # leçons du domaine d1 (un fichier par domaine)
├── questions/
│   └── d1.json        # questions du domaine d1 (un fichier par domaine)
├── exams.json         # examens blancs
└── index.ts           # assemble le pack — À METTRE À JOUR si tu ajoutes un fichier
```

**Workflow d'ajout :**

1. Édite ou crée le JSON (ex. `lessons/d2.json`).
2. Si c'est un **nouveau fichier** : ajoute son import dans `index.ts` du pack et étends le tableau correspondant (`lessons: [...lessonsD1, ...lessonsD2]`).
3. Lance `npm run validate:content` — corrige jusqu'à obtenir ✔. La CI refuse tout contenu invalide.
4. Incrémente `version` dans `pack.json` à chaque publication de contenu.

## Conventions d'ids

Kebab-case : `d1` (domaine), `l-d1-001` (leçon), `q-d1-001` (question), `exam-1` (examen). Les ids des choix de réponse : lettres `a` à `f`.

## Format d'une leçon

```json
{
  "id": "l-d1-003",
  "domainId": "d1",
  "title": "Titre court et concret",
  "order": 3,
  "estMinutes": 5,
  "blocks": [
    { "type": "text", "md": "Paragraphe en **markdown** léger (gras, italique, listes)." },
    { "type": "callout", "variant": "exam", "md": "Piège ou réflexe utile le jour de l'examen." },
    { "type": "keyterms", "terms": [ { "term": "Terme EN", "def": "Définition FR concise." } ] },
    { "type": "quickcheck", "questionId": "q-d1-003" }
  ]
}
```

- `callout.variant` : `tip` (astuce), `warning` (piège courant), `exam` (réflexe examen).
- `quickcheck` référence une question existante de `questions/` — idéalement une par leçon, en fin de leçon.
- Vise des leçons de **3 à 7 minutes** : c'est une app de transport, pas un manuel.

## Format d'une question

```json
{
  "id": "q-d1-006",
  "domainId": "d1",
  "lessonIds": ["l-d1-003"],
  "type": "single",
  "stem": "Mise en situation concrète se terminant par une question ?",
  "choices": [
    { "id": "a", "text": "…" },
    { "id": "b", "text": "…" },
    { "id": "c", "text": "…" },
    { "id": "d", "text": "…" }
  ],
  "correct": ["b"],
  "explanation": "Pourquoi b est correcte, et pourquoi a, c, d ne le sont pas.",
  "difficulty": 2,
  "tags": ["controles"]
}
```

- `type` : `single` (exactement 1 réponse dans `correct`) ou `multi` (≥ 2 réponses — l'indiquer dans le stem : « Choisissez deux réponses. »).
- `difficulty` : 1 (rappel de cours), 2 (application/scénario), 3 (analyse fine, distracteurs proches).
- `lessonIds` (optionnel) : les leçons qui couvrent la notion — alimente la révision ciblée.
- Style Security+ : privilégier les **mises en situation** (« Une entreprise… ») aux questions de pure définition, avec des distracteurs plausibles de la même famille.

## Ce que vérifie `npm run validate:content`

- Conformité au schéma (`src/content/schema.ts`) : champs, types, formats d'ids.
- Cohérence référentielle (`src/content/integrity.ts`) : ids uniques, domaines/leçons/questions référencés existants, `correct` ⊆ `choices`, règles single/multi.
- **Warnings** (non bloquants) : domaine sans leçon/question, examen demandant plus de questions que la banque n'en contient.

## Objectif de volume pour la v1

~40 leçons et 300 à 400 questions réparties selon les poids officiels des domaines (12 / 22 / 18 / 28 / 20 %), plus 1 à 3 examens blancs. Priorité aux domaines 4 (28 %) et 2 (22 %).
