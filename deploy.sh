#!/bin/bash

# Deployment script for GitHub Pages
# This script builds the site and publishes out/ as the entire contents of the gh-pages branch

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Get the current branch
CURRENT_BRANCH=$(git branch --show-current)

# Check if we're on main branch
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: You're not on the main branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes, including untracked files
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Uncommitted changes detected. Committing them first..."
    git add -A
    git commit -m "Auto-commit before deployment - $(date +'%Y-%m-%d %H:%M:%S')"
    echo "✅ Changes committed successfully"
fi

# Step 1: Build the project
echo "📦 Building the project..."
npm run build

if [ ! -d "out" ]; then
    echo "❌ Error: Build failed - 'out' directory not found"
    exit 1
fi

# Step 2: Check out gh-pages in a temporary worktree (the main checkout is never switched)
echo "🔄 Preparing gh-pages worktree..."
WORKTREE=$(mktemp -d)
cleanup() {
    git worktree remove --force "$WORKTREE" 2>/dev/null || true
    rm -rf "$WORKTREE"
}
trap cleanup EXIT

if git show-ref --verify --quiet refs/heads/gh-pages; then
    git worktree add --quiet "$WORKTREE" gh-pages
else
    git worktree add --quiet --detach "$WORKTREE"
    git -C "$WORKTREE" checkout --quiet --orphan gh-pages
fi

# Step 3: Replace the branch contents with the fresh build, so stale files never linger
echo "📋 Copying built files..."
git -C "$WORKTREE" rm -rf --quiet --ignore-unmatch .
cp -R out/. "$WORKTREE"/
touch "$WORKTREE/.nojekyll"

# Step 4: Add and commit
echo "💾 Committing changes..."
git -C "$WORKTREE" add -A
git -C "$WORKTREE" commit --quiet -m "Deploy website to GitHub Pages - $(date +'%Y-%m-%d %H:%M:%S')" || {
    echo "⚠️  No changes to commit (site is already up to date)"
}

# Step 5: Push to GitHub
echo "📤 Pushing to GitHub..."
git -C "$WORKTREE" push -u origin gh-pages

echo "✅ Deployment complete!"
echo "🌐 Your site should be live at: https://zhentingqi.github.io"
echo ""
echo "Note: It may take 1-2 minutes for GitHub Pages to update."

