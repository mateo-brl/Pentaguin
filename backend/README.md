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

## Exposition publique — IP directe (choix v1.1)

Base URL de l'app : **`http://82.66.208.23:8081`** (HTTP assumé : aucune donnée
sensible — UUID anonyme, pseudo, points ; nécessite l'exception ATS
`NSAllowsArbitraryLoads` côté iOS). nginx écoute en public sur 8081 (ufw ouvert).

**Vérifié joignable depuis l'extérieur** (workflow « Probe » : curl depuis un
runner GitHub → 200 OK) : le serveur est en DMZ, tout le trafic lui parvient.

⚠️ Piège de test : depuis le LAN de la Freebox (PC ou iPhone en Wi-Fi maison),
`http://82.66.208.23:8081` ne répond PAS (pas de hairpin NAT pour le trafic
DMZ). Tester en 4G/5G, ou ajouter une redirection Freebox explicite
8081/tcp → serveur (les redirections explicites, elles, ont le hairpin).

Bascule future en domaine + HTTPS (recommandée avant l'App Store public) :
DNS `pentaguin.mateobrl.fr` chez Infomaniak + site SafeLine → upstream
`http://127.0.0.1:4008` (vhost déjà en place) ; côté app, simple changement
d'URL poussé en OTA.

## Côté app (à venir)

Écran classement + réglage pseudo + module de sync (`daily_activity` → `/v1/sync`), opt-in : le classement est une option, jamais une obligation.
