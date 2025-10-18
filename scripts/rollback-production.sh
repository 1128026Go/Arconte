#!/bin/bash

#################################################
# Production Rollback Script
# Rollback to previous version from backup
#################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}=====================================${NC}"
echo -e "${RED}⚠️  PRODUCTION ROLLBACK${NC}"
echo -e "${RED}=====================================${NC}"

# Configuration
PRODUCTION_HOST="${PRODUCTION_HOST:-arconte.app}"
PRODUCTION_USER="${PRODUCTION_USER:-deploy}"
PRODUCTION_PATH="${PRODUCTION_PATH:-/var/www/arconte}"

# Function to print step
step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

# Function to print success
success() {
    echo -e "${GREEN}✔ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}✖ $1${NC}"
}

# Confirmation prompt
echo -e "${BLUE}You are about to ROLLBACK production to a previous version.${NC}"
echo -e "${BLUE}This will restore from the latest backup.${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    error "Rollback cancelled by user."
    exit 0
fi

# List available backups
step "Fetching available backups..."
ssh $PRODUCTION_USER@$PRODUCTION_HOST << 'ENDSSH'
    echo "Available backups:"
    ls -lht /var/www/backups/backup_*.tar.gz | head -5
    echo ""
    echo "Latest backup:"
    ls -t /var/www/backups/backup_*.tar.gz | head -1
ENDSSH

read -p "Continue with latest backup? (yes/no): " CONFIRM_BACKUP

if [ "$CONFIRM_BACKUP" != "yes" ]; then
    error "Rollback cancelled."
    exit 0
fi

# Perform rollback
step "Rolling back to latest backup..."
ssh -t $PRODUCTION_USER@$PRODUCTION_HOST << 'ENDSSH'
    set -e

    cd /var/www/arconte

    # Find latest backup
    latest_backup=$(ls -t /var/www/backups/backup_*.tar.gz | head -1)

    if [ -z "$latest_backup" ]; then
        echo "❌ No backup found!"
        exit 1
    fi

    echo "Rolling back to: $latest_backup"

    # Put app in maintenance mode
    cd apps/api_php
    php artisan down --message="Rolling back to previous version" --retry=60

    # Create a backup of current state (just in case)
    cd /var/www/arconte
    timestamp=$(date +%Y%m%d_%H%M%S)
    tar -czf "/var/www/backups/pre_rollback_${timestamp}.tar.gz" \
        --exclude='node_modules' \
        --exclude='vendor' \
        .

    # Extract backup
    echo "Extracting backup..."
    tar -xzf "$latest_backup" -C .

    # Backend rollback
    cd apps/api_php

    # Reinstall dependencies
    composer install --no-dev --optimize-autoloader

    # Run migrations (rollback if needed)
    # php artisan migrate:rollback --force  # Uncomment if needed

    # Clear and cache config
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache

    # Optimize app
    php artisan optimize

    # Restart queue workers
    php artisan queue:restart

    # Bring app back up
    php artisan up

    # Restart services
    echo "Restarting services..."
    sudo systemctl restart php8.4-fpm
    sudo systemctl reload nginx

    echo "✅ Rollback completed!"
ENDSSH

success "Rollback completed"

# Health check
step "Running health check..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$PRODUCTION_HOST/api/health)

if [ "$HTTP_CODE" = "200" ]; then
    success "Health check passed (HTTP $HTTP_CODE)"
else
    error "Health check failed (HTTP $HTTP_CODE)"
    error "Manual intervention required!"
    exit 1
fi

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✅ Rollback Successful!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}URL: https://$PRODUCTION_HOST${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Monitor application logs"
echo "  2. Test critical user flows"
echo "  3. Investigate what caused the need for rollback"
echo "  4. Fix the issue before attempting to deploy again"
