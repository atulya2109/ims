# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev --turbopack` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

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
Requires `.env.local` with:
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name