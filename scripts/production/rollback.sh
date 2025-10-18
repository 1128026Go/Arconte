#!/bin/bash

# Rollback script for production
# This script rolls back to a previous version

set -e

echo "=================================================="
echo "⏪ Arconte Production Rollback Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No version specified${NC}"
    echo "Usage: ./rollback.sh <version>"
    echo "Example: ./rollback.sh v1.0.0"
    exit 1
fi

VERSION=$1

echo -e "${YELLOW}Rolling back to version: ${VERSION}${NC}"

# Ask for confirmation
read -p "Are you sure you want to rollback? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled"
    exit 0
fi

# Stop current containers
echo -e "\n${YELLOW}⏹️  Stopping current containers...${NC}"
docker-compose -f docker-compose.production.yml down

# Pull images with specified version
echo -e "\n${YELLOW}📥 Pulling version ${VERSION}...${NC}"
docker pull arconte-api:${VERSION}
docker pull arconte-web:${VERSION}

# Tag as latest
docker tag arconte-api:${VERSION} arconte-api:latest
docker tag arconte-web:${VERSION} arconte-web:latest

# Start containers
echo -e "\n${YELLOW}🚀 Starting containers with version ${VERSION}...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Run rollback migration
echo -e "\n${YELLOW}🔄 Rolling back last migration batch...${NC}"
docker-compose -f docker-compose.production.yml exec -T api php artisan migrate:rollback --step=1 --force

# Clear caches
echo -e "\n${YELLOW}🧹 Clearing caches...${NC}"
docker-compose -f docker-compose.production.yml exec -T api php artisan cache:clear
docker-compose -f docker-compose.production.yml exec -T api php artisan config:clear
docker-compose -f docker-compose.production.yml exec -T api php artisan route:clear
docker-compose -f docker-compose.production.yml exec -T api php artisan view:clear

echo -e "\n${GREEN}=================================================="
echo "✅ Rollback to version ${VERSION} completed!"
echo "==================================================${NC}"
