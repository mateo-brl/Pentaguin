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
