#!/bin/bash

# Paimon's Codex - Stop Script

# Function to show usage
show_usage() {
    echo "Usage: $0 [service1] [service2] ..."
    echo ""
    echo "Available services:"
    echo "  api        - FastAPI backend service"
    echo "  ui         - React frontend service"
    echo "  oracle-db  - Oracle 23ai database"
    echo "  chromadb   - ChromaDB vector database"
    echo "  caddy      - Caddy reverse proxy"
    echo ""
    echo "Examples:"
    echo "  $0           # Stop all services"
    echo "  $0 api       # Stop only API service"
    echo "  $0 ui api    # Stop UI and API services"
    echo "  $0 --help    # Show this help"
    echo ""
    echo "Options:"
    echo "  --remove     # Remove containers after stopping"
    echo "  --volumes    # Also remove volumes (use with caution!)"
    exit 0
}

# Check for help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_usage
fi

# Parse arguments
TARGET_SERVICES=""
REMOVE_CONTAINERS=false
REMOVE_VOLUMES=false

for arg in "$@"; do
    case $arg in
        --remove)
            REMOVE_CONTAINERS=true
            ;;
        --volumes)
            REMOVE_VOLUMES=true
            ;;
        api|ui|oracle-db|chromadb|caddy)
            TARGET_SERVICES="$TARGET_SERVICES $arg"
            ;;
        *)
            echo "❌ Unknown argument: $arg"
            show_usage
            ;;
    esac
done

# Stop services
if [ -z "$TARGET_SERVICES" ]; then
    echo "🛑 Stopping ALL Paimon's Codex services..."
    
    if [ "$REMOVE_VOLUMES" = true ]; then
        echo "⚠️  WARNING: This will remove all data!"
        podman-compose down --volumes
    elif [ "$REMOVE_CONTAINERS" = true ]; then
        echo "🗑️  Stopping and removing all containers..."
        podman-compose down
        # Remove all project containers
        podman rm -f paimons-api paimons-ui paimons-oracle paimons-chroma paimons-caddy 2>/dev/null || true
    else
        podman-compose down
    fi
    
    echo "✅ All services stopped."
else
    echo "🛑 Stopping specified services:$TARGET_SERVICES"
    podman-compose stop $TARGET_SERVICES
    
    if [ "$REMOVE_CONTAINERS" = true ]; then
        echo "🗑️  Removing containers..."
        for service in $TARGET_SERVICES; do
            container_name="paimons-${service}"
            if [ "$service" = "oracle-db" ]; then
                container_name="paimons-oracle"
            fi
            podman rm -f $container_name 2>/dev/null || echo "Container $container_name not found or already removed"
        done
    fi
    
    echo "✅ Services stopped:$TARGET_SERVICES"
fi

echo ""
echo "To start again, run: ./scripts/start.sh"
echo "To remove all data (clean restart), run: ./scripts/clean.sh"