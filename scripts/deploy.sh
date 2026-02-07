#!/bin/bash

# deploy.sh - Run this on the server to update the app

echo "⬇️ Pulling latest code..."
git pull

echo "🐳 Rebuilding and restarting containers..."
docker compose up -d --build

echo "🧹 Cleaning up unused images..."
docker image prune -f

echo "✅ Deployment complete!"
