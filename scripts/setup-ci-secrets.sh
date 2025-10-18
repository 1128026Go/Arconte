#!/bin/bash

#################################################
# Setup GitHub Secrets for CI/CD
# Interactive script to configure all required secrets
#################################################

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}GitHub Secrets Setup for CI/CD${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}GitHub CLI (gh) is not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You are not authenticated with GitHub CLI.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI is installed and authenticated${NC}"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_value

    echo -e "${YELLOW}Setting: $secret_name${NC}"
    echo "  Description: $secret_description"
    read -sp "  Enter value (hidden): " secret_value
    echo ""

    if [ -n "$secret_value" ]; then
        echo "$secret_value" | gh secret set "$secret_name"
        echo -e "${GREEN}  ✓ $secret_name set successfully${NC}"
    else
        echo -e "${YELLOW}  ⚠ Skipped (empty value)${NC}"
    fi
    echo ""
}

echo "This script will help you configure all required GitHub secrets for CI/CD."
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}=== Staging Environment Secrets ===${NC}"
echo ""

set_secret "STAGING_HOST" "Staging server hostname (e.g., staging.arconte.app)"
set_secret "STAGING_USER" "SSH username for staging server (e.g., deploy)"
set_secret "STAGING_SSH_KEY" "SSH private key for staging server"
set_secret "STAGING_PORT" "SSH port for staging server (default: 22)"
set_secret "STAGING_PATH" "Full path to application on staging server (e.g., /var/www/arconte)"
set_secret "STAGING_API_URL" "API URL for staging frontend (e.g., https://staging.arconte.app/api)"

echo ""
echo -e "${BLUE}=== Production Environment Secrets ===${NC}"
echo ""

set_secret "PRODUCTION_HOST" "Production server hostname (e.g., arconte.app)"
set_secret "PRODUCTION_USER" "SSH username for production server (e.g., deploy)"
set_secret "PRODUCTION_SSH_KEY" "SSH private key for production server"
set_secret "PRODUCTION_PORT" "SSH port for production server (default: 22)"
set_secret "PRODUCTION_PATH" "Full path to application on production server (e.g., /var/www/arconte)"
set_secret "PRODUCTION_API_URL" "API URL for production frontend (e.g., https://arconte.app/api)"

echo ""
echo -e "${BLUE}=== Database Secrets (Production) ===${NC}"
echo ""

set_secret "DB_USERNAME" "Production database username"
set_secret "DB_PASSWORD" "Production database password"
set_secret "DB_DATABASE" "Production database name"

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✅ Secrets Setup Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "You can view your secrets at:"
echo "https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
echo ""
echo "Next steps:"
echo "  1. Verify all secrets are set correctly"
echo "  2. Test the CI/CD pipeline by pushing to staging branch"
echo "  3. Review workflow runs at: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
