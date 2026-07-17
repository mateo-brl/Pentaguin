#!/usr/bin/env bash
# Sauvegarde quotidienne de la base Pentaguin. Utilise VACUUM INTO (copie
# cohérente, sûre même pendant que l'API écrit, base en WAL), via le même
# node:sqlite que l'app. Rotation sur 14 jours. Lancé par pentaguin-backup.timer.
set -euo pipefail

DB="${DB_PATH:-/var/lib/pentaguin/pentaguin.db}"
DEST_DIR="${BACKUP_DIR:-/var/backups/pentaguin}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

mkdir -p "$DEST_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DEST_DIR/pentaguin-$STAMP.db"

# q = guillemet simple, injecté via charCode pour éviter tout échappement bash.
node --experimental-sqlite -e 'const {DatabaseSync}=require("node:sqlite");const q=String.fromCharCode(39);const db=new DatabaseSync(process.argv[1],{readOnly:true});db.exec("VACUUM INTO "+q+process.argv[2]+q);db.close();' "$DB" "$OUT"

gzip -f "$OUT"
find "$DEST_DIR" -name 'pentaguin-*.db.gz' -mtime +"$KEEP_DAYS" -delete
echo "Sauvegarde OK : $OUT.gz"

# Copie hors-site OPTIONNELLE (ex. NAS sur le LAN), pour une vraie règle 3-2-1.
# Configurée hors repo, dans /etc/pentaguin/env (chargé par le service) :
#   OFFSITE_TARGET="backup@192.168.x.x:/volume1/backups/pentaguin"
#   OFFSITE_SSH_KEY="/etc/pentaguin/backup_key"      # clé dédiée, jamais le mdp admin
# Un échec hors-site n'est qu'un avertissement (la sauvegarde locale est déjà faite).
if [ -n "${OFFSITE_TARGET:-}" ]; then
  RSH="ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
  [ -n "${OFFSITE_SSH_KEY:-}" ] && RSH="$RSH -i ${OFFSITE_SSH_KEY}"
  if rsync -az -e "$RSH" "$OUT.gz" "$OFFSITE_TARGET/"; then
    echo "Copie hors-site OK : $OFFSITE_TARGET"
  else
    echo "AVERTISSEMENT : copie hors-site échouée vers $OFFSITE_TARGET" >&2
  fi
fi
