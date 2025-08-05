#!/bin/bash

# Paimon's Codex - Stop Script

echo "🛑 Stopping Paimon's Codex services..."

# Stop all services
podman-compose down

echo "✅ All services stopped."
echo ""
echo "To start again, run: ./scripts/start.sh"
echo "To remove all data (clean restart), run: ./scripts/clean.sh"