#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

chmod +x ./mvnw
./mvnw -DskipTests package

JAR_PATH=$(ls -1 target/*.jar | head -n 1)
if [ -z "$JAR_PATH" ]; then
  echo "Jar not found in target/. Build may have failed." >&2
  exit 1
fi

exec java -jar "$JAR_PATH"
