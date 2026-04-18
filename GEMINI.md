# CodeBox Project Mandates

This document defines the foundational mandates and operational guidelines for Gemini CLI in the CodeBox workspace.

## Tech Stack
- **Monorepo:** Bun Workspaces (`client`, `server`, `shared`)
- **Runtime:** Bun
- **Frontend:** React 19, Vite, TypeScript, TanStack Router & Query, Tailwind CSS 4, Zustand, Lucide React.
- **Backend:** Hono, Bun, Drizzle ORM, Zod.
- **Shared:** Common types and Zod schemas in `@codebox/shared`.
- **Database:** SQLite (via Drizzle).
- **Testing:** Bun Test.

## Project Structure
- `client/`: React application.
- `server/`: Hono API server.
- `shared/`: Shared logic, constants, and types.
- `bruno/`: API documentation and testing (Bruno collection).

## Development Guidelines

### General
- Use `bun` for all package management and script execution.
- Adhere to the monorepo structure; shared logic MUST go into `shared/`.
- Ensure type safety across the entire stack.

### Frontend (Client)
- Use TanStack Router for file-based routing.
- Use TanStack Query for data fetching and state management.
- Use Tailwind CSS 4 for styling (utility-first).
- Prefer functional components and hooks.
- Use Lucide React for icons.

### Backend (Server)
- Use Hono for routing and middleware.
- Use Zod for request validation (leveraging schemas from `shared/`).
- Use Drizzle ORM for database interactions.
- Follow the repository pattern for database access (`server/src/repositories`).
- Use services for business logic (`server/src/services`).

### Database
- Use `bun run db:generate` to create migrations after schema changes.
- Use `bun run db:migrate` to apply migrations.

### Testing
- Write tests using Bun's built-in test runner.
- Place tests in `server/tests` for backend logic.

## Common Commands
- `bun run dev:client`: Start client development server.
- `bun run dev:server`: Start server development server.
- `bun run test`: Run backend tests (from `server/` directory).
- `bun run db:push`: Push database changes (development).
- `bun run db:generate`: Generate migrations.
