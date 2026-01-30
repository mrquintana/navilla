#!/bin/bash
# Navilla - Single command build and run
# Usage: ./run.sh [command]
#
# Commands:
#   build    - Build both backend and frontend
#   dev      - Run in development mode with hot-reload
#   test     - Run all tests
#   docker   - Run with Docker Compose
#   help     - Show this help message

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}▶${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

case "${1:-dev}" in
    build)
        print_status "Building backend..."
        cd backend && ./mvnw package -DskipTests -q
        print_success "Backend built"

        print_status "Building frontend..."
        cd ../frontend && npm ci --silent && npm run build
        print_success "Frontend built"

        print_success "Build complete!"
        ;;

    dev)
        print_status "Starting development servers..."
        echo ""
        echo -e "${YELLOW}Backend:${NC}  http://localhost:8080"
        echo -e "${YELLOW}Frontend:${NC} http://localhost:5173"
        echo -e "${YELLOW}Debug:${NC}    localhost:5005"
        echo ""
        echo "Press Ctrl+C to stop all services"
        echo ""

        # Start both services, kill both on Ctrl+C
        trap 'kill 0' INT
        (cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=development 2>&1 | sed 's/^/[backend] /') &
        (cd frontend && npm run dev 2>&1 | sed 's/^/[frontend] /') &
        wait
        ;;

    test)
        print_status "Running backend tests..."
        cd backend && ./mvnw test -q
        print_success "Backend tests passed"

        print_status "Running frontend tests..."
        cd ../frontend && npm test -- --run || true
        print_success "Frontend tests complete"
        ;;

    docker)
        print_status "Starting Docker containers..."
        docker compose up -d
        echo ""
        echo -e "${YELLOW}Backend:${NC}  http://localhost:8080"
        echo -e "${YELLOW}Frontend:${NC} http://localhost:3000"
        echo ""
        print_success "Services running in Docker"
        ;;

    stop)
        print_status "Stopping services..."
        docker compose down 2>/dev/null || true
        pkill -f "spring-boot:run" 2>/dev/null || true
        pkill -f "vite" 2>/dev/null || true
        print_success "Services stopped"
        ;;

    help|--help|-h)
        echo "Navilla - Build and Run Script"
        echo ""
        echo "Usage: ./run.sh [command]"
        echo ""
        echo "Commands:"
        echo "  build    Build both backend and frontend"
        echo "  dev      Run in development mode (default)"
        echo "  test     Run all tests"
        echo "  docker   Run with Docker Compose"
        echo "  stop     Stop all running services"
        echo "  help     Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./run.sh           # Start development servers"
        echo "  ./run.sh build     # Build for production"
        echo "  ./run.sh docker    # Run with Docker"
        ;;

    *)
        print_error "Unknown command: $1"
        echo "Run './run.sh help' for usage"
        exit 1
        ;;
esac
