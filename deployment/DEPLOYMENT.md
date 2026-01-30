# IMS Deployment Guide

## Overview

The IMS deployment system uses Docker image versioning with git commit hashes to enable easy rollbacks and version tracking.

## Features

- **Automatic Versioning**: Each deployment is tagged with the git commit hash
- **Rollback Support**: Quickly rollback to any previous version
- **Version History**: Keep last 5 versions for instant rollback
- **Deployment Logging**: Track all deployments and rollbacks in `deployments.log`
- **Health Checks**: Automatic verification after deployment/rollback

## Directory Structure

```
deployment/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.prod.yml
├── scripts/
│   ├── deploy.sh           # Main deployment script
│   ├── rollback.sh          # Rollback to previous version
│   └── list-versions.sh     # List available versions
└── DEPLOYMENT.md            # This file
```

## Deployment Workflow

### 1. Deploy New Version

```bash
cd /path/to/ims
./deployment/scripts/deploy.sh
```

**What happens:**
1. Pulls latest changes from GitHub
2. Gets current git commit hash as version (e.g., `c95301a`)
3. Builds Docker image tagged as `ims-app:c95301a` and `ims-app:latest`
4. Updates `docker-compose.prod.yml` to use versioned image
5. Deploys containers with rolling restart
6. Runs health checks
7. Cleans up old images (keeps last 5 versions)
8. Logs deployment to `deployments.log`

**Output:**
```
[2026-01-30 14:30:00] Starting deployment process...
[2026-01-30 14:30:02] Building version: c95301a
[2026-01-30 14:30:15] Built images: ims-app:c95301a and ims-app:latest
[2026-01-30 14:30:45] Application is healthy!
[2026-01-30 14:30:46] Deployment completed successfully!
Version: c95301a
```

### 2. List Available Versions

```bash
./deployment/scripts/list-versions.sh
```

**Output:**
```
=========================================
Available Docker Images
=========================================
TAG        CREATED              SIZE
✓ c95301a (running)  2 hours ago   450MB
  625b2b1            1 day ago     448MB
  75e6472            2 days ago    447MB
  d7cad2d            3 days ago    445MB
  1a0fb28            4 days ago    445MB

=========================================
Deployment History (last 10)
=========================================
2026-01-28 10:30:00 - Deployed version 1a0fb28 (commit: 1a0fb28 Remove .claude directory)
2026-01-29 14:20:00 - Deployed version d7cad2d (commit: d7cad2d Add log rotation)
2026-01-30 09:15:00 - Deployed version 75e6472 (commit: 75e6472 Add equipment images)
2026-01-30 10:00:00 - Deployed version 625b2b1 (commit: 625b2b1 Fix ESLint errors)
2026-01-30 14:30:00 - Deployed version c95301a (commit: c95301a Fix Next.js 15)
```

### 3. Rollback to Previous Version

```bash
# List versions first (optional)
./deployment/scripts/list-versions.sh

# Rollback to specific version
./deployment/scripts/rollback.sh 625b2b1
```

**Confirmation prompt:**
```
This will rollback from c95301a to 625b2b1
Are you sure you want to proceed? (yes/no):
```

**What happens:**
1. Verifies target version exists
2. Asks for confirmation
3. Updates `docker-compose.prod.yml` to use rollback version
4. Deploys containers with the old image
5. Runs health checks
6. Logs rollback to `deployments.log`

**Rollback time:** ~10-20 seconds (no rebuild required)

### 4. Rollback Without Version (Show Help)

```bash
./deployment/scripts/rollback.sh
```

Shows available versions and usage instructions.

## Configuration

Environment variables (set in `.env` or export before running):

```bash
# Project directory (auto-detected if not set)
PROJECT_DIR=/path/to/ims

# Docker compose file
COMPOSE_FILE=deployment/docker/docker-compose.prod.yml

# Git branch to deploy from
GIT_BRANCH=main

# Docker image name
IMAGE_NAME=ims-app

# Number of old versions to keep
KEEP_VERSIONS=5
```

## Version Management

### How Versioning Works

- **Version Tag**: Short git commit hash (e.g., `c95301a`)
- **Latest Tag**: Always points to most recent deployment
- **Storage**: Images kept in local Docker registry
- **Cleanup**: Old versions pruned automatically (keeps last 5)

### Manual Version Management

```bash
# List all versions
docker images ims-app

# Remove specific version
docker rmi ims-app:625b2b1

# Remove all except last 3
docker images ims-app --format "{{.Tag}}" | grep -v latest | tail -n +4 | \
  xargs -I {} docker rmi ims-app:{}

# Check disk usage
docker system df
```

## Troubleshooting

### Deployment Fails

```bash
# Check logs
tail -100 deploy.log

# Check container logs
docker compose -f deployment/docker/docker-compose.prod.yml logs app

# Check container status
docker compose -f deployment/docker/docker-compose.prod.yml ps
```

### Rollback Fails

```bash
# Verify image exists
docker images ims-app:<version>

# If image deleted, rebuild from that commit
git checkout <version>
./deployment/scripts/deploy.sh
git checkout main
```

### Health Check Fails

```bash
# Test health endpoint directly
curl http://localhost:3000/api/health

# Check MongoDB connectivity
docker exec ims-mongodb-prod mongosh --eval "db.runCommand('ping')"

# View app logs
docker logs ims-app-prod
```

### Out of Disk Space

```bash
# Check disk usage
docker system df

# Remove old versions (keep last 2)
docker images ims-app --format "{{.Tag}}" | grep -v latest | tail -n +3 | \
  xargs -I {} docker rmi ims-app:{}

# Remove unused images, containers, volumes
docker system prune -a --volumes
```

## CI/CD Integration

### Manual Deployment from Local

```bash
# From your development machine
ssh user@nas "cd /path/to/ims && ./deployment/scripts/deploy.sh"
```

### Automated Deployment (Future)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to NAS
        run: |
          ssh ${{ secrets.NAS_USER }}@${{ secrets.NAS_HOST }} \
            "cd /path/to/ims && git pull && ./deployment/scripts/deploy.sh"
```

## Best Practices

1. **Always test locally** before deploying to production
   ```bash
   npm run build  # Test build succeeds
   ```

2. **Check deployment history** before deploying
   ```bash
   ./deployment/scripts/list-versions.sh
   ```

3. **Monitor logs** during deployment
   ```bash
   tail -f deploy.log
   ```

4. **Keep at least 3-5 versions** for safety (configured via `KEEP_VERSIONS`)

5. **Document breaking changes** in commit messages

6. **Backup MongoDB** before major updates
   ```bash
   # See deployment/scripts/backup-mongodb.sh
   ./deployment/scripts/backup-mongodb.sh
   ```

7. **Test rollback procedure** periodically
   ```bash
   # Deploy, then rollback to previous
   ./deployment/scripts/deploy.sh
   ./deployment/scripts/rollback.sh <previous-version>
   ```

## Emergency Procedures

### Complete Rollback

```bash
# 1. Rollback application
./deployment/scripts/rollback.sh <last-known-good-version>

# 2. If database changes were made, restore backup
./deployment/scripts/restore-mongodb.sh <backup-file>
```

### Fresh Deployment

```bash
# 1. Stop all containers
docker compose -f deployment/docker/docker-compose.prod.yml down

# 2. Remove app images
docker images ims-app -q | xargs docker rmi -f

# 3. Deploy fresh
./deployment/scripts/deploy.sh
```

## Support

For issues or questions:
- Check logs: `deploy.log`, `deployments.log`
- Review container logs: `docker logs ims-app-prod`
- Check GitHub issues: https://github.com/atulya2109/ims/issues
