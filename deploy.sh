#!/bin/bash

# IMS Deployment Script for NAS
# This script pulls the latest changes from GitHub and deploys the application

set -e  # Exit on error

# Configuration
PROJECT_DIR="${PROJECT_DIR:-/opt/ims}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
GIT_BRANCH="${GIT_BRANCH:-main}"
LOG_FILE="${LOG_FILE:-/var/log/ims-deploy.log}"

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

# Check if running in project directory
if [ ! -d "$PROJECT_DIR" ]; then
    error "Project directory $PROJECT_DIR does not exist"
fi

cd "$PROJECT_DIR" || error "Failed to change to project directory"

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
    log "Already up to date. No deployment needed."
    exit 0
fi

log "New changes detected. Proceeding with deployment..."
git pull origin "$GIT_BRANCH" || error "Failed to pull changes"

# Check if .env file exists
if [ ! -f ".env" ]; then
    warning ".env file not found. Using .env.production.example as template"
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env
        log "Please update .env file with your production values"
    else
        error "No .env.production.example found. Cannot proceed."
    fi
fi

# Build new images
log "Building Docker images..."
docker-compose -f "$COMPOSE_FILE" build --no-cache || error "Failed to build Docker images"

# Stop current containers gracefully
log "Stopping current containers..."
docker-compose -f "$COMPOSE_FILE" stop || warning "Failed to stop containers gracefully"

# Start new containers
log "Starting new containers..."
docker-compose -f "$COMPOSE_FILE" up -d || error "Failed to start containers"

# Wait for health checks
log "Waiting for services to be healthy..."
sleep 10

# Check if app is healthy
HEALTH_CHECK_RETRIES=12
HEALTH_CHECK_INTERVAL=5
for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
        log "Application is healthy!"
        break
    fi

    if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
        error "Application failed health check after $((HEALTH_CHECK_RETRIES * HEALTH_CHECK_INTERVAL)) seconds"
    fi

    log "Waiting for health check... ($i/$HEALTH_CHECK_RETRIES)"
    sleep $HEALTH_CHECK_INTERVAL
done

# Clean up old images
log "Cleaning up old Docker images..."
docker image prune -f || warning "Failed to prune old images"

# Show running containers
log "Currently running containers:"
docker-compose -f "$COMPOSE_FILE" ps

log "========================================="
log "Deployment completed successfully!"
log "========================================="

exit 0
