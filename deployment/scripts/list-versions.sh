#!/bin/bash

# IMS Version List Script
# Shows available versions and deployment history

# Detect project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
IMAGE_NAME="${IMAGE_NAME:-ims-app}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$PROJECT_DIR" || exit 1

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Available Docker Images${NC}"
echo -e "${BLUE}=========================================${NC}"

# Get current running version
CURRENT_VERSION=$(docker ps --filter "name=ims-app-prod" --format "{{.Image}}" | cut -d: -f2 2>/dev/null || echo "none")

# List all images
docker images "${IMAGE_NAME}" --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | while IFS=$'\t' read -r tag created size; do
    if [ "$tag" = "$CURRENT_VERSION" ]; then
        echo -e "${GREEN}✓ $tag (running)${NC}\t$created\t$size"
    elif [ "$tag" = "latest" ]; then
        echo -e "${YELLOW}  $tag${NC}\t\t$created\t$size"
    elif [ "$tag" != "TAG" ]; then
        echo "  $tag\t\t$created\t$size"
    else
        echo "$tag\t$created\t$size"
    fi
done

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Deployment History (last 10)${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ -f "$PROJECT_DIR/deployments.log" ]; then
    tail -10 "$PROJECT_DIR/deployments.log"
else
    echo "No deployment history found"
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Usage${NC}"
echo -e "${BLUE}=========================================${NC}"
echo "Rollback to a version:"
echo "  ./deployment/scripts/rollback.sh <version>"
echo ""
echo "Example:"
echo "  ./deployment/scripts/rollback.sh c95301a"
echo ""
