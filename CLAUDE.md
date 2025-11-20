# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development (Docker)
- `docker-compose up -d` - Start MongoDB container in background
- `docker-compose down` - Stop MongoDB container
- `docker-compose logs mongodb` - View MongoDB logs
- `docker-compose restart mongodb` - Restart MongoDB container

### Application (Development)
- `npm run dev --turbopack` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Production Deployment (NAS)
- `docker-compose -f docker-compose.prod.yml up -d` - Start all production services
- `docker-compose -f docker-compose.prod.yml down` - Stop all production services
- `docker-compose -f docker-compose.prod.yml logs -f` - View all logs
- `./deploy.sh` - Manual deployment (pulls latest code and redeploys)

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment setup instructions.

## Project Architecture

This is an Inventory Management System (IMS) built with Next.js 15, using the App Router and server-side rendering. The application manages equipment inventory and user data for WiDES organization.

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: MongoDB with connection pooling
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS v4 with CSS variables
- **Data Fetching**: SWR for client-side data management
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Themes**: next-themes for dark/light mode support

### Database Schema
The application uses MongoDB with two main collections:

**equipments collection:**
- `id` (UUID) - Unique identifier
- `name` - Equipment name
- `location` - Storage location
- `quantity` - Total quantity
- `available` - Available quantity
- `unique` - Boolean flag for unique items

**users collection:**
- `id` - User identifier
- `firstName` - User's first name
- `lastName` - User's last name
- `position` - Job position
- `email` - Email address

### Path Aliases
The project uses TypeScript path mapping with `@ims/*` pointing to `./src/*`:
- `@ims/components` → `src/components`
- `@ims/lib` → `src/lib`
- `@ims/hooks` → `src/hooks`

### API Architecture
RESTful API routes follow Next.js App Router conventions:
- `/api/equipments` - CRUD operations for equipment (GET, POST, DELETE)
- `/api/users` - User management (GET, POST)
- `/api/health` - Health check endpoint for monitoring

All API routes use the shared `getDb()` function from `@ims/lib/mongodb` for database connections.

### Component Structure
- **UI Components**: Located in `src/components/ui/` using shadcn/ui pattern
- **Feature Components**: Organized by domain (equipments/, users/)
- **Layout**: Sidebar-based layout with theme provider and navigation
- **State Management**: Client-side state with React hooks and SWR for data fetching

### Key Features
- Equipment inventory management with QR code generation and printing
- Context menu interactions for equipment items
- Bulk selection and deletion functionality
- Responsive sidebar navigation
- Dark/light theme support
- Real-time data updates with SWR

### Environment Configuration

**Local Development:**
1. Copy `.env.local.example` to `.env.local`
2. Start MongoDB: `docker-compose up -d`
3. Default connection: `mongodb://admin:password@localhost:27017/ims?authSource=admin`

**Production Deployment:**
1. On NAS, copy `.env.production.example` to `.env`
2. Update credentials and secrets
3. See [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup

### Deployment

The application uses automated CI/CD for deployment:
- **Push to main branch** → Triggers GitHub Actions → Sends webhook to NAS → Auto-deploys
- **Manual deployment** → Run `./deploy.sh` on NAS
- **Health monitoring** → `/api/health` endpoint checks app and database status

Components:
- `Dockerfile` - Multi-stage build for Next.js app
- `docker-compose.prod.yml` - Production services (app, MongoDB, webhook listener)
- `deploy.sh` - Deployment script with zero-downtime updates
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `webhook-listener/` - Service to receive deployment webhooks

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Initial NAS setup instructions
- GitHub configuration (secrets, webhooks)
- Port forwarding and security
- Troubleshooting guide