# Cahier des charges — Leçons Pentaguin (qualité « experts ET débutants »)

Objectif : un cursus cyber où **un expert respecte la justesse** et **un débutant
comprend et prend plaisir**. Toute leçon qui ne remplit pas ces critères est
rejetée par la relecture.

## Public & ton
- Français, avec les **termes techniques anglais gardés tels quels** (phishing, buffer overflow, hash…), définis à leur première apparition.
- Ton clair, direct, concret. Exemples réels. Zéro blabla, zéro cliché « hacker à capuche ».
- Progressif : une leçon de niveau bas ne suppose aucun prérequis ; une leçon de niveau haut peut supposer les niveaux inférieurs.

## Exactitude (non négociable)
- **Aucune approximation fausse.** Chaque affirmation doit être techniquement correcte.
- Pas de mythes (ex. « HTTPS = site sûr », « le Wi-Fi public chiffre tout »).
- Nombres/ports/algos exacts. En cas de nuance, la nommer plutôt que simplifier faux.

## Structure d'une leçon
Une leçon = `title`, `level` (1-15), `estMinutes` (3-8), et une liste de `blocks`.
Bonne recette (4 à 7 blocs) :
1. `text` — accroche + le concept en 2-4 phrases.
2. `text` — le cœur : comment ça marche, pourquoi ça compte.
3. `callout` (`tip` | `warning` | `exam`) — un point saillant (piège courant, réflexe, point clé).
4. `keyterms` — 2 à 5 termes-clés définis en une phrase.
5. `quickcheck` — UNE question de vérification (voir ci-dessous).
Facultatif : un 2e `text` ou `callout` pour un exemple concret.

### Blocs
- `text` : `{ "type":"text", "md":"…" }` — markdown simple (gras `**`, listes `-`). Pas de titres `#`.
- `callout` : `{ "type":"callout", "variant":"tip|warning|exam", "md":"…" }`.
- `keyterms` : `{ "type":"keyterms", "terms":[{"term":"…","def":"…"}] }` (1 à 5).
- `quickcheck` : dans le format de génération, on l'écrit **inline** :
  `{ "type":"quickcheck", "q": { "stem":"…", "choices":[{"id":"a","text":"…"},…3-4…], "correct":"a", "explanation":"…" } }`
  (le script de fusion le convertit en question du pack + référence).

### Question de quickcheck
- Porte sur le contenu de la leçon (vérifie la compréhension, pas un piège hors-sujet).
- 3 ou 4 choix, UNE bonne réponse, distracteurs plausibles (jamais « toutes les réponses »).
- Chaque choix commence par une **majuscule**. `explanation` = 1 phrase qui justifie.

## Thèmes (domaines) et niveaux couverts
| id | thème | niveaux visés |
|----|-------|---------------|
| d-fond | Fondamentaux & hygiène | 1-4 |
| d-net | Réseaux | 3-11 |
| d-crypto | Cryptographie | 5-15 |
| d-web | Sécurité Web & applications | 6-14 |
| d-sys | Systèmes & Active Directory | 7-14 |
| d-threats | Menaces & malwares | 4-13 |
| d-defense | Défense, SOC & réponse à incident | 8-15 |
| d-offensive | Offensive & pentest | 9-15 |

Chaque leçon porte le `level` correspondant à sa difficulté réelle (c'est lui qui
sert à recommander la leçon au bon rang). Un thème couvre une plage de niveaux :
prévoir des leçons faciles ET pointues.

## Checklist de relecture (l'agent-relecteur rejette si un point échoue)
1. Exactitude technique parfaite (aucune erreur factuelle).
2. Bonne réponse du quickcheck réellement correcte ; distracteurs faux mais crédibles.
3. Clarté pour un débutant (au niveau de la leçon) : pas de terme non défini.
4. Profondeur suffisante pour un expert : rien de faux par excès de simplification.
5. Structure respectée (blocs valides, 1 quickcheck, longueur raisonnable).
6. `level` cohérent avec la difficulté réelle du contenu.
7. Français correct (orthographe, accents), termes anglais tels quels.

Tag de tout le contenu de cette phase : `lesson-v1` (relecture Mateo a posteriori).
