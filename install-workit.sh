#!/bin/bash
# Work-It Installer - Run this on your Mac
# Usage: bash install-workit.sh

echo "🏋️ Installing Work-It Workout Tracker..."

# Check if in correct directory
if [[ "$PWD" != "/Users/kervinleacock/Documents/Development/workit" ]]; then
    echo "Creating directory: /Users/kervinleacock/Documents/Development/workit"
    mkdir -p /Users/kervinleacock/Documents/Development/workit
    cd /Users/kervinleacock/Documents/Development/workit
fi

# Clone from GitHub (after you push)
echo "Cloning from GitHub..."
git clone https://github.com/Denizen-star/workout-tracker.git .

# Install dependencies
echo "Installing dependencies..."
npm install

echo "✅ Done! Project installed at: /Users/kervinleacock/Documents/Development/workit"
echo ""
echo "Next steps:"
echo "1. cp .env.example .env.local"
echo "2. Edit .env.local with PlanetScale credentials"
echo "3. npm run dev"

