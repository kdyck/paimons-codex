# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Paimon's Codex is an AI-powered manhwa creation and discovery platform with a microservices architecture:

- **FastAPI Backend** (`api/`) - REST API with async processing, service orchestration
- **React Frontend** (`ui/`) - TypeScript SPA with glassmorphism design
- **Oracle 23ai Database** - Vector search capabilities for semantic manhwa discovery
- **MinIO Object Storage** - S3-compatible storage for images and assets
- **Ollama LLM Service** - Local LLM (Mistral) for text/story generation
- **Stable Diffusion Service** (`sd-service/`) - AI image generation for character art, scenes, covers
- **Caddy Reverse Proxy** - HTTPS termination and routing

## Development Commands

### Service Management
```bash
# Start all services
./scripts/start.sh

# Start specific services  
./scripts/start.sh api ui ollama

# Stop all services
./scripts/stop.sh

# Stop specific services
./scripts/stop.sh api ui

# Clean reset (preserves AI models and MinIO data)
./scripts/clean.sh
```

### Frontend Development (React)
```bash
cd ui
npm start          # Development server (auto-reload)
npm run build      # Production build
npm test           # Run tests
```

### Backend Development (FastAPI)
The API auto-reloads via uvicorn when files change. No manual restart needed.

### Testing AI Services
```bash
# Test Stable Diffusion
curl -X POST http://localhost:7860/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "anime character", "width": 512, "height": 512}'

# Test Ollama
curl http://localhost:11434/api/tags
```

## Key Implementation Details

### API Structure
- **REST Endpoints**: `api/rest/` - manhwa CRUD, search, LLM, image management
- **Services Layer**: `api/services/` - business logic (manhwa, search, image generation)
- **LLM Integration**: `api/llm/llama_service.py` - Ollama service communication
- **Data Access**: `dal/` - Oracle and MinIO client abstractions

### AI Service Integration
- **Text Generation**: Ollama service at `http://ollama:11434` (container network)
- **Image Generation**: Stable Diffusion at `http://stable-diffusion:7860`
- **Service Discovery**: Environment variables for service URLs
- **Health Checks**: Built-in availability monitoring with fallbacks

### Database (Oracle 23ai)
- **Vector Search**: 1536-dimensional embeddings for semantic search
- **JSON Support**: Flexible metadata storage
- **Connection**: SQLAlchemy with Oracle connection pooling
- **Access**: `docker exec -it paimons-oracle sqlplus paimons_user/password123@//localhost:1521/FREEPDB1`

### Object Storage (MinIO)
- **Bucket Structure**: `codex/covers/`, `codex/characters/`, `codex/scenes/`
- **Access**: Console at http://localhost:9001 (paimons/paimons123)
- **API**: http://localhost:9000

### Frontend Architecture
- **TypeScript**: Strict typing throughout
- **Styled Components**: CSS-in-JS for component styling
- **Service Layer**: `ui/src/services/` for API communication
- **Routing**: React Router v6
- **Proxy**: API calls proxied to backend via package.json proxy

## Service Startup Dependencies

Services must start in order due to dependencies:
1. Oracle DB, MinIO (data layer)
2. Ollama, Stable Diffusion (AI services)
3. FastAPI (depends on data + AI services)
4. React Frontend, Caddy (presentation layer)

The start script handles this automatically.

## Environment Configuration

Copy `.env.example` to `.env` and configure:
- Database credentials
- MinIO access keys
- AI service URLs
- GPU settings (if available)

## GPU Acceleration (Optional)

For NVIDIA GPUs:
```bash
./scripts/setup-gpu.sh  # One-time setup
```

This enables GPU acceleration for both Ollama and Stable Diffusion services.

## Port Configuration

- **3000**: React frontend
- **8000**: FastAPI backend + docs
- **1521**: Oracle database
- **9000/9001**: MinIO API/Console
- **11434**: Ollama LLM API
- **7860**: Stable Diffusion API
- **8080/8443**: Caddy proxy HTTP/HTTPS

All services bind to localhost only for security.

## Common Development Patterns

### Adding New REST Endpoints
1. Create endpoint in `api/rest/`
2. Implement business logic in `api/services/`
3. Update main.py to include router
4. Add corresponding frontend service in `ui/src/services/`

### AI Service Integration
- Use existing service classes: `llama_service.py`, `sd_client.py`
- Implement health checks and fallback strategies
- Handle async operations properly

### Database Operations
- Use existing Oracle client in `dal/oracle_client.py`
- Leverage vector search capabilities for semantic operations
- Follow existing patterns for connection management

### Frontend Components
- Use TypeScript interfaces from `ui/src/types/`
- Follow existing component patterns with styled-components
- Implement proper error handling and loading states

## Background Processing

The system uses APScheduler for automated tasks:
- Model management
- Health monitoring  
- Content import processing

Check `api/services/background_scheduler.py` for implementation details.