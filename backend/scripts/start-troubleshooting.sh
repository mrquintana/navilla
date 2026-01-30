#!/bin/bash
#
# Navilla Backend - Troubleshooting Startup Script
#
# Usage: ./scripts/start-troubleshooting.sh
#
# This script starts the application with maximum diagnostic capabilities:
# - Detailed GC logging
# - Heap dump on OOM
# - Verbose class loading (optional)
# - JMX remote enabled
# - Native memory tracking
#

set -e

# Application JAR
JAR_FILE="${JAR_FILE:-target/navilla-backend-0.0.1-SNAPSHOT.jar}"

# JMX settings
JMX_PORT="${JMX_PORT:-9010}"

# Enable verbose class loading (set to "true" to enable)
VERBOSE_CLASSLOAD="${VERBOSE_CLASSLOAD:-false}"

# Ensure directories exist
mkdir -p logs
mkdir -p dumps

# Build JVM options
JVM_OPTS=(
    # Memory settings
    "-Xms512m"
    "-Xmx2g"

    # Use G1GC with detailed logging
    "-XX:+UseG1GC"

    # Comprehensive GC logging
    "-Xlog:gc*=debug:file=logs/gc-troubleshoot.log:time,uptime,level,tags:filecount=10,filesize=50m"
    "-Xlog:gc+heap=debug:file=logs/gc-heap.log:time,uptime,level,tags:filecount=5,filesize=20m"
    "-Xlog:gc+phases=debug:file=logs/gc-phases.log:time,uptime,level,tags:filecount=5,filesize=20m"
    "-Xlog:safepoint=debug:file=logs/safepoint.log:time,uptime,level,tags:filecount=5,filesize=10m"

    # Heap dump on OutOfMemoryError
    "-XX:+HeapDumpOnOutOfMemoryError"
    "-XX:HeapDumpPath=dumps/heapdump-$(date +%Y%m%d-%H%M%S).hprof"

    # Native memory tracking (use 'jcmd <pid> VM.native_memory summary' to view)
    "-XX:NativeMemoryTracking=summary"

    # JMX remote for monitoring tools (VisualVM, JConsole, etc.)
    "-Dcom.sun.management.jmxremote=true"
    "-Dcom.sun.management.jmxremote.port=${JMX_PORT}"
    "-Dcom.sun.management.jmxremote.rmi.port=${JMX_PORT}"
    "-Dcom.sun.management.jmxremote.authenticate=false"
    "-Dcom.sun.management.jmxremote.ssl=false"
    "-Djava.rmi.server.hostname=localhost"

    # Flight Recorder (can be started via jcmd)
    "-XX:+FlightRecorder"
    "-XX:FlightRecorderOptions=stackdepth=256"

    # Additional diagnostics
    "-XX:+PrintFlagsFinal"

    # Spring profile
    "-Dspring.profiles.active=development"

    # Maximum logging
    "-Dlogging.level.root=DEBUG"
    "-Dlogging.level.app.navilla=TRACE"
)

# Add verbose class loading if requested
if [ "${VERBOSE_CLASSLOAD}" = "true" ]; then
    JVM_OPTS+=("-Xlog:class+load=info:file=logs/classload.log:time,uptime,level,tags:filecount=5,filesize=20m")
    echo "Verbose class loading: ENABLED"
fi

echo "=========================================="
echo "Navilla Backend - TROUBLESHOOTING MODE"
echo "=========================================="
echo ""
echo "JAR: ${JAR_FILE}"
echo "JMX Port: ${JMX_PORT}"
echo ""
echo "Diagnostic files will be written to:"
echo "  - logs/gc-troubleshoot.log  (GC events)"
echo "  - logs/gc-heap.log          (Heap details)"
echo "  - logs/gc-phases.log        (GC phases)"
echo "  - logs/safepoint.log        (Safepoint events)"
echo "  - dumps/                    (Heap dumps on OOM)"
echo ""
echo "Useful commands while running:"
echo "  jcmd <pid> VM.native_memory summary"
echo "  jcmd <pid> GC.heap_info"
echo "  jcmd <pid> JFR.start duration=60s filename=recording.jfr"
echo "  jcmd <pid> Thread.print"
echo ""
echo "Connect monitoring tools to: localhost:${JMX_PORT}"
echo ""
echo "=========================================="

# Print flags to a file for reference
java "${JVM_OPTS[@]}" -version 2>&1 | head -5
echo ""

# Start the application
exec java "${JVM_OPTS[@]}" -jar "${JAR_FILE}" "$@"
