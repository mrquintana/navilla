#!/bin/bash
#
# Navilla Backend - Production Startup Script
#
# Usage: ./scripts/start-production.sh
#
# This script starts the application with production-optimized JVM settings:
# - G1GC garbage collector (best for server workloads)
# - Optimized heap settings
# - Production logging configuration
# - Container-aware memory settings
#

set -e

# Application JAR
JAR_FILE="${JAR_FILE:-target/navilla-backend-0.0.1-SNAPSHOT.jar}"

# Heap settings - adjust based on available memory
# For containers, these will be automatically adjusted if not set
HEAP_MIN="${HEAP_MIN:-512m}"
HEAP_MAX="${HEAP_MAX:-2g}"

# JVM Production Flags
JVM_OPTS=(
    # Memory settings
    "-Xms${HEAP_MIN}"
    "-Xmx${HEAP_MAX}"

    # Use G1GC - best for server applications with low pause times
    "-XX:+UseG1GC"
    "-XX:MaxGCPauseMillis=200"
    "-XX:G1HeapRegionSize=16m"
    "-XX:+ParallelRefProcEnabled"

    # GC logging (lightweight, production-safe)
    "-Xlog:gc*:file=logs/gc.log:time,uptime,level,tags:filecount=5,filesize=10m"

    # Container awareness (Java 17+)
    "-XX:+UseContainerSupport"
    "-XX:MaxRAMPercentage=75.0"

    # Performance optimizations
    "-XX:+OptimizeStringConcat"
    "-XX:+UseStringDeduplication"

    # Security
    "-Djava.security.egd=file:/dev/./urandom"

    # Disable JMX remote by default in production
    "-Dcom.sun.management.jmxremote=false"

    # Spring profile
    "-Dspring.profiles.active=production"
)

# Ensure logs directory exists
mkdir -p logs

echo "Starting Navilla Backend in PRODUCTION mode..."
echo "Heap: ${HEAP_MIN} - ${HEAP_MAX}"
echo "JAR: ${JAR_FILE}"

# Start the application
exec java "${JVM_OPTS[@]}" -jar "${JAR_FILE}" "$@"
