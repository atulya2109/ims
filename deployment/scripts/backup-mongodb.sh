#!/bin/bash
# MongoDB Backup Script with automatic rotation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups/mongodb}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"  # Keep last 7 days
COMPOSE_FILE="deployment/docker/docker-compose.prod.yml"

# Load .env
cd "$PROJECT_DIR"
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup filename with timestamp
BACKUP_NAME="mongodb-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting MongoDB backup..."

# Run mongodump inside container
docker compose -f "$COMPOSE_FILE" exec -T mongodb mongodump \
    --username "$MONGO_ROOT_USERNAME" \
    --password "$MONGO_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --out "/data/backup/$BACKUP_NAME"

# Copy backup from container to host
docker compose -f "$COMPOSE_FILE" cp \
    mongodb:/data/backup/$BACKUP_NAME "$BACKUP_PATH"

# Compress backup
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"

# Cleanup old backups (keep only last N days)
find "$BACKUP_DIR" -name "mongodb-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Cleanup backup inside container
docker compose -f "$COMPOSE_FILE" exec -T mongodb rm -rf "/data/backup/$BACKUP_NAME"

BACKUP_SIZE=$(du -h "$BACKUP_PATH.tar.gz" | cut -f1)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_PATH.tar.gz ($BACKUP_SIZE)"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backups older than $RETENTION_DAYS days removed"
