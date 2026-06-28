# Nebula Finance Backend

Backend service for Nebula Finance, a personal finance management application.

## Technologies

- Node.js & Express
- TypeScript
- PostgreSQL (Production) / SQLite (Dev)
- JWT Authentication

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment setup:
   Copy `.env.example` to `.env` and update variables.
   ```bash
   cp .env.example .env
   ```

3. Run migrations:
   (Coming soon)

4. Start development server:
   ```bash
   npm run dev
   ```

## Folder Structure

- `src/config` - Configuration
- `src/controllers` - Request handlers
- `src/models` - Data models
- `src/routes` - API routes
- `src/services` - Business logic
- `src/middleware` - Express middleware
