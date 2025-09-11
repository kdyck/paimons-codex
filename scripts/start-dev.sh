#!/bin/bash

# Paimon's Codex - Development Start Script (Simplified)

echo "🚀 Starting Paimon's Codex Development Environment (Simplified)..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Use docker compose or docker-compose based on availability
COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
fi

# Use the development compose file
export COMPOSE_FILE=docker-compose.dev.yml

# Pull latest images
echo "📥 Pulling latest images..."
$COMPOSE_CMD -f docker-compose.dev.yml pull

# Build and start services
echo "🏗️  Building and starting services..."
$COMPOSE_CMD -f docker-compose.dev.yml up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
$COMPOSE_CMD -f docker-compose.dev.yml ps

# Show logs from API service for debugging
echo "📋 API Service Logs:"
$COMPOSE_CMD -f docker-compose.dev.yml logs --tail=20 api

echo ""
echo "✅ Paimon's Codex is now running (Development Mode)!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "🌍 Full App: http://localhost (via nginx)"
echo ""
echo "📝 Note: Running in simplified mode without Oracle"
echo "📝 Oracle integration can be added later with full setup"
echo ""
echo "To stop the services, run: ./scripts/stop-dev.sh"