#!/bin/bash

# Run this script on your Mac to import the project
DEST="/Users/kervinleacock/Documents/Development/workit"

echo "Creating directory..."
mkdir -p "$DEST"

echo "Please download /agent/workout-tracker-clean.tar.gz from the cloud agent"
echo "Save it to your Downloads folder, then run:"
echo ""
echo "  cd $DEST"
echo "  tar -xzf ~/Downloads/workout-tracker-clean.tar.gz"
echo "  npm install"
echo "  cp .env.example .env.local"
echo ""
echo "Then edit .env.local with your database credentials and run: npm run dev"

