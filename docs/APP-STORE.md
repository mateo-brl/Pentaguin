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

## Divers

- [x] Sign in with Apple présent (obligatoire dès qu'un autre login social existe).
- [x] Suppression de compte en 1 geste (obligatoire Apple) : écran Compte.
- [x] Icône marketing 1024×1024 opaque (sans alpha).
