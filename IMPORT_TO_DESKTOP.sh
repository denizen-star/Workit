#!/bin/bash

# Work-It Workout Tracker - Desktop Import Script
# This script will copy the project to your local machine

echo "🏋️ Work-It Workout Tracker - Import to Desktop"
echo "=============================================="
echo ""

# Check if destination is provided
if [ -z "$1" ]; then
    DEST_DIR="$HOME/workout-tracker"
    echo "No destination provided, using: $DEST_DIR"
else
    DEST_DIR="$1"
fi

echo "Destination: $DEST_DIR"
echo ""

# Create destination directory
mkdir -p "$DEST_DIR"

# Get the source directory (where this script is)
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Copying project files..."

# Copy all files except node_modules and build artifacts
rsync -av --progress \
    --exclude='node_modules/' \
    --exclude='.next/' \
    --exclude='*.log' \
    --exclude='.git/' \
    "$SOURCE_DIR/" "$DEST_DIR/"

echo ""
echo "✅ Files copied successfully!"
echo ""
echo "📦 Next steps:"
echo ""
echo "1. Navigate to the project:"
echo "   cd $DEST_DIR"
echo ""
echo "2. Install dependencies:"
echo "   npm install"
echo ""
echo "3. Set up environment variables:"
echo "   cp .env.example .env.local"
echo "   # Edit .env.local with your PlanetScale credentials"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""
echo "5. Visit http://localhost:3000"
echo ""
echo "📚 See README.md for complete setup instructions"
echo ""
