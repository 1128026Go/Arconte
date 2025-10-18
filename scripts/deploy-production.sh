#!/bin/bash

#################################################
# Deploy to Production Script
# Automated deployment to production environment
# INCLUDES BACKUP AND ROLLBACK CAPABILITY
#################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}=====================================${NC}"
echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT${NC}"
echo -e "${RED}=====================================${NC}"

# Configuration
PRODUCTION_HOST="${PRODUCTION_HOST:-arconte.app}"
PRODUCTION_USER="${PRODUCTION_USER:-deploy}"
PRODUCTION_PATH="${PRODUCTION_PATH:-/var/www/arconte}"
BRANCH="main"

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

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Confirmation prompt
echo -e "${BLUE}You are about to deploy to PRODUCTION.${NC}"
echo -e "${BLUE}This will affect live users.${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    error "Deployment cancelled by user."
    exit 0
fi

# Check if we're on the right branch
step "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    error "Not on $BRANCH branch. Current branch: $CURRENT_BRANCH"
    exit 1
fi
success "On $BRANCH branch"

# Check for uncommitted changes
step "Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    error "You have uncommitted changes. Please commit or stash them."
    exit 1
fi
success "No uncommitted changes"

# Pull latest changes
step "Pulling latest changes from remote..."
git pull origin $BRANCH
success "Code updated"

# Run tests locally before deploying
step "Running tests locally..."
cd apps/api_php
if php artisan test --parallel; then
    success "Backend tests passed"
else
    error "Backend tests failed. Deployment aborted."
    exit 1
fi

cd ../web
if npm run test; then
    success "Frontend tests passed"
else
    error "Frontend tests failed. Deployment aborted."
    exit 1
fi

cd ../..

# Tag this release
step "Creating release tag..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TAG="release_$TIMESTAMP"
git tag -a $TAG -m "Production release $TIMESTAMP"
git push origin $TAG
success "Release tagged: $TAG"

# Create backup before deployment
step "Creating backup on production server..."
ssh $PRODUCTION_USER@$PRODUCTION_HOST << 'ENDSSH'
    set -e
    cd /var/www/arconte
    timestamp=$(date +%Y%m%d_%H%M%S)
    mkdir -p ../backups
    tar -czf "../backups/backup_${timestamp}.tar.gz" \
        --exclude='node_modules' \
        --exclude='vendor' \
        --exclude='storage/logs' \
        .
    echo "✅ Backup created: backup_${timestamp}.tar.gz"

    # Backup database
    mkdir -p ~/db_backups
    pg_dump -h localhost -U arconte -d arconte -F c -f ~/db_backups/arconte_${timestamp}.dump
    echo "✅ Database backup created: arconte_${timestamp}.dump"
ENDSSH
success "Backup created"

# Deploy to production server
step "Deploying to production server..."
ssh -t $PRODUCTION_USER@$PRODUCTION_HOST << 'ENDSSH'
    set -e

    # Change to project directory
    cd /var/www/arconte

    # Pull latest code
    echo "Pulling latest code..."
    git pull origin main

    # Backend deployment
    echo "Deploying backend..."
    cd apps/api_php

    # Install dependencies
    composer install --no-dev --optimize-autoloader

    # Put app in maintenance mode
    php artisan down --message="Deploying updates" --retry=60

    # Run migrations
    php artisan migrate --force

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

    # Frontend deployment
    echo "Deploying frontend..."
    cd ../web
    npm ci
    npm run build

    # Restart services
    echo "Restarting services..."
    sudo systemctl restart php8.4-fpm
    sudo systemctl reload nginx

    echo "✅ Deployment completed successfully!"
ENDSSH

success "Deployment to production completed"

# Health check
step "Running health check..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$PRODUCTION_HOST/api/health)

if [ "$HTTP_CODE" = "200" ]; then
    success "Health check passed (HTTP $HTTP_CODE)"
else
    error "Health check failed (HTTP $HTTP_CODE)"
    warning "You may need to rollback. Run: ./scripts/rollback-production.sh"
    exit 1
fi

# Smoke tests
step "Running smoke tests..."
API_RESPONSE=$(curl -s https://$PRODUCTION_HOST/api/health | jq -r '.status' 2>/dev/null || echo "error")
if [ "$API_RESPONSE" = "ok" ]; then
    success "API smoke test passed"
else
    warning "API smoke test failed. Response: $API_RESPONSE"
fi

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✅ Production Deployment Successful!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}URL: https://$PRODUCTION_HOST${NC}"
echo -e "${GREEN}Tag: $TAG${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${YELLOW}Post-deployment checklist:${NC}"
echo "  [ ] Monitor error logs: tail -f apps/api_php/storage/logs/laravel.log"
echo "  [ ] Check queue workers: php artisan queue:monitor"
echo "  [ ] Monitor server resources"
echo "  [ ] Test critical user flows"
