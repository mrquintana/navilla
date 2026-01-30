#!/bin/bash
#
# Navilla Backend - Development Startup Script
#
# Usage: ./scripts/start-development.sh
#
# This script starts the application with development-friendly settings:
# - Remote debugging enabled on port 5005
# - Verbose output
# - Hot reload friendly settings
# - Smaller heap for faster startup
#

set -e

# Application JAR
JAR_FILE="${JAR_FILE:-target/navilla-backend-0.0.1-SNAPSHOT.jar}"

# Debug port
DEBUG_PORT="${DEBUG_PORT:-5005}"

# JVM Development Flags
JVM_OPTS=(
    # Smaller heap for faster startup
    "-Xms256m"
    "-Xmx1g"

    # Remote debugging - suspend=n means don't wait for debugger
    "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:${DEBUG_PORT}"

    # Use serial GC for faster startup (dev only)
    "-XX:+UseSerialGC"

    # Show more information
    "-XX:+PrintCommandLineFlags"

    # Faster startup
    "-XX:TieredStopAtLevel=1"

    # Spring DevTools support
    "-Dspring.devtools.restart.enabled=true"

    # Spring profile
    "-Dspring.profiles.active=development"

    # Verbose SQL logging
    "-Dlogging.level.org.hibernate.SQL=DEBUG"
    "-Dlogging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE"
)

echo "Starting Navilla Backend in DEVELOPMENT mode..."
echo "Debug port: ${DEBUG_PORT}"
echo "JAR: ${JAR_FILE}"
echo ""
echo "To attach debugger: Connect to localhost:${DEBUG_PORT}"
echo ""

# Start the application
exec java "${JVM_OPTS[@]}" -jar "${JAR_FILE}" "$@"
