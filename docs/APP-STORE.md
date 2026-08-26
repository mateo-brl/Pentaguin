# Checklist de soumission App Store (Pentaguin)

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
| Identifiant d'installation | Identifiers → Device ID | UUID aléatoire, clé du joueur au classement |
| Sauvegarde de progression | Usage Data → Product Interaction | Leçons, stats de réponses, XP, révisions |
| Rapports d'erreur | Diagnostics → Crash Data | **Non liée à l'identité** : ni compte, ni e-mail |

Les 7 types sont **déclarés et publiés** dans App Store Connect (25/08/2026),
tous en « Fonctionnalité de l'app », aucun en suivi, donc pas d'ATT.
| Historique d'achat | Purchases → Purchase History | Via Apple / RevenueCat |

À NE PAS déclarer : localisation, contacts, photos, santé, diagnostics,
publicité : l'app n'y touche pas.

## Chiffrement

- [x] `ITSAppUsesNonExemptEncryption: false` dans `app.json` (HTTPS standard,
      exempté). Réponse « Non » à la question sur le chiffrement à la soumission.

## Fiche produit

- [x] **Captures d'écran prêtes** : `docs/screenshots/appstore/` — 6 visuels
      (accueil, leçon, terminal à jetons, fin de leçon, pratique Pro, rang) en
      1290×2796, 1320×2868 (6,9") et 1242×2688 (6,5"), chacune rendue
      nativement. Générateur : `docs/screenshots/appstore/generate.py`.
      Fidélité aux écrans réels vérifiée sur appareil le 25/08/2026 (guideline 2.3.3).
- [ ] Description, mots-clés, sous-titre : **prêts à coller** dans
      [docs/ASO.md](ASO.md) (nom, sous-titre, mots-clés et description FR + EN,
      tous calibrés aux limites de caractères). Ne pas écrire « achat unique ».
