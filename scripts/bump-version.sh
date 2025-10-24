#!/bin/bash
set -e

# Automated version bumping based on conventional commits
# Usage: ./scripts/bump-version.sh

# Get the current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Parse the version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Get commits since last tag, or all commits if no tags exist
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  echo "No tags found, analyzing all commits"
  COMMITS=$(git log --pretty=format:"%s")
else
  echo "Last tag: $LAST_TAG"
  COMMITS=$(git log "$LAST_TAG"..HEAD --pretty=format:"%s")
fi

# Check if there are any commits to analyze
if [ -z "$COMMITS" ]; then
  echo "No new commits since last tag"
  exit 0
fi

echo "Analyzing commits..."

# Determine version bump type based on conventional commits
BUMP_TYPE="patch"

# Check for breaking changes (BREAKING CHANGE: or feat!: or fix!:)
if echo "$COMMITS" | grep -qE "^(feat|fix|chore|docs|style|refactor|perf|test)!:|BREAKING[ -]CHANGE:"; then
  BUMP_TYPE="major"
  echo "Found breaking changes, bumping major version"
# Check for new features (feat:)
elif echo "$COMMITS" | grep -qE "^feat(\(.*\))?:"; then
  BUMP_TYPE="minor"
  echo "Found new features, bumping minor version"
# Check for fixes, chores, docs, etc. (fix:, chore:, docs:, etc.)
elif echo "$COMMITS" | grep -qE "^(fix|chore|docs|style|refactor|perf|test)(\(.*\))?:"; then
  BUMP_TYPE="patch"
  echo "Found patches/fixes, bumping patch version"
else
  echo "No conventional commits found, bumping patch version"
  BUMP_TYPE="patch"
fi

# Calculate new version
case "$BUMP_TYPE" in
  major)
    NEW_VERSION="$((MAJOR + 1)).0.0"
    ;;
  minor)
    NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
    ;;
  patch)
    NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
    ;;
esac

echo "New version: $NEW_VERSION"

# Update package.json
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json && rm package.json.bak

# Update server.json
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" server.json && rm server.json.bak

# Update package-lock.json (it has version in multiple places)
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/g" package-lock.json && rm package-lock.json.bak

echo "Version bumped from $CURRENT_VERSION to $NEW_VERSION"

# Output for GitHub Actions
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "NEW_VERSION=$NEW_VERSION" >> "$GITHUB_OUTPUT"
fi
