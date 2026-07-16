#!/usr/bin/env bash
# Déploiement de l'API Pentaguin sur mateobrl.fr (host SSH « mateobrl »).
# Usage : ./backend/deploy/deploy.sh   (depuis la racine du repo)
set -euo pipefail

HOST=mateobrl
APP_DIR=/opt/pentaguin-api

rsync -az --delete -e ssh backend/server.mjs "$HOST:$APP_DIR/"
rsync -az -e ssh backend/deploy/pentaguin-api.service "$HOST:/etc/systemd/system/"
rsync -az -e ssh backend/deploy/nginx-pentaguin.conf "$HOST:/etc/nginx/sites-available/pentaguin.conf"

ssh "$HOST" '
  set -e
  ln -sf /etc/nginx/sites-available/pentaguin.conf /etc/nginx/sites-enabled/pentaguin.conf
  nginx -t
  systemctl reload nginx
  systemctl daemon-reload
  systemctl enable --now pentaguin-api
  systemctl restart pentaguin-api
  sleep 1
  systemctl is-active pentaguin-api
  curl -fsS http://127.0.0.1:3002/healthz && echo
'
echo "Déploiement terminé."
