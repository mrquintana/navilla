#!/bin/bash
#
# Navilla Backend - Staging Startup Script
#
# Usage: ./scripts/start-staging.sh
#
# This script starts the application with staging-appropriate settings:
# - G1GC garbage collector
# - Moderate heap settings
# - File logging enabled
# - Balanced logging levels
#

set -e

# Application JAR
JAR_FILE="${JAR_FILE:-target/navilla-backend-0.0.1-SNAPSHOT.jar}"

# Heap settings
HEAP_MIN="${HEAP_MIN:-512m}"
HEAP_MAX="${HEAP_MAX:-1g}"

# JVM Staging Flags
JVM_OPTS=(
    # Memory settings
    "-Xms${HEAP_MIN}"
    "-Xmx${HEAP_MAX}"

    # Use G1GC
    "-XX:+UseG1GC"
    "-XX:MaxGCPauseMillis=200"

    # GC logging
    "-Xlog:gc*:file=logs/gc.log:time,uptime,level,tags:filecount=5,filesize=10m"

    # Container awareness
    "-XX:+UseContainerSupport"
    "-XX:MaxRAMPercentage=75.0"

    # Spring profile
    "-Dspring.profiles.active=staging"

    # Log path
    "-DLOG_PATH=logs"
)

# Ensure logs directory exists
mkdir -p logs

echo "Starting Navilla Backend in STAGING mode..."
echo "Heap: ${HEAP_MIN} - ${HEAP_MAX}"
echo "Profile: staging"
echo "JAR: ${JAR_FILE}"

# Start the application
exec java "${JVM_OPTS[@]}" -jar "${JAR_FILE}" "$@"
