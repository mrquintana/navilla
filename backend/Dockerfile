# Navilla Backend Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM eclipse-temurin:25-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom.xml first for layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -q

# Copy source code
COPY src/ src/
COPY checkstyle/ checkstyle/

# Build the application
RUN ./mvnw package -DskipTests -q

# Runtime stage
FROM eclipse-temurin:25-jre-alpine AS runtime

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
      org.opencontainers.image.title="Navilla Backend" \
      org.opencontainers.image.description="Privacy-preserving sexual health platform backend"

# Create non-root user for security
RUN apk add --no-cache curl && \
    addgroup -g 1001 -S navilla && \
    adduser -u 1001 -S navilla -G navilla

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R navilla:navilla /app

# Switch to non-root user
USER navilla

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8080/api/health >/dev/null || exit 1

# JVM settings for containers
# Override JAVA_OPTS at deploy time for different environments
ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:InitialRAMPercentage=50.0 \
    -XX:+UseG1GC \
    -XX:+UseStringDeduplication \
    -Djava.security.egd=file:/dev/./urandom \
    -Dspring.profiles.active=production"

# Lean JVM preset for Railway / memory-constrained environments (256-512MB)
# To use: copy the flags below into JAVA_OPTS in your Railway environment variables.
# Railway does NOT expand variable references, so paste the full string.
#
# JAVA_OPTS=-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0 -XX:InitialRAMPercentage=30.0 -XX:+UseSerialGC -XX:MaxMetaspaceSize=150m -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Xss256k -Djava.security.egd=file:/dev/./urandom -Dspring.profiles.active=production

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
