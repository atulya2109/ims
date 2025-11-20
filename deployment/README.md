# Deployment

This directory contains all deployment-related files for the IMS application.

## Directory Structure

```
deployment/
├── docker/
│   ├── Dockerfile                    # Multi-stage production build
│   ├── .dockerignore                 # Files to exclude from Docker build
│   ├── docker-compose.dev.yml        # Local development with MongoDB
│   └── docker-compose.prod.yml       # Production deployment (app + MongoDB + webhook)
├── scripts/
│   └── deploy.sh                     # Automated deployment script
├── webhook-listener/
│   ├── Dockerfile                    # Webhook service container
│   ├── index.js                      # Webhook listener implementation
│   └── package.json                  # Dependencies
├── .env.local.example                # Local development environment template
└── .env.production.example           # Production environment template
```

## Quick Start

### Local Development

```bash
# Copy environment file
cp deployment/.env.local.example .env.local

# Start MongoDB
docker-compose -f deployment/docker/docker-compose.dev.yml up -d

# Start Next.js dev server
npm run dev
```

### Production Deployment

See [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for complete setup instructions.

**Quick commands:**
```bash
# On NAS
cp deployment/.env.production.example .env
docker-compose -f deployment/docker/docker-compose.prod.yml up -d

# Manual update
./deployment/scripts/deploy.sh
```

## Files

### Docker
- **Dockerfile** - Optimized multi-stage build for Next.js
- **docker-compose.dev.yml** - Local MongoDB instance
- **docker-compose.prod.yml** - Full production stack

### Scripts
- **deploy.sh** - Pulls latest code, builds, and deploys with zero downtime

### Webhook Listener
- Receives webhooks from GitHub Actions
- Triggers automated deployments
- Only needed for auto-deployment setup

### Environment Templates
- **.env.local.example** - Development defaults
- **.env.production.example** - Production configuration template
