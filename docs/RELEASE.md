# Pipeline de release Pentaguin (iOS / TestFlight)

Dev sur Linux, sans Mac. Les builds iOS se font sur un runner macOS GitHub Actions (gratuit sur repo public) avec `eas build --local` (ne consomme pas le quota EAS cloud). Le code signing utilise les credentials stockés sur les serveurs EAS ; l'upload TestFlight passe par la clé API App Store Connect.

## Ce qui est déjà configuré (M7)

- Projet EAS : `@matal/pentaguin` (`projectId` dans `app.json`).
- Bundle identifier : `fr.mateobrl.pentaguin`.
- Credentials iOS générés côté EAS : certificat de distribution + provisioning profile.
- Secrets GitHub (repo `mateo-brl/Pentaguin`) :
  - `EXPO_TOKEN` — token robot expo.dev (récupère les credentials de signature).
  - `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_API_KEY_P8_BASE64` — clé API App Store Connect (rôle App Manager).
- Environnement GitHub `release` avec **reviewer obligatoire** : le job d'upload TestFlight attend une approbation manuelle.

## Déclencher un build

- **Manuel** : onglet Actions → « iOS build (EAS local) » → *Run workflow*, ou `gh workflow run ios-build.yml --repo mateo-brl/Pentaguin --ref master`.
- **Par tag** : `git tag v1.0.0 && git push origin v1.0.0`.

Le job `build` produit le `.ipa` (artifact `pentaguin-ios`). Le job `submit` reste en attente jusqu'à ce que tu l'approuves dans l'onglet Actions, puis envoie sur TestFlight via `fastlane pilot`.

## Prérequis App Store Connect (à faire une fois — M8)

1. **Créer la fiche app** (réserve le nom « Pentaguin ») : My Apps → + → New App.
   - Plateforme : iOS · Nom : **Pentaguin** · Langue principale : Français.
   - Bundle ID : `fr.mateobrl.pentaguin` · SKU : `pentaguin-secplus`.
2. **Produit d'achat intégré** (pour la monétisation, M6) : Non-consommable, product ID **`pentaguin.pro.secplus`**. À relier dans RevenueCat à l'entitlement **`pro:secplus-sy0-701`** (doit matcher `packEntitlement()` dans le code).
3. **App Privacy** (Confidentialité de l'app) : voir section dédiée ci-dessous.
4. **Mention non-affiliation** : dans la description App Store, reprendre le disclaimer de l'app (aucune affiliation avec CompTIA). Ne jamais utiliser « CompTIA » ou « Security+ » dans le *nom* de l'app ni les captures, uniquement en usage nominatif dans le texte.

## App Privacy — déclaration (données collectées)

Pentaguin v1 est offline, sans compte, sans analytics. À déclarer :

- **Aucune donnée collectée par l'app elle-même** (progression, streak, réponses : stockés uniquement sur l'appareil en SQLite, jamais envoyés).
- **Achats (via RevenueCat)** : « Purchase History » et un identifiant d'appareil peuvent être traités pour gérer les achats. À marquer **non lié à l'identité de l'utilisateur** et **non utilisé pour le suivi**.
- Pas de publicité, pas de tracking (pas d'`App Tracking Transparency` requis).

> Rappel v1.1 : quand le backend classement/stats arrivera (mateobrl.fr), cette déclaration devra être mise à jour (identifiant de joueur, scores transmis).

## Checklist beta review TestFlight

- [ ] Fiche app créée, nom réservé.
- [ ] Build uploadé et « traité » (Processing terminé).
- [ ] Test Information : email de contact, description du bêta, notes de version.
- [ ] Coordonnées de démo si un contenu payant est testé (préciser que le gratuit est pleinement utilisable).
- [ ] App Privacy remplie.
- [ ] Export compliance : pas de chiffrement propriétaire (utilise uniquement HTTPS/crypto standard) → « exempt ».

## Rotation / révocation d'un secret

- Token Expo : https://expo.dev/settings/access-tokens → révoquer → `gh secret set EXPO_TOKEN`.
- Clé API ASC : App Store Connect → Users and Access → Integrations → révoquer, régénérer, ré-encoder en base64 → `gh secret set ASC_API_KEY_P8_BASE64`.
- Le `.p8` ne se télécharge qu'une fois : ne jamais le committer, le garder hors du repo.
