#!/bin/bash

# Paimon's Codex - Clean Reset Script

# Check for -y flag
FORCE_YES=false
if [[ "$1" == "-y" || "$1" == "--yes" ]]; then
    FORCE_YES=true
fi

echo "🧹 Cleaning Paimon's Codex environment..."

# Use docker compose or docker-compose based on availability
COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
fi

# Stop all services
echo "🛑 Stopping all compose services..."
$COMPOSE_CMD down



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
    echo "🗑️  Removing containers and selective volumes..."
    $COMPOSE_CMD down
    
    # Force remove any remaining containers
    docker rm -f paimons-api paimons-ui paimons-oracle paimons-caddy paimons-minio paimons-ollama paimons-sd 2>/dev/null || true
    
    # Remove all volumes except the ones we want to preserve
    echo "🔄 Preserving important data volumes..."
    PRESERVE_VOLUMES=(
        "paimons-codex_minio_data"
        "paimons-codex_ollama_models" 
        "paimons-codex_sd_models"
    )
    
    # Get list of all volumes and remove those not in preserve list
    for volume in $(docker volume ls -q | grep "paimons-codex"); do
        should_preserve=false
        for preserve_vol in "${PRESERVE_VOLUMES[@]}"; do
            if [[ "$volume" == "$preserve_vol" ]]; then
                should_preserve=true
                echo "✅ Preserving volume: $volume"
                break
            fi
        done
        
        if [[ "$should_preserve" == false ]]; then
            echo "🗑️  Removing volume: $volume"
            docker volume rm "$volume" 2>/dev/null || true
        fi
    done
    
    # Clean up system (excluding volumes to preserve our data)
    docker container prune -f
    docker image prune -f
    docker network prune -f
    
    echo "✅ Environment cleaned successfully."
    echo "Run ./scripts/start.sh to start fresh."
else
    echo "❌ Clean operation cancelled."
fi