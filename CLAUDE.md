# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a Gantt Chart Queue Planner monorepo with two main applications:

### Dual Implementation Structure

The project contains two complete implementations of the same Gantt planning tool:

1. **Legacy Single-File App** (`app.js`, `index.html`, `styles.css`)
    - Self-contained JavaScript application with localStorage persistence
    - Direct DOM manipulation with drag-and-drop functionality
    - CSV import/export capabilities

2. **Modern React/API Stack** (`apps/web/` and `apps/api/`)
    - React frontend with TypeScript and Vite
    - Fastify API backend with Prisma ORM and SQLite database
    - Shared data model with task assignment positioning system

### Core Domain Model

Both implementations manage the same entities:

- **Tasks**: Work items with name, mandays duration, optional Jira URL and theme
- **Staff**: Team members who can be assigned tasks
- **Assignments**: Task-to-staff relationships with positioning for queue order
- **Themes**: Optional categorization for grouping related tasks

The key concept is sequential task scheduling - tasks assigned to staff members are queued and auto-scheduled based on start date and working day calculations.

## Development Commands

### Monorepo Scripts (from root)

```bash
npm run dev          # Start both API and web in parallel
npm run dev:api      # Start API server only
npm run dev:web      # Start web frontend only
npm run build        # Build both applications
npm start            # Start production API server
```

### API Application (`apps/api/`)

```bash
npm run dev          # Development server with watch mode
npm run build        # TypeScript compilation
npm run start        # Production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
```

### Web Application (`apps/web/`)

```bash
npm run dev          # Vite development server
npm run build        # TypeScript + Vite production build
npm run preview      # Preview production build
```

## Database Management

The API uses Prisma with SQLite for data persistence. The database schema includes:

- Tasks with assignments through a positioning system
- Staff members with task queues
- Share links for public/read-only access
- Decimal positioning for efficient reordering without full reindex

Key Prisma commands are available via npm scripts in the API package.

## API Endpoints

### Core Resources

- `GET/POST /api/staff` - Staff management
- `GET/POST/PATCH/DELETE /api/tasks` - Task CRUD with filtering
- `POST /api/assignments/move` - Task reordering and staff assignment

### Specialized Features

- `GET /api/themes/summary` - Theme-based task aggregation
- `GET /api/export/csv` - CSV export with current task ordering
- `POST /api/share` - Generate shareable view tokens
- `POST /api/admin/clear` - Development data reset

## Key Technical Details

### Task Positioning System

Tasks use decimal positioning within staff queues to enable efficient drag-and-drop reordering without cascading updates. The system leaves gaps (1024-unit increments) and uses fractional positioning for insertions.

### React Frontend Architecture

- Uses @dnd-kit for drag-and-drop interactions
- React Query (@tanstack/react-query) for API state management
- Date-fns for working day calculations
- Papa Parse for CSV handling
- React Router for authentication flow
- Vite with proxy configuration (API at port 4000, web at port 5173)

### API Backend Architecture

- Fastify web framework with TypeScript
- Prisma ORM with SQLite database
- Multi-tenant architecture with User-based data isolation
- Magic link authentication system (development mode logs links to console)
- Zod for request validation with custom error handling
- CORS enabled for cross-origin requests

### Multi-Tenant Data Model

The modern implementation supports multiple users with data isolation:

- User authentication via magic links and verification tokens
- All tasks, staff, and assignments are scoped to user accounts
- Share links for public/read-only access with snapshots
- Database cascading deletes ensure data consistency

### Legacy App Features

The single-file implementation includes advanced features like:

- Theme-based visual coloring with deterministic hue generation
- Inline task editing within the backlog
- Working day axis calculation with weekend skipping
- Local state persistence and CSV import/export

Both implementations support the same core workflow: create tasks and staff, drag tasks onto staff timelines for automatic sequential scheduling.

## Authentication Flow

The modern React app uses a magic link authentication system:

1. User enters email address
2. API generates verification token and logs magic link to console (development)
3. User clicks link to authenticate and receive userId in localStorage
4. Subsequent API requests include userId for data scoping
