# Navilla Makefile
# Single-command builds and common operations

.PHONY: help build run dev test clean docker-build docker-run docker-stop

# Default target
help:
	@echo "Navilla - Available Commands"
	@echo ""
	@echo "  make build        Build both backend and frontend"
	@echo "  make run          Run both services locally (requires build first)"
	@echo "  make dev          Run in development mode with hot-reload"
	@echo "  make test         Run all tests"
	@echo "  make clean        Clean build artifacts"
	@echo ""
	@echo "  make docker-build Build Docker images"
	@echo "  make docker-run   Run with Docker Compose"
	@echo "  make docker-stop  Stop Docker containers"
	@echo ""
	@echo "  make backend      Build and run backend only"
	@echo "  make frontend     Build and run frontend only"
	@echo ""

# Build everything
build: build-backend build-frontend
	@echo "✅ Build complete"

build-backend:
	@echo "🔨 Building backend..."
	cd backend && ./mvnw package -DskipTests -q

build-frontend:
	@echo "🔨 Building frontend..."
	cd frontend && npm ci && npm run build

# Run locally (production-like)
run: build
	@echo "🚀 Starting services..."
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:3000"
	@trap 'kill 0' INT; \
	cd backend && ./scripts/start-development.sh & \
	cd frontend && npm run preview -- --port 3000 & \
	wait

# Development mode with hot-reload
dev:
	@echo "🔧 Starting development servers..."
	@echo "Backend: http://localhost:8080 (debug: 5005)"
	@echo "Frontend: http://localhost:5173"
	@trap 'kill 0' INT; \
	cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=development & \
	cd frontend && npm run dev & \
	wait

# Run all tests
test: test-backend test-frontend
	@echo "✅ All tests passed"

test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && ./mvnw test -q

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test -- --run || true

# Clean build artifacts
clean:
	@echo "🧹 Cleaning..."
	cd backend && ./mvnw clean -q
	cd frontend && rm -rf dist node_modules/.vite
	@echo "✅ Clean complete"

# Docker commands
docker-build:
	@echo "🐳 Building Docker images..."
	docker compose build

docker-run:
	@echo "🐳 Starting Docker containers..."
	docker compose up -d
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:3000"

docker-stop:
	@echo "🐳 Stopping Docker containers..."
	docker compose down

docker-dev:
	@echo "🐳 Starting Docker development environment..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Individual services
backend:
	cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=development

frontend:
	cd frontend && npm run dev
