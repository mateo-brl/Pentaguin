# Pentaguin 🐧

Application mobile de révision et d'entraînement en cybersécurité : leçons courtes, quiz avec explications détaillées et examens blancs chronométrés, pour préparer les certifications (CompTIA Security+ en v1) dans les transports — **mobile-first, offline, gamifié**.

> Pentaguin est une application indépendante. CompTIA®, Security+® et les autres marques citées appartiennent à leurs propriétaires respectifs ; aucune affiliation ni approbation n'est revendiquée.

## Stack

Expo (managed workflow) · React Native · TypeScript · expo-router · Zustand · expo-sqlite (données utilisateur) · contenu pédagogique en JSON validé par Zod.

## Démarrer

```bash
npm install
npx expo start        # Expo Go ou dev build
```

Scripts utiles :

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # expo lint
npm test                 # jest
npm run validate:content # valide les packs de contenu (schémas + cohérence)
```

## Structure

```
src/app/                  # routes expo-router (fines, sans logique)
src/components/           # composants thémés partagés
src/content/              # CONTENU PÉDAGOGIQUE (données JSON + schémas + accès)
src/features/             # logique par domaine (monetization/ est isolé et désactivable)
src/config/               # curseur gratuit/payant, réglages produit
src/i18n/                 # chaînes UI (fr/en)
content-tools/            # scripts de validation du contenu
docs/AUTHORING.md         # guide de rédaction du contenu
```

## Contenu pédagogique

Le contenu (leçons, questions, examens) vit dans `src/content/packs/<pack-id>/` sous forme de JSON — jamais dans le code. Voir **[docs/AUTHORING.md](docs/AUTHORING.md)** pour le format, les règles et le workflow d'ajout. `npm run validate:content` tourne en CI et refuse tout contenu invalide.

## CI / Release

- **Quality** (`.github/workflows/quality.yml`) : typecheck, lint, tests, validation du contenu — sur chaque push/PR, sans secrets.
- **iOS build** (`.github/workflows/ios-build.yml`) : build `.ipa` sur runner macOS avec `eas build --local` (gratuit sur repo public, ne consomme pas le quota EAS), puis upload TestFlight via fastlane — déclenchement manuel ou tag `v*`, secrets requis : `EXPO_TOKEN`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_API_KEY_P8_BASE64`.

⚠️ Repo **public** : aucun secret ne doit jamais être committé. Tout passe par GitHub Secrets (voir `.gitignore`).
