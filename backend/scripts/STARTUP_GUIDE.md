# Navilla Backend Startup Guide

This guide covers the four startup modes available for the Navilla backend.

## Prerequisites

1. Build the application first:
   ```bash
   ./mvnw clean package -DskipTests
   ```

2. Ensure environment variables are set. If you are using the main `start.sh` script, it will automatically load variables from `backend/.env`. If running these scripts directly, ensure your `.env` file is loaded:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   source .env
   ```

## Environment Profiles

| Profile | Use Case | Logging | Database |
|---------|----------|---------|----------|
| `development` | Local dev | DEBUG, colored console | Local/dev Supabase |
| `staging` | Pre-production | INFO, file + console | Staging Supabase |
| `production` | Live | WARN, JSON + file | Production Supabase |

## Startup Scripts

### 1. Development Mode

Optimized for local development with:
- Remote debugging on port 5005
- Faster startup (Serial GC)
- DevTools support
- Verbose SQL logging
- Colored console output

```bash
./scripts/start-development.sh
```

**Spring Profile:** `development`

**Connecting a Debugger:**
- **IntelliJ IDEA:** Run > Edit Configurations > Remote JVM Debug > Port 5005
- **VS Code:** Add launch configuration for "Attach to Remote JVM"

**Environment Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| `JAR_FILE` | `target/navilla-backend-0.0.1-SNAPSHOT.jar` | Path to JAR |
| `DEBUG_PORT` | `5005` | Debug port |

### 2. Staging Mode

Production-like environment for testing:
- G1GC garbage collector
- Moderate heap settings
- File logging enabled
- INFO level logging

```bash
./scripts/start-staging.sh
```

**Spring Profile:** `staging`

**Environment Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| `JAR_FILE` | `target/navilla-backend-0.0.1-SNAPSHOT.jar` | Path to JAR |
| `HEAP_MIN` | `512m` | Minimum heap size |
| `HEAP_MAX` | `1g` | Maximum heap size |

### 3. Production Mode

Optimized for production deployments with:
- G1GC garbage collector (low pause times)
- Container-aware memory settings
- Minimal logging (WARN level)
- Security hardened
- No stack traces in responses

```bash
./scripts/start-production.sh
```

**Spring Profile:** `production`

**Environment Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| `JAR_FILE` | `target/navilla-backend-0.0.1-SNAPSHOT.jar` | Path to JAR |
| `HEAP_MIN` | `512m` | Minimum heap size |
| `HEAP_MAX` | `2g` | Maximum heap size |

**Example with custom settings:**
```bash
HEAP_MAX=4g ./scripts/start-production.sh
```

### 4. Troubleshooting Mode

Maximum diagnostics for investigating issues:
- Detailed GC logging
- Heap dump on OutOfMemoryError
- Native memory tracking
- JMX enabled for monitoring tools
- Flight Recorder ready

```bash
./scripts/start-troubleshooting.sh
```

**Output Files:**
```
logs/
├── gc-troubleshoot.log  # GC events
├── gc-heap.log          # Heap details
├── gc-phases.log        # GC phases
├── safepoint.log        # Safepoint events
└── classload.log        # Class loading (if enabled)

dumps/
└── heapdump-*.hprof     # Heap dumps on OOM
```

**Useful Commands While Running:**
```bash
# Get process ID
PID=$(jps | grep navilla | cut -d' ' -f1)

# Native memory summary
jcmd $PID VM.native_memory summary

# Heap information
jcmd $PID GC.heap_info

# Thread dump
jcmd $PID Thread.print

# Start Flight Recorder (60 second recording)
jcmd $PID JFR.start duration=60s filename=recording.jfr

# Force GC
jcmd $PID GC.run
```

**Monitoring Tools:**
Connect VisualVM, JConsole, or Mission Control to `localhost:9010`

**Environment Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| `JAR_FILE` | `target/navilla-backend-0.0.1-SNAPSHOT.jar` | Path to JAR |
| `JMX_PORT` | `9010` | JMX remote port |
| `VERBOSE_CLASSLOAD` | `false` | Enable class loading logs |

## Running with Maven (Development)

For quick development without building a JAR:

```bash
# Default (no profile)
./mvnw spring-boot:run

# Development profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=development

# With debug
./mvnw spring-boot:run -Dspring-boot.run.profiles=development \
    -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"

# Staging profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=staging
```

## Configuration Files

```
src/main/resources/
├── application.yaml              # Base configuration (all profiles)
├── application-development.yaml  # Development overrides
├── application-staging.yaml      # Staging overrides
├── application-production.yaml   # Production overrides
└── logback-spring.xml           # Profile-aware logging config
```

## Logging Levels by Profile

| Logger | Development | Staging | Production |
|--------|-------------|---------|------------|
| `root` | INFO | INFO | WARN |
| `app.navilla` | DEBUG | DEBUG | INFO |
| `org.springframework` | DEBUG | INFO | WARN |
| `org.hibernate.SQL` | DEBUG | INFO | WARN |
| `org.hibernate.type` | TRACE | - | - |

## Docker (Future)

For containerized deployments, a Dockerfile will be provided:

```dockerfile
FROM eclipse-temurin:25-jre-alpine
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar", "--spring.profiles.active=production"]
```

## Common Issues

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080
# Kill it
kill -9 <PID>
```

### OutOfMemoryError
1. Check heap dump in `dumps/` directory
2. Analyze with Eclipse MAT or VisualVM
3. Consider increasing `HEAP_MAX`

### Slow Startup
1. Use development mode (Serial GC)
2. Check for slow database connections
3. Review Spring bean initialization logs

### GC Pauses
1. Enable troubleshooting mode
2. Review `logs/gc-troubleshoot.log`
3. Consider tuning G1GC parameters

### Profile Not Active
Verify profile is set correctly:
```bash
# Should show in startup logs
"The following 1 profile is active: development"
```
