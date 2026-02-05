---
sidebar_position: 2
title: Development Setup
---

# Development Setup

This guide will help you set up your local development environment for Navilla.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20+ ([Download](https://nodejs.org/))
- **Java** JDK 25 ([Download](https://adoptium.net/))
- **Maven** 3.9+ (included with `./mvnw` wrapper)
- **Git** ([Download](https://git-scm.com/))
- **Docker** (optional, for running with Docker Compose) ([Download](https://www.docker.com/))

## 1. Clone the Repository

```bash
# TODO: Update with the correct repository URL
git clone https://github.com/your-org/navilla.git
cd navilla
```

## 2. Supabase Setup

Navilla uses Supabase for authentication and as its primary PostgreSQL database. You'll need to set up a Supabase project and configure your environment variables.

See the [Supabase Setup Guide](https://github.com/mrquintana/navilla/blob/main/database/SUPABASE_SETUP.md) for detailed instructions on creating a Supabase project, getting your credentials, and running initial migrations.

## 3. Configure Environment Variables

Create `.env` files for both the backend and frontend:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials (DATABASE_URL, SUPABASE_URL, etc.)

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
```

Ensure you populate these `.env` files with the appropriate values from your Supabase project as described in the [Supabase Setup Guide](https://github.com/mrquintana/navilla/blob/main/database/SUPABASE_SETUP.md).

## 4. Run the Application

The easiest way to get the entire application (backend and frontend) running in development mode is by using the `start.sh` script:

```bash
./start.sh dev
```

This command will:
- Start the Spring Boot backend on `http://localhost:8080`.
- Start the React frontend with Vite on `http://localhost:5173`.
- Enable a debug port for the backend on `localhost:5005`.
- Provide hot-reloading for both services.

Press `Ctrl+C` in the terminal to stop all services.

## 5. Documentation Setup

To run the documentation site locally:

```bash
cd docs
npm ci # Install dependencies
npm start
```

The documentation will be available at `http://localhost:3000`.

## 6. Verification

Once everything is running, you should be able to:

1. Access the frontend at `http://localhost:5173`
2. Access the API at `http://localhost:8080/api/health`
3. Access the docs at `http://localhost:3000`
4. Log in and interact with the application using your Supabase credentials.

## Troubleshooting

### Port Already in Use

If you encounter issues with ports being in use:

```bash
# Find and kill process on port 8080 (for backend)
lsof -i :8080
kill -9 <PID>

# Find and kill process on port 5173 (for frontend)
lsof -i :5173
kill -9 <PID>
```

### Database Connection Issues

Ensure:
- Your Supabase project is active.
- The `DATABASE_URL` in `backend/.env` is correct and includes your database password.
- You have run the necessary migrations (refer to the [Supabase Setup Guide](https://github.com/mrquintana/navilla/blob/main/database/SUPABASE_SETUP.md)).

### Node Version Issues

Use `nvm` to manage Node versions if needed:

```bash
nvm use 20 # Or the version specified in prerequisites
```
