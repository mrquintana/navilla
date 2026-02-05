# Navilla Frontend Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

# Set environment variables for build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_API_URL=${VITE_API_URL}

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runtime stage - use nginx for serving static files
FROM nginx:alpine AS runtime

# Build arguments for labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Labels for container metadata
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.url="https://github.com/navilla-app/navilla" \
      org.opencontainers.image.source="https://github.com/navilla-app/navilla" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Navilla" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.title="Navilla Frontend" \
      org.opencontainers.image.description="Privacy-preserving sexual health platform frontend"

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S navilla && \
    adduser -u 1001 -S navilla -G navilla && \
    chown -R navilla:navilla /usr/share/nginx/html && \
    chown -R navilla:navilla /var/cache/nginx && \
    chown -R navilla:navilla /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown navilla:navilla /var/run/nginx.pid

# Switch to non-root user
USER navilla

# Expose port
EXPOSE 80

# Health check (wget is built into alpine, no curl dependency needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO /dev/null http://localhost:80/health || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