- [ ] Catégorie : Éducation. Classification par âge : 4+.
- [ ] URL de support (une adresse e-mail suffit : pentaguin@mateobrl.fr).
- [ ] Mentions marques : Pentaguin est indépendant de CompTIA (déjà dit dans
      l'app, à répéter dans la description).

## Produit / achats : abonnement annuel

Modèle retenu : abonnement auto-renouvelable **19,99 $/an**, produit
`pentaguin.pro.yearly`. Procédure détaillée :
**[docs/SUBSCRIPTION-SETUP.md](SUBSCRIPTION-SETUP.md)**.

- [ ] Créer le **groupe d'abonnements** + l'abonnement `pentaguin.pro.yearly`
      (durée 1 an, 19,99 USD).
- [ ] Localisations FR + EN (nom d'affichage + description).
- [x] **Capture d'écran de revue** du paywall (obligatoire pour un abonnement) :
      `docs/screenshots/appstore/paywall-review.png` (1290×2796). Elle montre le
      prix, la durée, la mention de renouvellement automatique, la restauration
      et les liens CGU + confidentialité.
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

## Compte de démonstration pour App Review

L'app est derrière un mur de connexion obligatoire : sans identifiants, la revue
est rejetée d'office (guideline 2.1). L'inscription normale exige un code reçu
par e-mail, qu'un reviewer ne peut pas recevoir. Un compte est donc créé
directement en base, déjà vérifié et sans 2FA.

- Identifiant : **appreview@pentaguin.app** · pseudo **Pingu**
- Mot de passe : **jamais dans ce repo** (public). Il vit uniquement dans
  App Store Connect → Informations sur la revue de l'app.
- État : e-mail vérifié, 2FA désactivée, rang Argent II, 760 XP, série 4 jours,
  43 leçons faites. Volontairement **pas abonné**, pour que le reviewer teste
  l'achat en bac à sable.
- [ ] Renseigner les identifiants dans App Store Connect → **Informations sur la
      revue de l'app** → Connexion requise.

Recréer ou changer le mot de passe :

```bash
ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs \
  create-demo appreview@pentaguin.app <mot-de-passe> Pingu --yes'
node content-tools/demo-snapshot.mjs --rank=5 --streak=4 --xp=760 > /tmp/demo.json
scp /tmp/demo.json mateobrl:/tmp/
ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs \
  set-progress Pingu /tmp/demo.json --yes && rm -f /tmp/demo.json'
```

Note pour le reviewer, à coller dans le champ « Notes » :

> L'app est en français et en anglais (elle suit la langue du système). Le compte
> fourni est déjà connecté à une progression. L'abonnement annuel se teste depuis
> Profil → Pentaguin Pro, ou depuis n'importe quel contenu verrouillé. La partie
> « offensive » est traitée sous un angle défensif et éducatif : aucun outil
> d'attaque n'est fourni, les terminaux sont simulés et sans réseau.

## Gap connu : révocation du jeton Sign in with Apple

Apple demande, à la suppression d'un compte créé via Sign in with Apple, de
révoquer le jeton côté Apple (`POST https://appleid.apple.com/auth/revoke`).
Aujourd'hui `DELETE /v1/me` purge bien toutes les tables mais n'appelle pas
cette API. Ce n'est pas bloquant à tous les coups en revue, mais c'est une
exigence écrite (5.1.1(v)).

Ce qu'il faut pour le faire, dans l'ordre :

1. Côté app, transmettre l'`authorizationCode` renvoyé par
   `expo-apple-authentication` à `POST /v1/auth/apple` (aujourd'hui seul
   l'`identityToken` est envoyé). **Demande un nouveau build.**
2. Côté serveur, échanger ce code contre un `refresh_token`
   (`POST https://appleid.apple.com/auth/token`) et le stocker chiffré.
3. À la suppression, signer un `client_secret` ES256 avec la clé `.p8` Apple
   (team id, key id, client id = bundle id) et appeler `/auth/revoke`.

Secrets requis dans `/etc/pentaguin/env` (jamais dans le repo) :
`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY_P8`.

## Publié le 25/08/2026

**Version 1.1.0, build 23, approuvée par Apple.** Première version publique.
Le mur de connexion est passé en revue sans rejet 5.1.1(i), et la partie
offensive n'a pas soulevé d'objection : les notes de revue ont fait leur
travail, à reprendre telles quelles pour les prochaines versions.

Cette première version part **entièrement gratuite, sans achat intégré** :
vendre suppose d'être déclaré commerçant au sens du DSA, ce qui suppose un
SIRET. L'abonnement `pentaguin.pro.yearly` reste configuré dans App Store
Connect, en « Finaliser avant soumission », prêt à partir avec la version qui
le réactivera.

Pour passer au payant, dans l'ordre : SIRET (et domiciliation si l'adresse
personnelle ne doit pas être publique), statut de commerçant chez Apple,
`enabled: process.env.EXPO_PUBLIC_MONETIZATION !== 'off'` dans
`src/config/monetization.ts`, bloc abonnement réintégré aux descriptions
(voir docs/ASO.md), puis soumission de l'abonnement **avec** la nouvelle version.

## État de la fiche au moment de la soumission

| Élément | État |
|---|---|
| Version | 1.1.0, build **22** attaché |
| Captures | 6 en 1242×2688, dans l'ordre |
| Description / mots-clés / promo | à jour, mention d'abonnement incluse |
| Informations de revue | compte de démo, notes avec justification 5.1.1, capture du paywall jointe |
| Abonnement | `pentaguin.pro.yearly` 19,99 $, « Prêt pour la vérification » |
| Prix et disponibilité | gratuit, 175 pays |
| Classification par âge | 4+ |
| Confidentialité | 7 types déclarés et publiés |

Restent à faire à la main :

- [ ] Fiche de version → « Ajouter pour vérification » → « Brouillons de
      soumission (1) », pour joindre la version au brouillon qui contient déjà
      l'abonnement, puis « Envoyer pour vérification ».
- [ ] Déclaration **DSA** (Informations sur l'app) : statut professionnel ou non,
      obligatoire pour l'UE.
- [ ] Tester le build 22 sur appareil : achat en bac à sable puis restauration.

## Divers

- [x] Sign in with Apple présent (obligatoire dès qu'un autre login social existe).
- [x] Suppression de compte en 1 geste (obligatoire Apple) : écran Compte.
- [x] Icône marketing 1024×1024 opaque (sans alpha).
