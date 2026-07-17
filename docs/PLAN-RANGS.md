# Plan v1.4 — Rangs (15) & quiz de positionnement

> Statut : **validé par Mateo le 17/07/2026, prêt à exécuter — rien n'est codé.**
> Pour relancer : « exécute le plan PLAN-RANGS ».

## Décisions actées (ne pas re-discuter)

- **Purge totale** des 5 domaines Security+ encore visibles dans « Apprendre »
  (c'est `pack.json` → `domains` qui les affiche, pas les leçons — déjà vides).
- **15 rangs**, du plus faible au meilleur (numérotation interne 1→15, alignée
  sur l'échelle de difficulté) :
  - 1-3 Bronze III / II / I
  - 4-6 Argent III / II / I
  - 7-9 Or III / II / I
  - 10-12 Platine III / II / I
  - 13 **Diamant** · 14 **Maître** · 15 **Empereur** (unique, clin d'œil manchot empereur 🐧)
- **Quiz de positionnement obligatoire** : au tap sur Apprendre OU S'entraîner,
  tant que le rang n'est pas établi. Reprenable en cours de route. Re-passable
  depuis le Profil.
- **~30 vraies questions** de positionnement **écrites par Claude** (carte
  blanche donnée par Mateo), 2 par difficulté 1-15, taguées `placement-v1`
  (relecture Mateo a posteriori). Type `single` uniquement (rapidité).
- **Moteur adaptatif** : ~12 questions posées (~5 min).
- **Le rang va direct au classement** : synchronisé au backend, badge visible
  par tous à côté du pseudo/avatar.
- **Orientation** : champ `level` (1-15) optionnel sur leçons/questions dès
  maintenant ; la logique de recommandation s'activera quand le contenu existera
  (contenu à écrire **avec** Mateo, jamais sans lui).
- **Examens blancs** : mécanique conservée pour plus tard (choix « les deux »).
- Le positionnement se joue **après** la garde de session existante
  (utilisateur déjà connecté + pseudo choisi).

## État des lieux (vérifié dans le code)

- `src/app/(app)/(tabs)/learn.tsx` : liste `pack.domains` → affichera vide après purge, prévoir état vide/garde.
- `src/content/schema.ts` : `domains: z.array(domainSchema).min(1)` → **retirer le `.min(1)`**.
- `src/content/index.ts` : helpers `getDomain/lessonsByDomain/questionsByDomain` — inchangés (tolèrent le vide).
- `src/app/(app)/quiz/setup.tsx` : chips des domaines → **masquer la rangée si 0 domaine**.
- `src/app/(app)/(tabs)/profile.tsx` : section « Progression » mappe les domaines → **masquer si vide**.
- Accueil : tuile défi du jour déjà masquée si banque vide (rien à faire).
- `monetizationConfig.free.domainIds` (`d1`,`d2`) : inoffensif avec 0 domaine, ne pas toucher.
- Composant `Row` : pas de prop `style` (piège connu).
- Nouvelles routes → **régénérer les typed routes** : `CI=1 npx expo start --port <libre>` en arrière-plan (SANS `&`), vérifier `.expo/types/router.d.ts`, puis tuer le process. L'export ne suffit pas.

## Étape 1 — Modèle & purge

- `schema.ts` : `domains` sans `.min(1)` ; `level: z.number().int().min(1).max(15).optional()` sur `lessonSchema` et `questionSchema`.
- `pack.json` : `domains: []`, `version: 4`.
- Écrans : learn (garde/état vide), quiz setup (chips conditionnelles), profil (progression conditionnelle).
- `npm run validate:content` doit passer (warnings OK).

## Étape 2 — Rangs

- `src/features/rank/ranks.ts` : `type RankId = 1..15` ; table `RANKS` (ligue,
  échelon, clé i18n, couleur). Couleurs par ligue en dur (OK light/dark) :
  bronze `#B4713D`, argent `#8E9AAB`, or `#D4A017`, platine `#4FB8A8`,
  diamant `#5AA7F5`, maître `#A78BFA`, empereur `#F0B429` ; fond de pastille =
  `theme.backgroundSelected`.
- Stockage : kv `player_rank` ; `getRank()/setRank()` + hook `useRank()`
  (`useSyncExternalStore`, même pattern que `theme-mode.ts`).
- Composant `RankBadge` (pastille + label) : Accueil (header) + Profil (hero).

## Étape 3 — Banque de positionnement (30 vraies questions)

- `src/content/placement/questions.json` + schéma Zod dédié
  `{ id, difficulty: 1-15, stem, choices (a-f), correct: [1], tags: ['placement-v1'] }`.
- **Écrire 30 questions originales** (2 par difficulté), français + termes
  techniques anglais, jamais de dump d'examen. Progression thématique indicative :
  - 1-3 : hygiène numérique (mots de passe, phishing, MFA, mises à jour)
  - 4-6 : réseau de base (IP/DNS/ports), HTTPS, familles de malwares
  - 7-9 : crypto symétrique/asymétrique, hachage+sel, SQLi/XSS, moindre privilège
  - 10-12 : Active Directory/Kerberos, handshake TLS, buffer overflow, EDR/SIEM
  - 13-15 : pass-the-hash/Kerberoasting, forensique mémoire, side-channel, crypto avancée
- Étendre `content-tools/validate-content.ts` : unicité des ids, `correct` ⊆ choices,
  exactement 2 questions par difficulté 1-15.
- `docs/AUTHORING.md` : section « questions de positionnement » (comment Mateo les remplace/ajuste).

## Étape 4 — Moteur adaptatif (pur, testé)

- `src/features/placement/engine.ts` — fonctions pures :
  - État : `{ currentLevel, stepIndex, askedIds, history }`, sérialisable JSON
    (kv `placement_state`) pour la reprise.
  - Départ niveau 8. Suite de pas : `4, 2, 2, 1, 1, 1…` (12 questions au total).
    Bonne réponse → `+pas`, mauvaise → `−pas`, borné 1..15.
  - Choix de question : non posée, de difficulté la plus proche du niveau
    courant (tie-break : la plus basse ; rng injecté pour les tests).
  - Rang final = `currentLevel` après la 12ᵉ réponse. Tout bon → 15 (Empereur
    atteignable) ; tout faux → 1.
- Tests unitaires (`__tests__/engine.test.ts`) : convergence haute/basse,
  profil moyen → milieu, bornes, déterminisme, sérialisation/reprise.

## Étape 5 — Écrans & garde

- Routes `src/app/(app)/placement/` : `index.tsx` (intro : pitch « Établis ton
  rang, ~5 min », bouton Commencer/Reprendre), `play.tsx` (question type
  QuestionCard mais **sans feedback** bonne/mauvaise — c'est une évaluation ;
  progression `x/12`), `result.tsx` (révélation du rang, animation simple
  scale/fade, CTA → Apprendre).
- Garde : dans `learn.tsx` et `train.tsx`, si `useRank()` est null →
  `<Redirect href="/placement" />` (les tabs restent visibles).
- Profil : ligne « Repasser le test de rang » → reset `placement_state` + `/placement`.
- i18n fr/en complet (section `placement` + noms des ligues dans `ranks`).
- Haptique : tap existant des boutons suffit (pas de succès/erreur pendant le test).

## Étape 6 — Classement (backend + app)

- Backend `server.mjs` : `ALTER TABLE players ADD COLUMN rank INTEGER` (pattern
  try/catch existant) ; `isRank = int 1..15` ; `/v1/sync` accepte `rank`
  optionnel → `UPDATE players SET rank` ; `leaderboard*` sélectionne `p.rank` ;
  réponse `entries[].rank`.
- App : `LeaderboardEntry.rank`, `buildSyncPayload(..., rank)` (+ test),
  badge de rang dans `leaderboard.tsx` à côté de l'avatar.
- Déploiement : `bash backend/deploy/deploy.sh` + vérif curl `/v1/leaderboard`.

## Étape 7 — Orientation (préparation légère)

- Helpers `recommendedLessons(pack, rank)` / `recommendedQuestions(pack, rank)` :
  filtre `level` dans `[rank−1, rank+1]` (à affiner avec le vrai contenu).
- Badge « Recommandé » sur les leçons au bon niveau. Pas plus en v1 : la vraie
  UX d'orientation se fera avec le contenu de Mateo.

## Étape 8 — Livraison (3 incréments, chacun : qualité + CI + commit + OTA)

- **A** : étapes 1-2 (purge + rangs) → OTA.
- **B** : étapes 3-5 (banque + moteur + écrans + garde) → OTA.
- **C** : étape 6 (+7) → déploiement backend + OTA.
- Qualité à chaque incrément : `typecheck` · `lint` · `test` ·
  `validate:content` · export bundle iOS (valide l'arbre de routes).
- Tout est 100 % JS → aucun rebuild natif (build 16 courant).

## Hors périmètre de ce plan

- Contenu pédagogique réel (leçons/exercices par niveau) : **avec Mateo**.
- Questionnaire App Privacy + captures (point #2) : après, « une fois un truc propre ».
- Copie NAS hors-site : NAS injoignable sur le LAN (éteint ?) — mécanisme prêt,
  voir `docs/BACKUP.md`, en attente du NAS.
