# Pentaguin — contexte du projet (brief pour assistant IA avec accès au repo)

> À coller comme contexte à un assistant (Claude Desktop) connecté au dépôt.
> Le code est lisible dans le repo : ce document donne surtout **ce qui ne se lit
> pas dans le code** — l'idée, la vision, le pourquoi des choix, l'état
> d'avancement — plus une carte pour savoir où regarder. Rédigé le 20/07/2026.

## L'idée en une phrase

**Pentaguin, c'est une app mobile qui t'apprend et te fait réviser la
cybersécurité à TON niveau — du grand débutant à l'expert — de façon ludique et
concrète.** Un manchot empereur (🐧) t'accompagne pendant que tu grimpes les rangs.
(« Pentaguin » = *penetration testing* + *penguin*.)

## La vision (le « pourquoi »)

L'ambition : le « Duolingo de la cybersécurité ». La plupart des ressources cyber
sont soit trop théoriques, soit réservées aux experts, soit ennuyeuses. Pentaguin
répond à ça avec trois idées fortes :

1. **On te rencontre à ton niveau.** Un **test de positionnement adaptatif** évalue
   ton niveau réel et te place dans un des **15 rangs** (comme les ligues d'un jeu).
   Ensuite l'app **t'oriente vers les cours et exercices de ton rang** — ni trop
   faciles, ni décourageants.
2. **On apprend en faisant.** À côté des leçons courtes, de la **pratique simulée** :
   faux terminal où tu tapes des commandes pour enquêter, logs où repérer l'attaque,
   scénarios de décision, étapes à ordonner. 100 % offline, aucune vraie machine.
3. **On donne envie de revenir.** Rangs, classement entre joueurs, XP, séries, un
   ton clair. Barre de qualité assumée : **qu'un expert respecte la justesse ET
   qu'un débutant prenne plaisir.**

**Public :** étudiants, personnes qui préparent une certif (ex. CompTIA Security+),
passionnés — du niveau zéro à l'expert. **Langue :** contenu en **français**, la
terminologie technique en **anglais** (c'est la langue du métier). L'app est
bilingue FR/EN (langue choisie au premier lancement, modifiable dans Réglages).

## Stratégie — analyse marché (juillet 2026)

À garder en tête pour tout conseil produit/business :

1. **Notre marché réel.** Les chiffres spectaculaires du « marché cyber gamifié »
   (croissance ~52 %, ~51 Md$) concernent la **sensibilisation en entreprise**
   (B2B, type KnowBe4) — **ce n'est PAS notre marché**. Le nôtre, ce sont les
   **apprenants individuels** : voisins directs de TryHackMe / Hack The Box / apps
   de prépa certif. Marché **plus petit et déjà occupé**.
2. **Différenciation principale = le FRANCOPHONE.** L'anglais est un océan rouge
   (App Store saturé, TryHackMe/HTB écrasent tout). Le **français est un désert** :
   quasi personne en app mobile gamifiée offline. Les concurrents FR sont soit de
   l'e-learning institutionnel austère (SecNumacademie/ANSSI), soit des formations
   CPF longues et chères. **C'est notre seul terrain avec un avantage de départ →
   viser le francophone d'abord**, du débutant à l'expert.
3. **Monétisation mixte, pas mono-certif.** La majorité des apps solo gagnent peu.
   Plusieurs leviers complémentaires : **abonnement Pro** pour l'app complète
   (la rétention est le nerf de la guerre) + des **« parcours certif »** (Security+
   et autres) vendus comme packs à forte valeur perçue et décision d'achat rapide.
   ⚠️ **L'achat unique actuel plafonne le revenu par client → à repenser.**
   Toujours dans l'esprit **monétisation douce** (1 proposition max, rien de forcé).
4. **La RÉTENTION est la priorité produit n°1.** C'est le point faible structurel
   des apps « apprendre pour le plaisir ». Séries, rangs, classement, sessions
   courtes, rappels : à soigner **autant que le contenu**.
5. **Atout à exploiter : le contenu est de la DONNÉE** (JSON/Zod) → élargir
   thèmes, niveaux et **langues** coûte peu. Le vrai goulot **n'est pas le code**
   mais la **DÉCOUVRABILITÉ** (SEO App Store, communautés cyber FR, Reddit,
   Discord, YouTube) : à traiter avec autant d'énergie que le produit.

La vision reste **large** (« Duolingo de la cyber », débutant → expert, 8 thèmes) :
la prépa certif est **un levier, pas la seule voie**.

## Qui je suis / mon contexte de dev (non déductible du code)

- Je suis **Mateo**, développeur **solo**, sur **Linux, sans Mac**. C'est une
  contrainte structurante : chaque build natif iOS est coûteux (il passe par un
  runner macOS sur GitHub Actions), donc je **privilégie tout ce qui part en OTA**
  (mises à jour JS/contenu sans rebuild) et j'**évite d'ajouter des dépendances
  natives**.
- Cible **v1 : iOS / TestFlight** (Android reporté). Budget limité, projet perso.
- Le **dépôt est PUBLIC** → **aucun secret n'est committé** (clés, mots de passe,
  tokens passent par des secrets CI ou le fichier serveur `/etc/pentaguin/env`).
- **Monétisation douce** assumée : 1 seule proposition d'achat spontanée max, pas
  de fausse urgence, pas de dark pattern, et tout est désactivable.

## État d'avancement (au 20/07/2026)

**Fonctionne déjà (buildé, en TestFlight, mis à jour en OTA) :**
- Mur de connexion (Apple / e-mail + mot de passe) + **pseudo obligatoire**,
  vérification e-mail, **2FA TOTP**, avatars, écran Compte complet.
- **Test de positionnement** : 20 questions (banque de **450**), moteur adaptatif,
  → un des **15 rangs**.
- **64 leçons** sur **8 thèmes** (Fondamentaux, Réseaux, Crypto, Web, Systèmes/AD,
  Menaces, Défense/SOC, Offensive), calées sur les niveaux ; l'onglet Apprendre met
  en avant les leçons **de ton rang**.
- **32 exercices de pratique** (4 types × 8 thèmes).
- Quiz par thème, cadre d'examen blanc, classement, XP/séries.
- Backend : comptes, classement, télémétrie de crashs, sauvegardes quotidiennes,
  verrouillage anti-brute-force.
- **Freemium** : 2 thèmes gratuits + avant-goût de chaque thème = **28 leçons/64
  gratuites** ; **Pentaguin Pro** = **achat unique** (RevenueCat) pour le reste.
- **Entièrement bilingue FR/EN** : choix de la langue **au premier lancement**,
  modifiable à tout moment dans Réglages. L'interface **ET tout le contenu**
  (64 leçons, 450 questions de positionnement, 32 exercices) existent dans les
  deux langues, avec les mêmes identifiants — changer de langue ne fait perdre ni
  la progression ni le rang.

**Ce qui reste (priorités) :**
- **Rétention** (priorité produit n°1, cf. stratégie) : renforcer séries, rappels,
  sessions courtes, boucles de retour.
- **Découvrabilité / go-to-market francophone** : SEO App Store FR, communautés
  cyber francophones (Reddit, Discord, YouTube) — le vrai goulot.
- **Repenser le modèle de revenus** : abonnement + parcours certif plutôt que le
  seul achat unique (décision business à prendre).
- **Relecture humaine** du contenu généré (tags `lesson-v1`, `placement-v1`,
  `practice-v1`) — rédigé par des agents IA puis relu par d'autres agents, mais
  pas encore par moi.
- **Finitions App Store** pour la sortie publique : questionnaire « App Privacy »,
  captures d'écran, description (à optimiser pour le SEO FR).
- **Google Sign-In** (repoussé, attend un identifiant client Google).
- Examens blancs complets + extension du contenu ; orientation par rang à affiner.

## Décisions et points non évidents (le « pourquoi » des choix)

- **Le contenu est de la DONNÉE, pas du code** (JSON validé par Zod) → on peut le
  corriger et le pousser en OTA sans rebuild.
- **Moteur de rang** : escalier adaptatif *asymétrique* — une mauvaise réponse fait
  plus descendre qu'une bonne ne fait monter, pour corriger le biais de devinette
  des QCM à 4 choix (25 % au hasard). Calé par simulation : erreur ~0,6-0,7 rang.
- **Monétisation isolée** dans un seul module ; le reste de l'app ne connaît que
  « est-ce débloqué ? ». La clé SDK RevenueCat est publique par conception (ce
  n'est pas un secret).
- **Backend en Node pur (zéro dépendance)** : choix de robustesse/sécurité pour un
  repo public et un serveur perso.
- **Pas de vrais labs** (VM/shell root) en v1 : impossible sur mobile/offline sans
  grosse infra → la « pratique » est **simulée** (scriptée), d'où son réalisme
  volontairement limité mais son côté jouable partout.

## Carte du repo (où regarder)

- `AGENTS.md` / `CLAUDE.md` : conventions et règles non négociables du projet.
- `docs/` : `PLAN-RANGS.md` (système de rang), `AUTHORING-LESSONS.md` (cahier des
  charges qualité du contenu), `APP-STORE.md`, `BACKUP.md`, ce fichier.
- `src/content/` : **le contenu = données**. `packs/secplus-sy0-701/` (leçons +
  questions par thème), `placement/` (banque du test de rang), `practice/`
  (exercices), `schema.ts` (schémas Zod). Validation : `npm run validate:content`.
- `src/features/rank/` (rangs + orientation), `placement/` (moteur adaptatif +
  session), `practice/` (logique + lecteur d'exercices), `monetization/` (isolée),
  `account/`, `leaderboard/`.
- `src/app/` : routes expo-router (écrans), dont `(app)/placement/`, `practice/`,
  `domain/`, `lesson/`, `(tabs)/`.
- `backend/` : `server.mjs` (API), `auth.mjs`, `admin.mjs` (CLI d'admin : stats,
  joueurs, reset), `deploy/`.
- Qualité : `npm run typecheck` · `npm run lint` · `npm test` · `npm run validate:content`.

## Comment m'aider (ce que j'attends)

Conseils **concrets et actionnables** sur : stratégie produit & rétention,
marketing/lancement (TestFlight → App Store), pédagogie et structure du contenu,
ergonomie mobile, monétisation éthique, idées de fonctionnalités. Tiens compte des
contraintes : **solo, Linux sans Mac, iOS d'abord, budget limité, monétisation
douce, repo public**. Tu peux lire le code pour les détails d'implémentation.
