# Abonnement annuel — mise en place (App Store Connect + RevenueCat)

Modèle retenu : **abonnement auto-renouvelable annuel, 19,99 $/an**.
Côté code, tout est déjà en place (`src/config/monetization.ts`, paywall
conforme guideline 3.1.2). Il reste des actions **dans les consoles**, à faire
par Mateo — je n'y ai pas accès.

Identifiant produit attendu par l'app : **`pentaguin.pro.yearly`**

---

## 1. App Store Connect

**Mon app → Monétisation → Abonnements**

1. **Créer un groupe d'abonnements** (ex. nom de référence `Pentaguin Pro`).
   Le groupe sert aux futures offres (mensuel, promo) : un seul groupe suffit,
   un utilisateur ne peut être abonné qu'à un niveau à la fois.
2. **Créer un abonnement** dans ce groupe :
   - ID de produit : `pentaguin.pro.yearly` (exactement)
   - Durée : **1 an**
   - Nom de référence : `Pentaguin Pro annuel`
3. **Tarif** : 19,99 USD → Apple génère automatiquement les prix des autres
   régions (≈ 21,99 € en zone euro selon la grille du moment ; vérifie et ajuste
   la France si tu veux un prix rond).
4. **Localisations** (au moins FR + EN) :
   - FR — Nom d'affichage : `Pentaguin Pro` · Description :
     `Accès complet : les 8 thèmes, 64 leçons, plus de 500 questions, les examens blancs et les missions.`
   - EN — Display name: `Pentaguin Pro` · Description:
     `Full access: all 8 themes, 64 lessons, 500+ questions, mock exams and missions.`
5. **Capture d'écran de revue** : une capture du paywall de l'app (obligatoire).
6. **Informations de revue** : indiquer un compte de test si nécessaire.

⚠️ Le produit doit être **« Prêt à soumettre »** et joint à la version de l'app
lors de la première soumission, sinon la revue le refuse.

## 2. RevenueCat

**Products** → ajouter `pentaguin.pro.yearly` (store : App Store).

**Entitlements** → ouvrir l'entitlement **`pro:secplus-sy0-701`** (il existe
déjà) et **y rattacher le nouveau produit**.

> C'est le point clé : toute la logique de déverrouillage de l'app lit cet
> entitlement (`packEntitlement(packId)`). En rattachant l'abonnement au même
> entitlement, **aucun code ne change** côté gating.

**Offerings** (optionnel mais conseillé) : un offering `default` avec un package
`$rc_annual` pointant sur le produit — utile si tu veux plus tard tester des
prix sans publier de build.

## 3. Vérifier

1. `EXPO_PUBLIC_MONETIZATION` ne doit pas valoir `off`.
2. Build TestFlight → ouvrir le paywall :
   - le prix s'affiche (sinon : produit pas encore « Prêt à soumettre », ou id
     différent → le paywall montre le message « achats indisponibles », sans
     casser l'app) ;
   - l'équivalent mensuel apparaît sous le prix annuel ;
   - les liens **Conditions d'utilisation** et **Confidentialité** s'ouvrent.
3. Acheter avec un **compte Sandbox** (Réglages iOS → App Store → compte
   Sandbox) et vérifier que le contenu Pro se déverrouille, puis « Restaurer ».

## 4. Ce que le paywall affiche déjà (exigences Apple 3.1.2)

- Titre de l'abonnement et ce qu'il contient (chiffres calculés depuis le pack)
- **Durée** (« par an ») et **prix** localisé par le store
- **Équivalent mensuel** indicatif
- **Mention de renouvellement automatique** et comment résilier
- Liens fonctionnels **CGU** (EULA standard Apple) et **Confidentialité**
- **Restaurer mes achats**
- Fermeture en un geste, aucune urgence factice

## 5. Métadonnées : à ne plus écrire

Le modèle a changé : ne plus utiliser « achat unique » / « pas d'abonnement »
dans la description, le texte promotionnel ou les captures. Voir
[docs/ASO.md](ASO.md).

## 6. Honnêteté produit

Un abonnement annuel se justifie si le contenu **continue d'arriver**. Prévois
un rythme (nouvelles questions, nouveaux thèmes, nouveaux packs de certification)
et annonce-le dans la description : c'est ce qui transforme un abonnement en
achat perçu comme juste, et ce qui évite les résiliations en masse au bout d'un an.
