# Sauvegarde de la base Pentaguin

## Ce qui tourne déjà (automatique)

- **Sauvegarde locale quotidienne** à 03h30 (`pentaguin-backup.timer`).
- Chaque sauvegarde est une copie **cohérente** de la base (SQLite `VACUUM INTO`,
  ouverture en lecture seule — ne perturbe jamais l'API), compressée en `.gz`.
- Rangée dans `/var/backups/pentaguin/`, **rotation sur 14 jours**.
- Lancer une sauvegarde à la demande : `systemctl start pentaguin-backup.service`.

## Ajouter une copie hors-site sur le NAS (recommandé — règle 3-2-1)

Le mécanisme est déjà en place dans `backup.sh` ; il suffit de le **configurer**.
On utilise **rsync over SSH avec une clé dédiée** — jamais le mot de passe admin
du NAS (et rien de sensible dans le repo, qui est public).

1. **Sur le NAS** : créer un **utilisateur dédié** (ex. `pentaguin-backup`, PAS
   admin), lui donner accès en écriture à un dossier de sauvegarde, et **activer
   le service rsync/SSH** (Synology : Panneau de config → Services de fichiers →
   rsync ; QNAP : équivalent). Noter l'IP du NAS.

2. **Sur le serveur** (une seule fois), générer une clé dédiée :
   ```sh
   ssh-keygen -t ed25519 -f /etc/pentaguin/backup_key -N ""
   chmod 600 /etc/pentaguin/backup_key
   ```

3. **Autoriser la clé sur le NAS** : ajouter le contenu de
   `/etc/pentaguin/backup_key.pub` aux clés autorisées de l'utilisateur dédié
   (interface du NAS, ou `ssh-copy-id -i /etc/pentaguin/backup_key.pub
   pentaguin-backup@IP_DU_NAS`).

4. **Configurer** (hors repo) dans `/etc/pentaguin/env` :
   ```sh
   OFFSITE_TARGET="pentaguin-backup@IP_DU_NAS:/chemin/vers/backups/pentaguin"
   OFFSITE_SSH_KEY="/etc/pentaguin/backup_key"
   ```

5. **Tester** : `systemctl start pentaguin-backup.service` puis
   `journalctl -u pentaguin-backup.service -n 20`. On doit voir
   « Copie hors-site OK ».

Si `OFFSITE_TARGET` n'est pas défini, seule la sauvegarde locale est faite (aucune
erreur). Un échec de copie hors-site est un simple avertissement.

## Restaurer une sauvegarde

```sh
systemctl stop pentaguin-api
gunzip -c /var/backups/pentaguin/pentaguin-AAAAMMJJ-HHMMSS.db.gz \
  > /var/lib/pentaguin/pentaguin.db
# supprimer d'éventuels résidus WAL de l'ancienne base
rm -f /var/lib/pentaguin/pentaguin.db-wal /var/lib/pentaguin/pentaguin.db-shm
systemctl start pentaguin-api
```

Le fichier décompressé est une base SQLite standard, directement utilisable.
