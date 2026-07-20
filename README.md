# Pentaguin 🐧

> **Apprends la cybersécurité à ton niveau — du débutant à l'expert.**

[![CI](https://github.com/mateo-brl/Pentaguin/actions/workflows/ci.yml/badge.svg)](https://github.com/mateo-brl/Pentaguin/actions/workflows/ci.yml)
![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000?logo=expo)
![Platform iOS](https://img.shields.io/badge/iOS-TestFlight-black?logo=apple)
![License](https://img.shields.io/badge/license-propriétaire-lightgrey)

Application mobile de révision et d'entraînement en cybersécurité : un **test de
positionnement adaptatif** situe ton niveau parmi **15 rangs**, puis l'app
t'oriente vers des **leçons courtes adaptées à ton rang**, des **quiz** avec
explications, et un **classement**. Offline-first, gamifiée, contenu en français
avec la terminologie technique anglaise.

> Pentaguin est une application indépendante. CompTIA®, Security+® et les autres
> marques citées appartiennent à leurs propriétaires respectifs ; aucune
> affiliation ni approbation n'est revendiquée.

---

## ✨ Fonctionnalités

- **Test de positionnement adaptatif** — 30 questions tirées d'une banque de
  **450** (30 par niveau de difficulté). Moteur en escalier asymétrique (corrige
  le biais de devinette des QCM) : erreur moyenne mesurée **~0,6 rang**, à ±1 rang
  dans **~94 %** des cas (mesuré par simulation).
- **15 rangs** — Bronze → Argent → Or → Platine, puis Diamant, Maître, Empereur 🐧.
- **Cursus « thèmes × niveaux »** — 8 thèmes (Fondamentaux, Réseaux, Cryptographie,
  Web, Systèmes & AD, Menaces & malwares, Défense/SOC, Offensive), **64 leçons**
  taguées d'un niveau 1-15. L'onglet Apprendre met en avant les leçons **de ton rang**.
- **Comptes & sécurité** — connexion obligatoire (Sign in with Apple / e-mail),
  vérification d'e-mail, **2FA TOTP**, avatars, réglages (langue, thème, notifs).
- **Classement** — XP quotidien et rang synchronisés, badges par ligue.
- **Offline-first** — l'essentiel vit sur l'appareil (SQLite) ; le compte sert
  d'identité de classement et de synchronisation.
- **Monétisation douce** — freemium généreux (thèmes fondateurs gratuits), achat
  unique isolé et désactivable ; pas de dark patterns.

---

## 🧱 Stack

**App** : Expo SDK 57 (managed) · React Native · TypeScript · expo-router ·
Zustand · expo-sqlite · contenu JSON validé par Zod.

**Backend** (classement, comptes, télémétrie) : **Node 22 pur, zéro dépendance
npm** (`node:http`, `node:sqlite`, `node:crypto`), derrière nginx + WAF, sur
`mateobrl.fr`. Voir [`backend/`](backend/).

**Livraison** : buildé et publié **depuis Linux, sans Mac**, via GitHub Actions
(runner `macos-26`, `eas build --local`) et **mises à jour OTA** (EAS Update).

---

## 🚀 Démarrer

```bash
npm install
npx expo start        # Expo Go ou dev build
```

Scripts qualité (tous exécutés en CI) :

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # expo lint
npm test                 # jest
npm run validate:content # schémas Zod + cohérence + banque de positionnement
```

---

## 🗂️ Structure

```
src/app/                  # routes expo-router (fines, sans logique métier)
  (app)/                  # tout l'app déverrouillé (garde de session + rang)
  sign-in, choose-pseudo, onboarding, placement/  # parcours d'entrée
src/components/           # composants thémés partagés (Button, Row, Avatar, RankBadge…)
src/content/              # CONTENU = DONNÉES (packs JSON + schémas Zod + placement/)
src/features/             # logique par domaine
  account/ rank/ placement/ monetization/ (isolée) telemetry/ toast/ settings/…
src/config/               # curseur gratuit/payant, backend
src/i18n/                 # chaînes UI (fr/en)
content-tools/            # validation du contenu
backend/                  # API Node pur + déploiement systemd/nginx
docs/                     # AUTHORING, AUTHORING-LESSONS, PLAN-RANGS, APP-STORE, BACKUP…
```

---

## 📚 Contenu pédagogique

Le contenu **est de la donnée, jamais du code** : leçons, questions et banque de
positionnement vivent en JSON sous `src/content/`, validés par Zod
(`npm run validate:content`, exécuté en CI). Format et règles :
**[docs/AUTHORING-LESSONS.md](docs/AUTHORING-LESSONS.md)**.

Chaque leçon = blocs (texte, encadré astuce/attention/réflexe, termes-clés, une
question de vérification) + un `level` 1-15 qui pilote l'orientation par rang.

---

## 🔄 CI / Release

- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) — typecheck, lint,
  tests, validation du contenu, sur chaque push/PR. Sans secret.
- **iOS build** ([`.github/workflows/ios-build.yml`](.github/workflows/ios-build.yml))
  — `.ipa` via `eas build --local` sur runner `macos-26` (gratuit sur repo public,
  ne consomme pas le quota EAS), puis upload TestFlight (fastlane). Approbation
  manuelle requise.
- **OTA** ([`.github/workflows/ota-update.yml`](.github/workflows/ota-update.yml))
  — publie le bundle JS/contenu sans rebuild natif.

> ⚠️ **Repo public** : aucun secret committé. Tout passe par GitHub Secrets côté
> CI et `/etc/pentaguin/env` côté serveur.

---

## 🐧 Pourquoi « Pentaguin »

Penetration testing + penguin. Construit sur Linux, servi par un backend Linux,
et guidé par un manchot empereur qui grimpe les rangs avec toi.
