#!/bin/bash

# Paimon's Codex - Development Start Script

# Function to show usage
show_usage() {
    echo "Usage: $0 [service1] [service2] ..."
    echo ""
    echo "Available services:"
    echo "  api               - FastAPI backend service"
    echo "  ui                - React frontend service"
    echo "  oracle-db         - Oracle 23ai database with vector search"
    echo "  caddy             - Caddy reverse proxy"
    echo "  minio             - MinIO object storage"
    echo "  ollama            - Ollama LLM server"
    echo "  stable-diffusion  - Stable Diffusion image generation service"
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    echo "You can install it with: pip install docker-compose"
    echo "Or use Docker Compose V2: docker compose"
    exit 1
fi

# Use docker compose or docker-compose based on availability
COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

# Pull latest images (only for specified services or all if none specified)
if [ -z "$TARGET_SERVICES" ]; then
    echo "📥 Pulling latest images..."
    $COMPOSE_CMD pull
else
    echo "📥 Pulling images for: $TARGET_SERVICES"
    $COMPOSE_CMD pull $TARGET_SERVICES
fi

# Build and start services
if [ -z "$TARGET_SERVICES" ]; then
    echo "🏗️  Building and starting all services..."
    $COMPOSE_CMD up --build -d
else
    echo "🏗️  Building and starting services: $TARGET_SERVICES"
    $COMPOSE_CMD up --build -d $TARGET_SERVICES
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check if containers are running
echo "🔍 Checking container status..."
if ! docker ps | grep -q paimons-ollama; then
    echo "❌ Ollama container not running"
fi
if ! docker ps | grep -q paimons-minio; then
    echo "❌ MinIO container not running"
fi
if ! docker ps | grep -q paimons-sd; then
    echo "❌ Stable Diffusion container not running"
fi

# Additional wait for heavy services
echo "⏳ Allowing extra time for AI services to initialize..."
sleep 20

# Check service status
echo "🔍 Checking service status..."
$COMPOSE_CMD ps

# Show logs from API service for debugging
echo "📋 API Service Logs:"
$COMPOSE_CMD logs --tail=20 api

# Initialize MinIO bucket and permissions
echo ""
echo "🪣 Initializing MinIO bucket..."
./scripts/init-minio-bucket.sh

# Check and pull Ollama models
echo ""
echo "🤖 Checking Ollama models..."

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
MAX_ATTEMPTS=30
attempt=0

while [ $attempt -lt $MAX_ATTEMPTS ]; do
    if curl -s http://127.0.0.1:11434/api/version > /dev/null 2>&1; then
        break
    fi
    attempt=$((attempt + 1))
    echo "Ollama not ready yet, waiting 2 seconds... (attempt $attempt/$MAX_ATTEMPTS)"
    sleep 2
done

if [ $attempt -eq $MAX_ATTEMPTS ]; then
    echo "❌ Ollama failed to become ready"
    echo "You may need to check: docker logs paimons-ollama"
else
    echo "✅ Ollama service is ready"
    
    # Check if models exist
    MODELS_RESPONSE=$(curl -s http://127.0.0.1:11434/api/tags)
    if echo "$MODELS_RESPONSE" | grep -q '"models":\[\]'; then
        echo "📥 No models found, pulling mistral..."
        if docker exec paimons-ollama ollama pull mistral; then
            echo "✅ Mistral model ready"
        else
            echo "❌ Failed to pull Mistral model"
            echo "You may need to manually run: docker exec paimons-ollama ollama pull mistral"
        fi
    elif echo "$MODELS_RESPONSE" | grep -q '"models":\['; then
        echo "✅ Ollama models already available:"
        # Extract model names using grep and sed
        echo "$MODELS_RESPONSE" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g' | sed 's/^/  - /'
    else
        echo "⚠️  Could not determine Ollama model status"
        echo "Response: $MODELS_RESPONSE"
    fi
fi

echo ""
echo "✅ Paimon's Codex is now running!"
echo ""
echo "🌐 Frontend: http://localhost:3000 (includes AI chat)"
echo "🔧 API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "🤖 AI Chat: Available via chat button in frontend"
echo "🦙 Ollama API: http://localhost:11434 (if started)"
echo "🎨 Stable Diffusion API: http://localhost:7860 (if started)"
echo "🗂️ MinIO Console: http://localhost:9001 (paimons/paimons123)"
echo "📦 MinIO API: http://localhost:9000"
echo ""
echo "To stop the services, run: ./scripts/stop.sh"