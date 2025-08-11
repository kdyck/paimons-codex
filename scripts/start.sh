#!/bin/bash

# Paimon's Codex - Development Start Script

# Function to show usage
show_usage() {
    echo "Usage: $0 [service1] [service2] ..."
    echo ""
    echo "Available services:"
    echo "  api        - FastAPI backend service"
    echo "  ui         - React frontend service"
    echo "  oracle-db  - Oracle 23ai database with vector search"
    echo "  caddy      - Caddy reverse proxy"
    echo "  minio      - MinIO object storage"
    echo "  open-webui - Open WebUI AI chat interface"
    echo ""
    echo "Examples:"
    echo "  $0           # Start all services"
    echo "  $0 api       # Start only API service"
    echo "  $0 ui api    # Start UI and API services"
    echo "  $0 --help    # Show this help"
    exit 0
}

# Check for help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_usage
fi

# Get target services
TARGET_SERVICES="$@"
if [ -z "$TARGET_SERVICES" ]; then
    echo "🚀 Starting ALL Paimon's Codex services..."
    TARGET_SERVICES=""
else
    echo "🚀 Starting specified services: $TARGET_SERVICES"
fi

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

# Pull latest images (only for specified services or all if none specified)
if [ -z "$TARGET_SERVICES" ]; then
    echo "📥 Pulling latest images..."
    podman-compose pull
else
    echo "📥 Pulling images for: $TARGET_SERVICES"
    podman-compose pull $TARGET_SERVICES
fi

# Build and start services
if [ -z "$TARGET_SERVICES" ]; then
    echo "🏗️  Building and starting all services..."
    podman-compose up --build -d
else
    echo "🏗️  Building and starting services: $TARGET_SERVICES"
    podman-compose up --build -d "$TARGET_SERVICES"
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
podman-compose ps

# Show logs from API service for debugging
echo "📋 API Service Logs:"
podman-compose logs --tail=20 api

# Initialize MinIO bucket and permissions
echo ""
echo "🪣 Initializing MinIO bucket..."
./scripts/init-minio-bucket.sh

echo ""
echo "✅ Paimon's Codex is now running!"
echo ""
echo "🌐 Frontend: http://localhost:3000 (includes AI chat)"
echo "🔧 API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "🤖 AI Chat: Available via chat button in frontend"
echo "🗂️  MinIO Console: http://localhost:9001 (paimons/paimons123)"
echo "📦 MinIO API: http://localhost:9000"
echo ""
echo "To stop the services, run: ./scripts/stop.sh"