#!/bin/sh
set -e

# Default to UID/GID 6842 if not specified
PUID=${PUID:-6842}
PGID=${PGID:-6842}

echo "Starting with UID:${PUID} GID:${PGID}"

# Create group if it doesn't exist
if ! getent group "${PGID}" > /dev/null 2>&1; then
    addgroup -g "${PGID}" -S appgroup
fi
GROUP_NAME=$(getent group "${PGID}" | cut -d: -f1)

# Create user if it doesn't exist
if ! id -u "${PUID}" > /dev/null 2>&1; then
    adduser -u "${PUID}" -S -G "${GROUP_NAME}" appuser
fi

# Fix ownership of data directory
chown -R "${PUID}:${PGID}" /data

# Execute the java command as the target user
exec su-exec "${PUID}:${PGID}" java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Duser.timezone=UTC -jar /app/app.jar "$@"

