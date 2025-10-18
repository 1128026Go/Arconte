#!/bin/bash

# Deployment script for production
# This script deploys the application using docker-compose

set -e

echo "=================================================="
echo "🚀 Arconte Production Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.production file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "Please create .env.production file with production environment variables"
    exit 1
fi

# Copy .env.production to .env for docker-compose
cp .env.production .env

echo -e "${BLUE}📋 Deployment Steps:${NC}"
echo "1. Pull latest images (if using registry)"
echo "2. Stop existing containers"
echo "3. Start new containers"
echo "4. Run migrations"
echo "5. Clear caches"
echo ""

# Ask for confirmation
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Stop existing containers
echo -e "\n${YELLOW}⏹️  Stopping existing containers...${NC}"
docker-compose -f docker-compose.production.yml down

# Start new containers
echo -e "\n${YELLOW}🚀 Starting containers...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Wait for database to be ready
echo -e "\n${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "\n${YELLOW}🔄 Running database migrations...${NC}"
docker-compose -f docker-compose.production.yml exec -T api php artisan migrate --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Migrations failed${NC}"
    exit 1
fi

# Clear and optimize caches
echo -e "\n${YELLOW}🧹 Optimizing application...${NC}"
docker-compose -f docker-compose.production.yml exec -T api php artisan config:cache
docker-compose -f docker-compose.production.yml exec -T api php artisan route:cache
docker-compose -f docker-compose.production.yml exec -T api php artisan view:cache
docker-compose -f docker-compose.production.yml exec -T api php artisan optimize

echo -e "${GREEN}✅ Application optimized${NC}"

# Show running containers
echo -e "\n${YELLOW}📊 Running containers:${NC}"
docker-compose -f docker-compose.production.yml ps

# Show logs
echo -e "\n${BLUE}📝 Showing recent logs (press Ctrl+C to exit):${NC}"
docker-compose -f docker-compose.production.yml logs -f --tail=50

echo -e "\n${GREEN}=================================================="
echo "✅ Deployment completed successfully!"
echo "==================================================${NC}"
