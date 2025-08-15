#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -z "$1" ]; then
    echo "Usage: $0 <version>"
    echo "Examples: $0 1.2.3"
    echo "          $0 1.3.0-SNAPSHOT"
    exit 1
fi

NEW_VERSION="$1"

# Validate semantic version format (with optional -SNAPSHOT)
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-SNAPSHOT)?$ ]]; then
    echo "ERROR: Invalid version format. Use semantic versioning (e.g., 1.2.3 or 1.3.0-SNAPSHOT)"
    exit 1
fi

cd "$PROJECT_ROOT"

echo "Updating versions to $NEW_VERSION..."

# Update Maven version
cd habitsync-api
mvn versions:set -DnewVersion="$NEW_VERSION" -DgenerateBackupPoms=false -q
cd ..

# Update package.json
jq --arg v "$NEW_VERSION" '.version = $v' habitsync-ui/package.json > habitsync-ui/package.json.tmp
mv habitsync-ui/package.json.tmp habitsync-ui/package.json

# Update app.json
jq --arg v "$NEW_VERSION" '.expo.version = $v' habitsync-ui/app.json > habitsync-ui/app.json.tmp
mv habitsync-ui/app.json.tmp habitsync-ui/app.json

# Commit changes
git add habitsync-api/pom.xml habitsync-ui/package.json habitsync-ui/app.json
git commit -m "Prepare release $NEW_VERSION"

echo "Release $NEW_VERSION prepared and committed."
