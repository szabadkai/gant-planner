
# Project Overview

This is a full-stack Gantt chart planner application. It allows users to create and manage projects, tasks, and staff. The application features a drag-and-drop interface for assigning tasks to staff and visualizing the project timeline.

## Technologies

*   **Frontend:** React, Vite, TypeScript, React Query
*   **Backend:** Node.js, Fastify, Prisma, TypeScript
*   **Database:** SQLite (default, configured in `prisma/schema.prisma`)

## Architecture

The application is a monorepo with two main packages:

*   `apps/web`: The React frontend that provides the user interface.
*   `apps/api`: The Node.js backend that serves the API and interacts with the database.

The frontend and backend communicate via a RESTful API. The API is defined in `apps/api/src/server.ts`. The frontend API client is in `apps/web/src/api.ts`.

# Building and Running

## Prerequisites

*   Node.js and npm

## Installation

1.  Install the dependencies from the root directory:
    ```bash
    npm install
    ```

## Running the Application

To run the application in development mode, use the following command from the root directory:

```bash
npm run dev
```

This will start both the frontend and backend servers concurrently.

*   The backend API will be available at `http://localhost:4000`.
*   The frontend application will be available at `http://localhost:3000`.

## Building for Production

To build the application for production, use the following command from the root directory:

```bash
npm run build
```

This will create a production-ready build of both the frontend and backend in their respective `dist` directories.

## Starting the Production Server

To start the production server, use the following command from the root directory:

```bash
npm run start
```

# Development Conventions

*   **Code Style:** The project uses Prettier for code formatting.
*   **Linting:** ESLint is used for linting the code.
*   **Commits:** Conventional Commits are recommended for commit messages.
*   **Database Migrations:** Prisma Migrate is used for database migrations. To create a new migration, run the following command in the `apps/api` directory:
    ```bash
    npx prisma migrate dev --name <migration-name>
    ```
