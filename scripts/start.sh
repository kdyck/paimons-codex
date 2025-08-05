#!/bin/bash

# Paimon's Codex - Development Start Script

echo "🚀 Starting Paimon's Codex Development Environment..."

# Check if Podman is running
if ! podman info > /dev/null 2>&1; then
    echo "❌ Podman is not running. Please start Podman first."
    exit 1
fi

# Check if podman-compose is available
if ! command -v podman-compose &> /dev/null; then
    echo "❌ podman-compose is not installed. Please install podman-compose first."
    echo "You can install it with: pip install podman-compose"
    exit 1
fi

# Pull latest images
echo "📥 Pulling latest images..."
podman-compose pull

# Build and start services
echo "🏗️  Building and starting services..."
podman-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
podman-compose ps

# Show logs from API service for debugging
echo "📋 API Service Logs:"
podman-compose logs --tail=20 api

echo ""
echo "✅ Paimon's Codex is now running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "🗄️  Oracle EM: http://localhost:5500/em"
echo "💾 ChromaDB: http://localhost:8001"
echo ""
echo "To stop the services, run: ./scripts/stop.sh"