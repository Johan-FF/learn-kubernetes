#!/bin/sh
set -eu

: "${PGHOST:?PGHOST is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"

FILE="/tmp/todos-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"

echo "dumping $PGDATABASE from $PGHOST"
pg_dump --no-owner --no-privileges | gzip > "$FILE"
echo "dump size: $(wc -c < "$FILE") bytes"

echo "uploading to gs://$BACKUP_BUCKET/backups/"
gsutil cp "$FILE" "gs://$BACKUP_BUCKET/backups/"

echo "backup complete"
