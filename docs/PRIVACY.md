# Politique de confidentialité — Pentaguin

_Dernière mise à jour : 17 juillet 2026_

Pentaguin est une application d'entraînement à la certification en cybersécurité.
Cette politique décrit les données que l'application traite, pourquoi, et les
droits dont tu disposes. Le responsable du traitement est **Mateo Baril**.
Contact : **pentaguin@mateobrl.fr**.

## Ce que nous collectons

Pentaguin est pensée « offline-first » : la majorité de ton usage reste sur ton
appareil. Un compte est **obligatoire** pour utiliser l'application ; il sert
d'identité pour le classement et à retrouver ta progression.

**Données de compte** (sur notre serveur) :

- une **adresse e-mail** (inscription e-mail) **ou** un identifiant fourni par
  **Apple / Google** lors de « Se connecter avec » ; les mots de passe éventuels
  ne sont jamais stockés en clair (hachage scrypt + sel) ;
- un **pseudo** et un **avatar** (icône + couleur), que tu choisis ;
- ton **XP quotidien**, pour le classement et tes statistiques ;
- si tu actives la double authentification, un **secret TOTP**.

**Données sur l'appareil uniquement** (jamais envoyées) :

- ta **progression pédagogique** (leçons terminées, réponses, séries, réglages),
  stockée localement (SQLite) ;
- ton **jeton de session** et ton secret d'authentification, gardés dans le
  trousseau iOS sécurisé.

**Achats** : les achats intégrés sont gérés par **Apple** et **RevenueCat**.
Pentaguin ne voit jamais tes informations de paiement.

## Ce que nous NE collectons pas

Pas de publicité, pas de traceurs tiers, pas d'analytics comportementaux, pas de
revente de données. Aucune géolocalisation, aucun accès aux contacts, photos ou
micro.

## Pourquoi

Les données de compte servent uniquement à : t'authentifier, afficher le
classement, et synchroniser ton XP entre appareils. Base légale : l'exécution du
service que tu demandes.

## Hébergement

Les données de compte sont hébergées sur un serveur privé en France
(domaine mateobrl.fr), derrière un pare-feu applicatif. Les échanges sont
chiffrés en HTTPS.

## Tes droits

- **Accès / rectification** : ton pseudo, ton avatar et ton mot de passe sont
  modifiables dans l'application (Compte, Sécurité).
- **Suppression** : le bouton « Supprimer mon compte » (écran Compte) efface
  définitivement ton compte, ton pseudo, ton avatar et ton historique d'XP.
- Tu peux aussi écrire à **pentaguin@mateobrl.fr** pour toute demande.

## Conservation

Les données de compte sont conservées tant que le compte existe. Elles sont
supprimées immédiatement à la suppression du compte.

## Enfants

Pentaguin ne s'adresse pas aux enfants de moins de 13 ans et ne collecte pas
sciemment leurs données.

## Modifications

Cette politique peut évoluer ; la date en tête de document indique la dernière
mise à jour.
