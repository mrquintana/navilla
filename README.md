# Navilla

[![CI](https://github.com/mrquintana/navilla/actions/workflows/ci.yml/badge.svg)](https://github.com/mrquintana/navilla/actions/workflows/ci.yml)
[![Security](https://github.com/mrquintana/navilla/actions/workflows/security.yml/badge.svg)](https://github.com/mrquintana/navilla/actions/workflows/security.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

A privacy-preserving sexual health platform that helps users understand their potential STI exposure through an anonymized connection network.

**"Numbers, not names"** - Users see statistics, never identities.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + TypeScript + TailwindCSS |
| Backend | Java 25 + Spring Boot 4.0 + Maven |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT) |
| Docs | Docusaurus |

## Quick Start

### Prerequisites

- Node.js 20+
- Java 25+
- Maven 3.9+
- Docker (optional, for local PostgreSQL)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/navilla/navilla.git
   cd navilla
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your Supabase credentials

   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your Supabase credentials
   ```

3. **Run the application**
   The easiest way to run the application in development mode is to use the provided `run.sh` script:
   ```bash
   ./run.sh
   ```
   This will start both the backend and frontend with hot-reloading enabled.

4. **View the documentation**
   ```bash
   cd docs
   npm install
   npm start
   ```

### Using Docker

```bash
# Development environment
docker compose -f docker-compose.dev.yml up

# Production-like environment
docker compose up
```

## Project Structure

```
navilla/
├── backend/                 # Spring Boot API
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── pom.xml             # Maven configuration
│
├── frontend/               # React SPA
│   ├── src/               # TypeScript source code
│   └── package.json       # npm configuration
│
├── database/              # Database files
│   └── migrations/        # SQL migration scripts
│
├── docs/                  # Docusaurus documentation
│   └── docs/             # Markdown documentation
│
└── .github/              # GitHub Actions workflows
    └── workflows/        # CI/CD pipelines
```

## Development Commands

See `run.sh help` for a list of available commands.

### Backend

```bash
cd backend

# Run tests
./mvnw test

# Check code style
./mvnw checkstyle:check

# Build JAR
./mvnw clean package -DskipTests
```

### Frontend

```bash
cd frontend

# Development server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build
```

### Documentation

```bash
cd docs

# Local development
npm start

# Build static site
npm run build
```

## API Documentation

API documentation is available in the documentation site. See `docs/docs/api/` for endpoint specifications.

## Security

- All sensitive data is encrypted at rest using AES-256-GCM
- Email addresses are hashed (SHA-256 with pepper) for lookups
- JWT-based authentication via Supabase
- CORS configured for known origins only
- Security headers (CSP, HSTS, X-Frame-Options)

See [docs/docs/architecture/security.md](docs/docs/architecture/security.md) for details.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the Apache License 2.0.
<!-- TODO: Add a LICENSE file -->

## Links

- [Documentation](docs/) - Full project documentation
- [API Reference](docs/docs/api/) - REST API specifications
- [Architecture](docs/docs/architecture/) - System design and decisions
