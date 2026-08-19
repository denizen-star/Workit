#!/bin/bash
# Run this in the cloud agent to push to GitHub

cd /agent/workout-tracker

echo "Pushing to GitHub..."
echo "You may need to authenticate with GitHub"
echo ""

git push -u origin cursor/workout-tracker-app-67f6

echo ""
echo "If push succeeded, continue to Step 3!"
