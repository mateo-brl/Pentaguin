# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Pentaguin — conventions du repo

App mobile de révision cybersécurité (leçons, quiz, examens blancs), offline-first, contenu en français avec terminologie technique anglaise. Cible v1 : iOS/TestFlight. Pas de labs pratiques, pas de backend en v1 (backend classement/stats prévu en v1.1).

- **Le contenu pédagogique est de la donnée, jamais du code** : `src/content/packs/*/` (JSON), schémas Zod dans `src/content/schema.ts`, cohérence référentielle dans `src/content/integrity.ts`. Validation : `npm run validate:content`. Guide d'autorat : `docs/AUTHORING.md`. Les questions doivent être originales (jamais de dumps d'examens).
- **Toute la monétisation est isolée** dans `src/features/monetization/` + le curseur `src/config/monetization.ts`. Le reste de l'app n'utilise que `isUnlocked()` / les entitlements. Monétisation douce : 1 proposition spontanée max, pas de fausse urgence, pas de dark patterns. `EXPO_PUBLIC_MONETIZATION=off` désactive tout.
- **Repo PUBLIC** : aucun secret, token ou credential committé — tout passe par GitHub Secrets. Les variables `EXPO_PUBLIC_*` sont lisibles dans le bundle JS : jamais de secret dedans.
- **Pas de nouvelle dépendance native** sans nécessité absolue (dev sans Mac, chaque rebuild coûte cher) ; privilégier les changements poussables en OTA via EAS Update. Seule exception planifiée : `react-native-purchases` (jalon M6).
- Commandes : `npm run typecheck` · `npm run lint` · `npm test` · `npm run validate:content`.
