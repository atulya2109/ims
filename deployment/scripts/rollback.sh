#!/bin/bash

# IMS Rollback Script
# Rollback to a previous version of the application

set -e  # Exit on error

# Detect project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-deployment/docker/docker-compose.prod.yml}"
IMAGE_NAME="${IMAGE_NAME:-ims-app}"

# Use docker compose v2
DOCKER_COMPOSE="docker compose"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}$1${NC}"
}

# Check if running in project directory
if [ ! -d "$PROJECT_DIR" ]; then
    error "Project directory $PROJECT_DIR does not exist"
fi

cd "$PROJECT_DIR" || error "Failed to change to project directory"

# Function to list available versions
list_versions() {
    info "========================================="
    info "Available versions for rollback:"
    info "========================================="

    # Get current version
    CURRENT_VERSION=$(docker ps --filter "name=ims-app-prod" --format "{{.Image}}" | cut -d: -f2)

    # List all versions
    docker images "${IMAGE_NAME}" --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | grep -v latest | while IFS=$'\t' read -r tag created size; do
        if [ "$tag" = "$CURRENT_VERSION" ]; then
            echo -e "  ${GREEN}✓ $tag${NC} (current) - Created: $created - Size: $size"
        elif [ "$tag" != "TAG" ]; then
            echo "    $tag - Created: $created - Size: $size"
        fi
    done

    info ""
    info "Current version: ${CURRENT_VERSION}"
    info "========================================="
}

# Parse arguments
if [ -z "$1" ]; then
    list_versions
    echo ""
    info "Usage: $0 <version>"
    info "Example: $0 a1b2c3d"
    echo ""
    exit 0
fi

VERSION=$1

# Validate version exists
if ! docker images "${IMAGE_NAME}:${VERSION}" | grep -q "$VERSION"; then
    error "Image ${IMAGE_NAME}:${VERSION} not found"
fi

log "========================================="
log "Starting rollback to version: $VERSION"
log "========================================="

# Get current version for reference
CURRENT_VERSION=$(docker ps --filter "name=ims-app-prod" --format "{{.Image}}" | cut -d: -f2)
log "Current version: $CURRENT_VERSION"

# Confirm rollback
warning "This will rollback from $CURRENT_VERSION to $VERSION"
read -p "Are you sure you want to proceed? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log "Rollback cancelled"
    exit 0
fi

# Update docker-compose with rollback version
log "Updating docker-compose to use version ${VERSION}..."
sed -i.bak "s|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${VERSION}|" "$COMPOSE_FILE"

# Deploy the rollback version
log "Deploying version ${VERSION}..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d || error "Failed to deploy rollback version"

# Wait for health checks
log "Waiting for services to be healthy..."
sleep 10

# Check if app is healthy
HEALTH_CHECK_RETRIES=12
HEALTH_CHECK_INTERVAL=5
for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    APP_HEALTH=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps --format json | grep -o '"Health":"[^"]*"' | grep -o 'healthy' || echo "")

    if [ "$APP_HEALTH" = "healthy" ]; then
        log "Application is healthy!"
        break
    fi

    if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
        error "Application failed health check after $((HEALTH_CHECK_RETRIES * HEALTH_CHECK_INTERVAL)) seconds"
    fi

    log "Waiting for health check... ($i/$HEALTH_CHECK_RETRIES)"
    sleep $HEALTH_CHECK_INTERVAL
done

# Log rollback to history
DEPLOYMENT_LOG="${PROJECT_DIR}/deployments.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - ROLLBACK: Rolled back from ${CURRENT_VERSION} to ${VERSION}" >> "$DEPLOYMENT_LOG"

log "========================================="
log "Rollback completed successfully!"
log "Previous version: ${CURRENT_VERSION}"
log "Current version: ${VERSION}"
log "========================================="

exit 0
