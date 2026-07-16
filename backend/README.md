# API Pentaguin (v1.1) — classement et stats

Backend minimal hébergé sur mateobrl.fr : Node 22 pur (**zéro dépendance npm**, SQLite intégré `node:sqlite`), service systemd + vhost nginx interne derrière le WAF SafeLine, comme les autres apps du serveur.

## Endpoints

- `GET /healthz` — sonde de vie.
- `POST /v1/sync` — l'app envoie `{ deviceId, pseudo, days: [{ date: "YYYY-MM-DD", xp }] }`.
  `deviceId` est un UUID anonyme généré par l'app (aucune donnée personnelle), `pseudo` choisi par l'utilisateur (3-20 caractères). L'XP est plafonné côté serveur (2000/jour) et seul le maximum par jour est conservé (idempotent, anti-triche basique).
- `GET /v1/leaderboard?period=all|7d` — top 50 `{ rank, pseudo, xp }`.

## Déploiement

```bash
./backend/deploy/deploy.sh
```

(rsync du fichier serveur + unit systemd + vhost nginx, puis reload/restart — host SSH `mateobrl`, voir `~/.ssh/config`.)

- App : `/opt/pentaguin-api/server.mjs`, port local `127.0.0.1:3002`.
- Données : `/var/lib/pentaguin/pentaguin.db` (SQLite WAL, service en `DynamicUser` + `StateDirectory`).
- Vhost nginx interne : `127.0.0.1:4008` (`pentaguin.conf`).

## Exposition publique — reste à faire (une fois)

1. **DNS (Infomaniak)** : A `pentaguin.mateobrl.fr` → `82.66.208.23`.
2. **SafeLine** (console WAF) : ajouter le site `pentaguin.mateobrl.fr` avec upstream `http://127.0.0.1:4008` + certificat (comme les autres sous-domaines).

## Côté app (à venir)

Écran classement + réglage pseudo + module de sync (`daily_activity` → `/v1/sync`), opt-in : le classement est une option, jamais une obligation.
