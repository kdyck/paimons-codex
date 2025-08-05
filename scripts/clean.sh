#!/bin/bash

# Paimon's Codex - Clean Reset Script

echo "🧹 Cleaning Paimon's Codex environment..."

# Stop all services
podman-compose down

# Remove all volumes (this will delete all data!)
echo "⚠️  WARNING: This will delete all database data and embeddings!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    podman-compose down -v
    podman system prune -f
    echo "✅ Environment cleaned successfully."
    echo "Run ./scripts/start.sh to start fresh."
else
    echo "❌ Clean operation cancelled."
fi