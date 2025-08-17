# Gantt API

REST API backend for the Gantt Queue Planner application built with Fastify, TypeScript, and Prisma.

## Purpose

Provides a secure, multi-tenant API for managing Gantt chart data including tasks, staff assignments, and project management with real-time task positioning and magic link authentication.

## Quickstart

```bash
# Install dependencies
npm install

# Set up database
npm run prisma:migrate

# Start development server
npm run dev

# API will be available at http://localhost:4000
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript and generate Prisma client
- `npm run start` - Start production server
- `npm run test` - Run test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## Environment Variables

Create a `.env` file based on the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=4000
FRONTEND_URL="http://localhost:5173"

# Development
NODE_ENV="development"
```

## Architecture

### Tech Stack
- **Framework**: Fastify 4.x with TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: Magic link-based auth with verification tokens
- **Validation**: Zod schemas for request/response validation
- **Logging**: Pino structured logging

### Core Features
- Multi-tenant data isolation by user/project
- Magic link authentication system
- Decimal-based task positioning for efficient reordering
- CSV export functionality
- Share link system for read-only access
- Real-time task assignment and queue management

### API Design
- RESTful endpoints with consistent error handling
- Zod validation at request boundaries
- Structured error responses with machine-friendly codes
- CORS enabled for cross-origin requests

## Key Endpoints

### Authentication
- `POST /api/auth/request-login` - Request magic link
- `POST /api/auth/verify` - Verify token and authenticate
- `GET /api/auth/me` - Get current user info

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks & Staff
- `GET /api/tasks` - List tasks (filterable by staff/unassigned)
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/staff` - List staff members
- `POST /api/staff` - Create staff member
- `DELETE /api/staff/:id` - Delete staff member

### Task Management
- `POST /api/assignments/move` - Move/reorder tasks between staff
- `GET /api/themes/summary` - Get task aggregation by theme
- `GET /api/export/csv` - Export tasks to CSV format

### Sharing
- `POST /api/share` - Create share link for project
- `GET /api/share/:token/*` - Read-only access via share token

## Database Schema

### Key Models
- **User**: Authentication and project ownership
- **Project**: User's Gantt projects with title and metadata
- **Task**: Work items with mandays, themes, dependencies, priorities
- **Staff**: Team members for task assignment
- **Assignment**: Task-to-staff relationships with decimal positioning
- **ShareLink**: Public/read-only access tokens

### Positioning System
Tasks use decimal positioning within staff queues to enable efficient drag-and-drop reordering without cascading database updates. The system automatically leaves gaps (1024-unit increments) and uses fractional positioning for insertions.

## Security & Performance

### Security Features
- User-scoped data access with middleware validation
- Zod schema validation for all inputs
- Structured error handling without data leakage
- CORS configuration for controlled access

### Performance Considerations
- Prisma connection pooling
- Efficient decimal positioning system
- Optimized queries with proper indexing
- Transaction-wrapped multi-step operations

## Testing

Test framework uses Vitest with coverage thresholds:
- Lines: 80%
- Branches: 70%
- Functions: 80%
- Statements: 80%

Run tests with:
```bash
npm test                    # Run tests
npm run test:coverage      # Run with coverage
```

## Troubleshooting

### Common Issues

1. **Database locked error**
   - Stop all running instances
   - Delete `prisma/dev.db-journal` if exists
   - Restart with `npm run dev`

2. **Prisma client out of sync**
   - Run `npm run prisma:generate`
   - Restart the server

3. **Magic link not received**
   - Check console output in development mode
   - Verify `FRONTEND_URL` environment variable

4. **CORS errors**
   - Ensure frontend URL matches `FRONTEND_URL` setting
   - Check browser network tab for specific CORS policy errors

### Development Tips
- Use Prisma Studio: `npx prisma studio` for database inspection
- Check server logs for structured error information
- Use `/api/health` endpoint to verify server status
- Monitor console for magic link URLs in development

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Configure proper `DATABASE_URL` for production database
3. Set up email service for magic link delivery
4. Configure `FRONTEND_URL` to production domain
5. Ensure proper CORS settings for production frontend

The API includes Vercel deployment configuration in the `/api` directory for serverless deployment.