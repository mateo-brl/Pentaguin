# Checklist de soumission App Store — Pentaguin

Aide-mémoire pour la première soumission publique (après TestFlight). Ce qui est
déjà fait dans le repo est coché ; le reste sont des actions dans App Store
Connect ou à héberger.

## Politique de confidentialité

- [x] Rédigée : `docs/PRIVACY.md`.
- [x] Résumé consultable dans l'app : Réglages → Confidentialité (`legal.tsx`).
- [ ] **Héberger `docs/PRIVACY.md` sur une URL publique** (ex. une page GitHub
      Pages ou mateobrl.fr) et renseigner cette URL dans App Store Connect →
      App Privacy → Privacy Policy URL. **Obligatoire** pour la soumission.

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
- [ ] Description, mots-clés, sous-titre.
- [ ] Catégorie : Éducation. Classification par âge : 4+.
- [ ] URL de support (une adresse e-mail suffit : pentaguin@mateobrl.fr).
- [ ] Mentions marques : Pentaguin est indépendant de CompTIA (déjà dit dans
      l'app, à répéter dans la description).

## Produit / achats

- [x] Produit non-consommable `pentaguin.pro.secplus` configuré + RevenueCat.
- [ ] Cliquer « Ajouter pour vérification » sur le produit (se fait avec la
      première soumission de build public).
- [ ] Ajuster le prix à 9,99 € pile en France si souhaité (Prix → Modifier).

## Contenu

- [ ] **Ajouter le contenu pédagogique** (le pack est vide) : la banque doit être
      suffisante pour que les quiz/examens soient jouables avant la sortie
      publique. Voir `docs/AUTHORING.md`.

## Divers

- [x] Sign in with Apple présent (obligatoire dès qu'un autre login social existe).
- [x] Suppression de compte en 1 geste (obligatoire Apple) : écran Compte.
- [x] Icône marketing 1024×1024 opaque (sans alpha).
