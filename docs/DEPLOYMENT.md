# IMS Deployment Guide

This guide explains how to set up automatic deployment of the IMS application to your NAS.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial NAS Setup](#initial-nas-setup)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### On Your NAS
- Docker and Docker Compose installed
- Git installed
- SSH access configured
- Ports available:
  - `3000` - Application
  - `27017` - MongoDB (internal only)

## Initial NAS Setup

### 1. Clone Repository on NAS

SSH into your NAS and clone the repository:

```bash
# Choose your installation directory
mkdir -p /opt
cd /opt

# Clone the repository
git clone https://github.com/atulya2109/ims.git
cd ims

# Checkout main branch
git checkout main
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp deployment/.env.production.example .env

# Generate secure password
MONGO_PASSWORD=$(openssl rand -base64 32)

# Edit the .env file with your values
nano .env
```

Update the following in `.env`:
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<use generated password>
MONGODB_DB=ims
APP_PORT=3000
NODE_ENV=production
```

### 3. Make Deploy Script Executable

```bash
chmod +x deployment/scripts/deploy.sh
```

### 4. Initial Deployment

Start the services for the first time:

```bash
# Build and start all services
docker-compose -f deployment/docker/docker-compose.prod.yml up -d

# Check logs
docker-compose -f deployment/docker/docker-compose.prod.yml logs -f

# Verify services are running
docker-compose -f deployment/docker/docker-compose.prod.yml ps
```

You should see two containers running:
- `ims-mongodb-prod` - Database
- `ims-app-prod` - Application

### 5. Test the Application

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","database":"connected","environment":"production"}
```

## Deployment

### Manual Deployment

To deploy updates:

```bash
# On your NAS
cd /opt/ims
./deployment/scripts/deploy.sh
```

### Monitor Deployment

Watch deployment logs:

```bash
# Watch deployment logs
tail -f /var/log/ims-deploy.log

# Or watch application logs
docker-compose -f deployment/docker/docker-compose.prod.yml logs -f app
```

## Deployment Flow

When you run the deploy script:

1. **Deploy Script** (`deployment/scripts/deploy.sh`):
   - Pulls latest code from GitHub
   - Builds new Docker images
   - Gracefully stops old containers
   - Starts new containers
   - Runs health checks
   - Cleans up old images

## Troubleshooting

### Deployment Failing

Check deployment logs:
```bash
tail -f /var/log/ims-deploy.log
```

Common issues:
- Git authentication issues
- Docker build failures
- Insufficient disk space
- Port conflicts

### Application Not Starting

Check application logs:
```bash
docker-compose -f deployment/docker/docker-compose.prod.yml logs app
```

Common issues:
- Missing environment variables
- MongoDB connection issues
- Port 3000 already in use

### MongoDB Connection Issues

Check MongoDB logs:
```bash
docker-compose -f deployment/docker/docker-compose.prod.yml logs mongodb
```

Verify connection:
```bash
docker exec -it ims-mongodb-prod mongosh -u admin -p
```

### Health Check Failures

Test the health endpoint:
```bash
curl http://localhost:3000/api/health
```

If it returns 503, check:
- MongoDB is running
- Database credentials are correct
- Network connectivity between containers

## Useful Commands

### View All Logs
```bash
docker-compose -f deployment/docker/docker-compose.prod.yml logs -f
```

### Restart Services
```bash
docker-compose -f deployment/docker/docker-compose.prod.yml restart
```

### Stop All Services
```bash
docker-compose -f deployment/docker/docker-compose.prod.yml down
```

### View Running Containers
```bash
docker-compose -f deployment/docker/docker-compose.prod.yml ps
```

### Access MongoDB Shell
```bash
docker exec -it ims-mongodb-prod mongosh -u admin -p <password> --authenticationDatabase admin
```

### View Deployment History
```bash
cd /opt/ims
git log --oneline -10
```

### Manual Rollback
```bash
cd /opt/ims
git checkout <previous-commit-hash>
./deployment/scripts/deploy.sh
```

## Security Best Practices

1. **Use strong passwords** for MongoDB
2. **Never commit .env to git** - keep credentials secure
3. **Regular backups** of MongoDB data
4. **Monitor logs** for unauthorized access attempts
5. **Keep Docker images updated** regularly
6. **Restrict SSH access** to your NAS

## Backup and Restore

### Automated Backups

The system includes automated backup scripts with rotation.

**Manual Backup:**
```bash
cd ~/opt/ims
./deployment/scripts/backup-mongodb.sh
```

Backups are saved to `backups/mongodb/mongodb-backup-YYYYMMDD-HHMMSS.tar.gz`

**Automated Daily Backups:**

Set up a cron job to run backups automatically:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd ~/opt/ims && ./deployment/scripts/backup-mongodb.sh >> logs/backup.log 2>&1

# Or weekly backup on Sundays at 3 AM
0 3 * * 0 cd ~/opt/ims && ./deployment/scripts/backup-mongodb.sh >> logs/backup.log 2>&1
```

**Backup Retention:**

By default, backups older than 7 days are automatically deleted. To change retention:

```bash
# Set retention to 14 days
RETENTION_DAYS=14 ./deployment/scripts/backup-mongodb.sh
```

Or add to `.env`:
```env
RETENTION_DAYS=14
```

**View Backups:**
```bash
ls -lh backups/mongodb/
```

### Restore from Backup

```bash
# List available backups
./deployment/scripts/restore-mongodb.sh

# Restore from specific backup
./deployment/scripts/restore-mongodb.sh backups/mongodb/mongodb-backup-20260128-020000.tar.gz
```

**Warning:** Restore will overwrite all existing data. You'll be prompted to confirm.

## Support

For issues or questions:
1. Check the logs using commands above
2. Verify environment configuration
3. Test each component individually

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Documentation](https://hub.docker.com/_/mongo)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
