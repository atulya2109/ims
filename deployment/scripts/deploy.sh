#!/bin/bash

# IMS Deployment Script for NAS
# This script pulls the latest changes from GitHub and deploys the application
# Features: Version tagging, rollback support, deployment history

set -e  # Exit on error

# Detect project directory (use script location if PROJECT_DIR not set)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-deployment/docker/docker-compose.prod.yml}"
GIT_BRANCH="${GIT_BRANCH:-main}"
IMAGE_NAME="${IMAGE_NAME:-ims-app}"
KEEP_VERSIONS="${KEEP_VERSIONS:-5}"

# Use docker compose v2
DOCKER_COMPOSE="docker compose"

# Check if running in project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo "ERROR: Project directory $PROJECT_DIR does not exist"
    exit 1
fi

cd "$PROJECT_DIR" || { echo "ERROR: Failed to change to project directory"; exit 1; }

# Load environment variables first (before logging setup)
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

# Set LOG_FILE default (uses value from .env if present)
LOG_FILE="${LOG_FILE:-$PROJECT_DIR/deploy.log}"

# Create log directory if needed
LOG_DIR=$(dirname "$LOG_FILE")
mkdir -p "$LOG_DIR"

# Rotate log file if it exceeds 10MB
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    MAX_LOG_SIZE=$((10 * 1024 * 1024))  # 10MB

    if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
        # Keep last 3 rotated logs
        [ -f "$LOG_FILE.3" ] && rm -f "$LOG_FILE.3"
        [ -f "$LOG_FILE.2" ] && mv "$LOG_FILE.2" "$LOG_FILE.3"
        [ -f "$LOG_FILE.1" ] && mv "$LOG_FILE.1" "$LOG_FILE.2"
        mv "$LOG_FILE" "$LOG_FILE.1"
        touch "$LOG_FILE"
    fi
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Start deployment
log "========================================="
log "Starting deployment process..."
log "========================================="

# Ensure we're on the correct branch
log "Checking git branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$GIT_BRANCH" ]; then
    warning "Current branch is $CURRENT_BRANCH, expected $GIT_BRANCH. Switching..."
    git checkout "$GIT_BRANCH" || error "Failed to switch to $GIT_BRANCH"
fi

# Pull latest changes
log "Pulling latest changes from GitHub..."
git fetch origin "$GIT_BRANCH" || error "Failed to fetch from origin"

# Check if there are changes
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "@{u}")

if [ "$LOCAL" = "$REMOTE" ]; then
    log "Already up to date."
else
    log "New changes detected. Pulling..."
    git pull origin "$GIT_BRANCH" || error "Failed to pull changes"
fi

log "Proceeding with deployment..."

# Get version from git commit hash
VERSION=$(git rev-parse --short HEAD)
log "Building version: $VERSION"

# Check if .env file was created (if not, create from template)
if [ ! -f ".env" ]; then
    warning ".env file not found. Using .env.production.example as template"
    if [ -f "deployment/.env.production.example" ]; then
        cp deployment/.env.production.example .env
        log "Created .env from template. Please update with your production values"
        # Reload environment variables after creating .env
        set -a
        source .env
        set +a
    else
        error "No .env.production.example found. Cannot proceed."
    fi
fi

# Build new images with version tag
log "Building Docker images..."
docker build -t "${IMAGE_NAME}:${VERSION}" -t "${IMAGE_NAME}:latest" -f deployment/docker/Dockerfile . || error "Failed to build Docker images"
log "Built images: ${IMAGE_NAME}:${VERSION} and ${IMAGE_NAME}:latest"

# Update docker-compose to use versioned image
log "Updating docker-compose to use version ${VERSION}..."
sed -i.bak "s|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${VERSION}|" "$COMPOSE_FILE"

# Deploy with rolling restart (handles stop/start gracefully)
log "Deploying updated containers..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d || error "Failed to deploy containers"

# Wait for health checks
log "Waiting for services to be healthy..."
sleep 10

# Check if app is healthy
HEALTH_CHECK_RETRIES=12
HEALTH_CHECK_INTERVAL=5
for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    # Check if app container is healthy
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

# Clean up old images (keep last N versions)
log "Cleaning up old Docker images (keeping last $KEEP_VERSIONS versions)..."
IMAGES_TO_DELETE=$(docker images "${IMAGE_NAME}" --format "{{.Tag}}" | grep -v latest | tail -n +$((KEEP_VERSIONS + 1)))
if [ -n "$IMAGES_TO_DELETE" ]; then
    echo "$IMAGES_TO_DELETE" | while read -r tag; do
        log "Removing old image: ${IMAGE_NAME}:${tag}"
        docker rmi "${IMAGE_NAME}:${tag}" 2>/dev/null || warning "Failed to remove ${IMAGE_NAME}:${tag}"
    done
else
    log "No old images to clean up"
fi

# Log deployment to history file
DEPLOYMENT_LOG="${PROJECT_DIR}/deployments.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Deployed version ${VERSION} (commit: $(git log -1 --oneline))" >> "$DEPLOYMENT_LOG"

# Show running containers
log "Currently running containers:"
$DOCKER_COMPOSE -f "$COMPOSE_FILE" ps

log "========================================="
log "Deployment completed successfully!"
log "Version: ${VERSION}"
log "Image: ${IMAGE_NAME}:${VERSION}"
log "========================================="

exit 0
