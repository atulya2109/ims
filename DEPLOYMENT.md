# IMS Deployment Guide

This guide explains how to set up automatic deployment of the IMS application to your NAS.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial NAS Setup](#initial-nas-setup)
- [GitHub Configuration](#github-configuration)
- [First Deployment](#first-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### On Your NAS
- Docker and Docker Compose installed
- Git installed
- SSH access configured
- Ports available:
  - `3000` - Application
  - `27017` - MongoDB (internal only)
  - `9000` - Webhook listener (must be accessible from internet)

### On GitHub
- Repository: `https://github.com/atulya2109/ims`
- Admin access to configure webhooks and secrets

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
cp .env.production.example .env

# Generate secure passwords
MONGO_PASSWORD=$(openssl rand -base64 32)
WEBHOOK_SECRET=$(openssl rand -hex 32)

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
WEBHOOK_SECRET=<use generated secret>
WEBHOOK_PORT=9000
```

**Important:** Save the `WEBHOOK_SECRET` value - you'll need it for GitHub configuration.

### 3. Make Deploy Script Executable

```bash
chmod +x deploy.sh
```

### 4. Initial Deployment

Start the services for the first time:

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Verify services are running
docker-compose -f docker-compose.prod.yml ps
```

You should see three containers running:
- `ims-mongodb-prod` - Database
- `ims-app-prod` - Application
- `ims-webhook-listener` - Deployment webhook

### 5. Test the Application

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","database":"connected","environment":"production"}
```

## GitHub Configuration

### 1. Add GitHub Secrets

Go to your repository on GitHub:
`https://github.com/atulya2109/ims/settings/secrets/actions`

Add the following secrets:

1. **WEBHOOK_SECRET**
   - Value: The webhook secret from your `.env` file

2. **NAS_WEBHOOK_URL**
   - Value: Your NAS webhook URL (e.g., `http://your-nas-ip:9000` or `https://your-domain.com`)
   - Note: This must be accessible from the internet

3. **APP_URL** (optional, for health checks)
   - Value: Your application URL (e.g., `http://your-nas-ip:3000`)

### 2. Configure GitHub Webhook (Alternative to Actions)

If you prefer webhook-based deployment instead of GitHub Actions:

1. Go to: `https://github.com/atulya2109/ims/settings/hooks`
2. Click "Add webhook"
3. Configure:
   - **Payload URL**: `http://your-nas-ip:9000/webhook`
   - **Content type**: `application/json`
   - **Secret**: Your `WEBHOOK_SECRET` value
   - **Events**: Select "Just the push event"
   - **Active**: Check this box
4. Click "Add webhook"

### 3. Test the Webhook

GitHub will send a ping event. Check your webhook listener logs:

```bash
docker-compose -f docker-compose.prod.yml logs webhook-listener
```

You should see: `Ping received`

## Port Forwarding (if needed)

If your NAS is behind a router, configure port forwarding:

1. Forward external port `9000` to your NAS IP:port `9000`
2. Use your public IP or domain in `NAS_WEBHOOK_URL`
3. Consider using a dynamic DNS service if you don't have a static IP

### Alternative: Reverse Proxy

If you have a reverse proxy (nginx, Caddy, Traefik):

```nginx
# Example nginx configuration
location /webhook {
    proxy_pass http://localhost:9000/webhook;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## First Deployment

### Trigger Automatic Deployment

Simply push changes to the main branch:

```bash
git add .
git commit -m "Test deployment"
git push origin main
```

### Monitor Deployment

On your NAS:

```bash
# Watch deployment logs
tail -f /var/log/ims-deploy.log

# Or watch webhook listener logs
docker-compose -f docker-compose.prod.yml logs -f webhook-listener

# Or watch application logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Manual Deployment

You can also trigger deployment manually:

```bash
# On your NAS
cd /opt/ims
./deploy.sh
```

Or trigger the GitHub Action manually:
1. Go to `https://github.com/atulya2109/ims/actions`
2. Select "Deploy to NAS"
3. Click "Run workflow"

## Deployment Flow

When you push to main:

1. **GitHub Actions** runs (`.github/workflows/deploy.yml`):
   - Runs linting
   - Builds the application
   - Sends webhook to your NAS

2. **Webhook Listener** on NAS receives the webhook:
   - Verifies the signature
   - Triggers `deploy.sh`

3. **Deploy Script** (`deploy.sh`):
   - Pulls latest code from GitHub
   - Builds new Docker images
   - Gracefully stops old containers
   - Starts new containers
   - Runs health checks
   - Cleans up old images

4. **Health Check** workflow (optional):
   - Waits 60 seconds
   - Verifies application is healthy

## Troubleshooting

### Webhook Not Triggering

Check webhook listener logs:
```bash
docker-compose -f docker-compose.prod.yml logs webhook-listener
```

Common issues:
- Port 9000 not accessible from internet
- Incorrect `WEBHOOK_SECRET`
- Firewall blocking connections

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
docker-compose -f docker-compose.prod.yml logs app
```

Common issues:
- Missing environment variables
- MongoDB connection issues
- Port 3000 already in use

### MongoDB Connection Issues

Check MongoDB logs:
```bash
docker-compose -f docker-compose.prod.yml logs mongodb
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
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Stop All Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### View Running Containers
```bash
docker-compose -f docker-compose.prod.yml ps
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
./deploy.sh
```

## Security Best Practices

1. **Use strong passwords** for MongoDB
2. **Keep WEBHOOK_SECRET secure** - never commit to git
3. **Use HTTPS** if exposing webhook to internet (consider reverse proxy with SSL)
4. **Restrict webhook endpoint** to GitHub IP ranges if possible
5. **Regular backups** of MongoDB data
6. **Monitor logs** for unauthorized access attempts
7. **Keep Docker images updated** regularly

## Backup and Restore

### Backup MongoDB
```bash
docker exec ims-mongodb-prod mongodump --username admin --password <password> --authenticationDatabase admin --out /data/backup
docker cp ims-mongodb-prod:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Restore MongoDB
```bash
docker cp ./mongodb-backup ims-mongodb-prod:/data/restore
docker exec ims-mongodb-prod mongorestore --username admin --password <password> --authenticationDatabase admin /data/restore
```

## Support

For issues or questions:
1. Check the logs using commands above
2. Review GitHub Actions runs
3. Verify environment configuration
4. Test each component individually

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [MongoDB Docker Documentation](https://hub.docker.com/_/mongo)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
