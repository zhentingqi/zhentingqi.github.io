#!/bin/bash

# Deployment script for GitHub Pages
# This script builds the site and deploys it to the gh-pages branch

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

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
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

# Step 2: Switch to gh-pages branch (create if it doesn't exist)
echo "🔄 Switching to gh-pages branch..."
if git show-ref --verify --quiet refs/heads/gh-pages; then
    git checkout gh-pages
    # Remove all files except .git
    git rm -rf --cached . 2>/dev/null || true
else
    git checkout --orphan gh-pages
    git rm -rf --cached . 2>/dev/null || true
fi

# Step 3: Copy built files
echo "📋 Copying built files..."
cp -r out/* .
cp out/.nojekyll . 2>/dev/null || touch .nojekyll

# Step 4: Add and commit
echo "💾 Committing changes..."
git add -A
git commit -m "Deploy website to GitHub Pages - $(date +'%Y-%m-%d %H:%M:%S')" || {
    echo "⚠️  No changes to commit (site is already up to date)"
}

# Step 5: Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin gh-pages

# Step 6: Switch back to main branch
echo "🔄 Switching back to main branch..."
git checkout main

echo "✅ Deployment complete!"
echo "🌐 Your site should be live at: https://zhentingqi.github.io"
echo ""
echo "Note: It may take 1-2 minutes for GitHub Pages to update."

