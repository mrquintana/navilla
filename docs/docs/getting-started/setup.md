---
sidebar_position: 2
title: Development Setup
---

# Development Setup

This guide will help you set up your local development environment for Navilla.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20+ ([Download](https://nodejs.org/))
- **Java** JDK 21+ ([Download](https://adoptium.net/))
- **Docker** (for local PostgreSQL) ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

## 1. Clone the Repository

```bash
git clone https://github.com/navilla/navilla.git
cd navilla
```

## 2. Backend Setup

### Install Dependencies

```bash
cd backend
./gradlew build
```

### Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=your-database-url
```

### Run Backend

```bash
./gradlew bootRun
```

The API will be available at `http://localhost:8080`

## 3. Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8080
```

### Run Frontend

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 4. Documentation Setup

```bash
cd docs
npm install
npm start
```

Documentation will be available at `http://localhost:3000`

## 5. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the database migrations (see [Database Setup](../backend/database))
3. Configure authentication providers
4. Copy the API keys to your `.env` files

## Verification

Once everything is running, you should be able to:

1. Access the frontend at `http://localhost:5173`
2. Access the API at `http://localhost:8080/api/health`
3. Access the docs at `http://localhost:3000`

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 8080
lsof -i :8080
kill -9 <PID>
```

### Database Connection Issues

Ensure your Supabase project is active and the connection string is correct.

### Node Version Issues

Use `nvm` to switch Node versions:

```bash
nvm use 20
```
