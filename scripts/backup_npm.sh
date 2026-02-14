#!/bin/bash
# Nginx Proxy Manager Daily Backup
BACKUP_DIR="/home/ubuntu/backups/npm"
DATA_DIR="/home/ubuntu/puckOff/npm-data"
DATE=$(date +%Y-%m-%d)

mkdir -p $BACKUP_DIR

# Keep last 7 backups
find $BACKUP_DIR -name "npm-backup-*.tar.gz" -mtime +7 -delete

# Create backup
tar -czf "$BACKUP_DIR/npm-backup-$DATE.tar.gz" -C $(dirname $DATA_DIR) $(basename $DATA_DIR)

echo "Backup created: $BACKUP_DIR/npm-backup-$DATE.tar.gz"
