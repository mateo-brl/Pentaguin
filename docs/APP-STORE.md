# Checklist de soumission App Store — Pentaguin

Aide-mémoire pour la première soumission publique (après TestFlight). Ce qui est
déjà fait dans le repo est coché ; le reste sont des actions dans App Store
Connect ou à héberger.

## Politique de confidentialité

- [x] Rédigée : `docs/PRIVACY.md`.
- [x] Résumé consultable dans l'app : Réglages → Confidentialité (`legal.tsx`).
- [x] **Hébergée** et servie par l'API (`backend/privacy.html`, route `GET /privacy`) :
      **https://pentaguin.mateobrl.fr/privacy** (HTTPS, vérifiée 200 text/html).
- [x] **Renseignée dans App Store Connect** → Confidentialité de l'app → Politique
      de confidentialité (17/07/2026).

## App Privacy (« nutrition labels ») à déclarer

Aucune donnée utilisée pour le **suivi (tracking)** → pas de prompt ATT.
Déclarer, toutes « liées à l'identité » et « pour le fonctionnement de l'app » :

| Type de donnée | Catégorie Apple | Notes |
|---|---|---|
| Adresse e-mail | Contact Info → Email Address | Inscription e-mail uniquement |
| Identifiant compte / Apple / Google | Identifiers → User ID | Identité de connexion |
| Pseudo, avatar | User Content → Other User Content | Choisis par l'utilisateur |
| XP / progression classement | Usage Data → Product Interaction | Fonctionnalité, pas d'analytics |
| Historique d'achat | Purchases → Purchase History | Via Apple / RevenueCat |

À NE PAS déclarer : localisation, contacts, photos, santé, diagnostics,
publicité — l'app n'y touche pas.

## Chiffrement

- [x] `ITSAppUsesNonExemptEncryption: false` dans `app.json` (HTTPS standard,
      exempté). Réponse « Non » à la question sur le chiffrement à la soumission.

## Fiche produit

- [ ] **Captures d'écran** 6.7" (iPhone 15/16 Pro Max) et 6.5" — à générer depuis
      le simulateur (Learn, un quiz, un examen, le classement, le profil).
- [ ] Description, mots-clés, sous-titre — **prêts à coller** dans
      [docs/ASO.md](ASO.md) (nom, sous-titre, mots-clés et description FR + EN,
      tous calibrés aux limites de caractères). Ne pas écrire « achat unique ».
- [ ] Catégorie : Éducation. Classification par âge : 4+.
- [ ] URL de support (une adresse e-mail suffit : pentaguin@mateobrl.fr).
- [ ] Mentions marques : Pentaguin est indépendant de CompTIA (déjà dit dans
      l'app, à répéter dans la description).

## Produit / achats — ABONNEMENT ANNUEL

Modèle retenu : abonnement auto-renouvelable **19,99 $/an**, produit
`pentaguin.pro.yearly`. Procédure détaillée :
**[docs/SUBSCRIPTION-SETUP.md](SUBSCRIPTION-SETUP.md)**.

- [ ] Créer le **groupe d'abonnements** + l'abonnement `pentaguin.pro.yearly`
      (durée 1 an, 19,99 USD).
- [ ] Localisations FR + EN (nom d'affichage + description).
- [ ] **Capture d'écran de revue** du paywall (obligatoire pour un abonnement).
- [ ] RevenueCat : rattacher le produit à l'entitlement **`pro:secplus-sy0-701`**
      (déjà utilisé par l'app → aucun code à changer).
- [ ] Joindre le produit à la version lors de la première soumission.
- [x] Paywall conforme guideline 3.1.2 (durée, prix, renouvellement automatique,
      liens CGU + confidentialité, restauration).
- [ ] Tester un achat avec un **compte Sandbox**, puis « Restaurer ».

## Contenu

- [x] **Contenu pédagogique en place** : 64 leçons interactives (FR+EN),
      **514 questions** jouables avec explications, 450 questions de
      positionnement, 32 exercices de pratique, 8 missions, **3 examens blancs**.
      Relu par passe d'audit (aucune erreur factuelle bloquante).

## Divers

- [x] Sign in with Apple présent (obligatoire dès qu'un autre login social existe).
- [x] Suppression de compte en 1 geste (obligatoire Apple) : écran Compte.
- [x] Icône marketing 1024×1024 opaque (sans alpha).
