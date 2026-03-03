# Navilla Backend Dockerfile
# Multi-stage build with Spring Boot layered JAR extraction

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

# Build the application and extract Spring Boot layers
RUN ./mvnw package -DskipTests -q && \
    java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination extracted

# Runtime stage — JRE only, no build tools
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
RUN addgroup -g 1001 -S navilla && \
    adduser -u 1001 -S navilla -G navilla

WORKDIR /app

# Copy Spring Boot layers — ordered from least to most frequently changing.
# Dependencies (~90% of image) are cached until pom.xml changes.
COPY --from=builder /app/extracted/dependencies/ ./
COPY --from=builder /app/extracted/spring-boot-loader/ ./
COPY --from=builder /app/extracted/snapshot-dependencies/ ./
COPY --from=builder /app/extracted/application/ ./

# Change ownership to non-root user
RUN chown -R navilla:navilla /app

# Switch to non-root user
USER navilla

# Expose port
EXPOSE 8080

# Health check (wget is built into Alpine — no extra packages needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO /dev/null http://localhost:8080/api/health || exit 1

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

# Run via Spring Boot launcher (works with extracted layers)
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
