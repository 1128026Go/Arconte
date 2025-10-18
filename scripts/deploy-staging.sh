#!/bin/bash

#################################################
# Deploy to Staging Script
# Automated deployment to staging environment
#################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Arconte - Deploy to Staging${NC}"
echo -e "${GREEN}=====================================${NC}"

# Configuration
STAGING_HOST="${STAGING_HOST:-staging.arconte.app}"
STAGING_USER="${STAGING_USER:-deploy}"
STAGING_PATH="${STAGING_PATH:-/var/www/arconte}"
BRANCH="staging"

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

# Deploy to staging server
step "Deploying to staging server..."
ssh -t $STAGING_USER@$STAGING_HOST << 'ENDSSH'
    set -e

    # Change to project directory
    cd /var/www/arconte

    # Pull latest code
    echo "Pulling latest code..."
    git pull origin staging

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

success "Deployment to staging completed"

# Health check
step "Running health check..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$STAGING_HOST/api/health)

if [ "$HTTP_CODE" = "200" ]; then
    success "Health check passed (HTTP $HTTP_CODE)"
else
    error "Health check failed (HTTP $HTTP_CODE)"
    exit 1
fi

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${GREEN}URL: https://$STAGING_HOST${NC}"
echo -e "${GREEN}=====================================${NC}"
