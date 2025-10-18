#!/bin/bash

# Build script for production deployment
# This script builds both frontend and backend Docker images

set -e

echo "=================================================="
echo "🚀 Arconte Production Build Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "Please create .env.production file with production environment variables"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${YELLOW}📦 Building Docker images...${NC}"

# Build API backend
echo -e "\n${YELLOW}Building API backend...${NC}"
docker build -t arconte-api:latest \
    --build-arg APP_ENV=production \
    -f apps/api_php/Dockerfile \
    apps/api_php

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API backend built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build API backend${NC}"
    exit 1
fi

# Build Web frontend
echo -e "\n${YELLOW}Building Web frontend...${NC}"
docker build -t arconte-web:latest \
    -f apps/web/Dockerfile \
    apps/web

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Web frontend built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Web frontend${NC}"
    exit 1
fi

# Optional: Tag images with version
if [ ! -z "$VERSION" ]; then
    echo -e "\n${YELLOW}Tagging images with version ${VERSION}...${NC}"
    docker tag arconte-api:latest arconte-api:${VERSION}
    docker tag arconte-web:latest arconte-web:${VERSION}
    echo -e "${GREEN}✅ Images tagged with version ${VERSION}${NC}"
fi

echo -e "\n${GREEN}=================================================="
echo "✅ All images built successfully!"
echo "==================================================${NC}"

# Show built images
echo -e "\n${YELLOW}Built images:${NC}"
docker images | grep arconte
