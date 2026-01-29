#!/bin/bash
# MongoDB Restore Script

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    echo "Available backups:"
    ls -lh backups/mongodb/mongodb-backup-*.tar.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
BACKUP_FILE="$1"
COMPOSE_FILE="deployment/docker/docker-compose.prod.yml"

cd "$PROJECT_DIR"

# Load .env
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will restore MongoDB from backup and overwrite existing data!"
echo "Backup file: $BACKUP_FILE"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Extract backup
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
BACKUP_NAME=$(ls "$TEMP_DIR")

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Copying backup to container..."
docker compose -f "$COMPOSE_FILE" cp \
    "$TEMP_DIR/$BACKUP_NAME" mongodb:/data/restore/

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Restoring MongoDB..."
docker compose -f "$COMPOSE_FILE" exec -T mongodb mongorestore \
    --username "$MONGO_ROOT_USERNAME" \
    --password "$MONGO_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --drop \
    /data/restore/$BACKUP_NAME

# Cleanup
docker compose -f "$COMPOSE_FILE" exec -T mongodb rm -rf /data/restore/$BACKUP_NAME
rm -rf "$TEMP_DIR"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Restore completed successfully"
