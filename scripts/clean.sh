#!/bin/bash

# Paimon's Codex - Clean Reset Script

echo "🧹 Cleaning Paimon's Codex environment..."

# Stop all services
echo "🛑 Stopping all compose services..."
podman-compose down

# Stop and remove standalone Open WebUI container
echo "🛑 Stopping standalone Open WebUI container..."
podman stop paimons-openwebui 2>/dev/null || true
podman rm -f paimons-openwebui 2>/dev/null || true

# Remove all volumes (this will delete all data!)
echo "⚠️  WARNING: This will delete all database data and embeddings!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing all containers and volumes..."
    podman-compose down -v
    
    # Force remove any remaining containers
    podman rm -f paimons-api paimons-ui paimons-oracle paimons-caddy paimons-minio paimons-openwebui 2>/dev/null || true
    
    # Clean up system
    podman system prune -f
    
    echo "✅ Environment cleaned successfully."
    echo "Run ./scripts/start.sh to start fresh."
else
    echo "❌ Clean operation cancelled."
fi