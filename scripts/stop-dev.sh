#!/bin/bash

# Paimon's Codex - Stop Development Script

echo "🛑 Stopping Paimon's Codex development services..."

# Use docker compose or docker-compose based on availability
COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
fi

# Stop all services using dev compose file
$COMPOSE_CMD -f docker-compose.dev.yml down

echo "✅ All development services stopped."
echo ""
echo "To start again, run: ./scripts/start-dev.sh"
echo "To switch to full setup, run: ./scripts/start.sh"