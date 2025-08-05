#!/bin/bash

# Paimon's Codex - Stop Development Script

echo "🛑 Stopping Paimon's Codex development services..."

# Stop all services using dev compose file
podman-compose -f docker-compose.dev.yml down

echo "✅ All development services stopped."
echo ""
echo "To start again, run: ./scripts/start-dev.sh"
echo "To switch to full setup, run: ./scripts/start.sh"