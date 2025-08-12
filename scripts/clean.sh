#!/bin/bash

# Paimon's Codex - Clean Reset Script

# Check for -y flag
FORCE_YES=false
if [[ "$1" == "-y" || "$1" == "--yes" ]]; then
    FORCE_YES=true
fi

echo "🧹 Cleaning Paimon's Codex environment..."

# Stop all services
echo "🛑 Stopping all compose services..."
podman-compose down



# Remove all volumes (this will delete all data!)
echo "⚠️  WARNING: This will delete all database data, embeddings, and Ollama models!"

if [ "$FORCE_YES" = true ]; then
    echo "🤖 Auto-confirmed with -y flag"
    REPLY="y"
else
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
fi

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing all containers and volumes..."
    podman-compose down -v
    
    # Force remove any remaining containers
    podman rm -f paimons-api paimons-ui paimons-oracle paimons-caddy paimons-minio paimons-ollama paimons-sd 2>/dev/null || true
    
    # Clean up system
    podman system prune -f
    
    echo "✅ Environment cleaned successfully."
    echo "Run ./scripts/start.sh to start fresh."
else
    echo "❌ Clean operation cancelled."
fi