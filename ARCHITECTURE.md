# Paimon's Codex Architecture

## 🏗️ System Overview

Paimon's Codex is a microservices-based AI-powered manhwa platform built with modern containerization and scalable architecture. The system combines traditional web technologies with cutting-edge AI services to create, manage, and discover manhwa content.

## 📦 Service Architecture

### Service Topology
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Caddy       │    │   React UI      │    │   FastAPI       │
│  (Reverse       │────│   (Frontend)    │────│   (Backend)     │
│   Proxy)        │    │   Port: 3000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   MinIO         │    │     Ollama      │
         │              │ (Object Store)  │    │ (LLM Service)   │
         │              │ Port: 9000/9001 │    │  Port: 11434    │
         │              └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │  Oracle 23ai    │    │ Stable Diffusion│
         └──────────────│ (Database +     │    │ (AI Art Gen)    │
                        │ Vector Search)  │    │   Port: 7860    │
                        │   Port: 1521    │    └─────────────────┘
                        └─────────────────┘
```

### Service Layers

#### **Tier 1: Presentation & Proxy**
- **Caddy Reverse Proxy** (`paimons-caddy`)
  - HTTPS termination and SSL certificates
  - Load balancing and request routing
  - Security headers and CORS handling
  - Ports: 8080 (HTTP), 8443 (HTTPS)

- **React Frontend** (`paimons-ui`)
  - Modern SPA with TypeScript
  - Glassmorphism UI design
  - Dark/Light theme support
  - Real-time AI content integration
  - Port: 3000

#### **Tier 2: API Gateway**
- **FastAPI Backend** (`paimons-api`)
  - RESTful API with OpenAPI documentation
  - Async request handling
  - Service orchestration and coordination
  - Background task management
  - Port: 8000

#### **Tier 3: AI/ML Services**
- **Ollama LLM Service** (`paimons-ollama`)
  - Large Language Model inference
  - Llama3.2 model serving
  - Story and character generation
  - GPU acceleration support
  - Port: 11434

- **Stable Diffusion Service** (`paimons-sd`)
  - AI image generation
  - Character art, scenes, and covers
  - Multiple art style support
  - High-resolution upscaling
  - Port: 7860

#### **Tier 4: Data Layer**
- **Oracle 23ai Database** (`paimons-oracle`)
  - Relational data storage
  - Vector search capabilities
  - JSON document support
  - Enterprise-grade performance
  - Port: 1521

- **MinIO Object Storage** (`paimons-minio`)
  - S3-compatible storage
  - Image and asset management
  - Public read access for web delivery
  - Ports: 9000 (API), 9001 (Console)

## 🔄 Data Flow Architecture

### Request Processing Flow
```
User Request → Caddy Proxy → React UI → FastAPI API → Backend Services
```

### AI Generation Pipeline
```
Admin Panel → API Endpoint → {
    ├── Ollama Service (Text Generation)
    ├── Stable Diffusion (Image Generation)
    └── MinIO Storage (Asset Management)
} → Oracle Database (Metadata Storage) → UI Display
```

### Content Delivery Flow
```
Browser Request → Caddy → {
    ├── Static Assets (MinIO)
    ├── API Data (FastAPI)
    └── Vector Search (Oracle)
} → Rendered Content
```

## 🧠 AI/ML Integration

### Dual AI Architecture
The system employs a parallel AI processing approach:

1. **Text Generation Pipeline**
   - **Service**: Ollama container running Llama3.2
   - **Interface**: `api/llm/llama_service.py`
   - **Capabilities**: Story generation, character development, summaries
   - **Features**: Context-aware generation, customizable parameters

2. **Image Generation Pipeline**
   - **Service**: Custom Stable Diffusion container
   - **Interface**: `api/services/image_generation_service.py`
   - **Capabilities**: Character art, scene generation, cover artwork
   - **Features**: Style customization, high-resolution output, batch processing

### AI Service Communication
```python
# Service Discovery via Environment Variables
OLLAMA_BASE_URL = "http://10.89.0.4:11434"
SD_API_URL = "http://10.89.0.5:7860"

# Health Check Integration
async def check_ai_services():
    ollama_healthy = await ollama_service.health_check()
    sd_healthy = await sd_service.health_check()
    return {"ollama": ollama_healthy, "stable_diffusion": sd_healthy}
```

### Fallback Strategies
- **Graceful Degradation**: Placeholder content when AI services unavailable
- **Health Monitoring**: Continuous service availability checking
- **Error Recovery**: Automatic retry mechanisms with exponential backoff

## 🗄️ Data Architecture

### Database Design (Oracle 23ai)
```sql
-- Core manhwa metadata
CREATE TABLE manhwa (
    id VARCHAR2(50) PRIMARY KEY,
    title NVARCHAR2(200) NOT NULL,
    description CLOB,
    embedding VECTOR(1536),  -- Vector search support
    metadata JSON,           -- Flexible schema
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector similarity search
CREATE VECTOR INDEX manhwa_embedding_idx ON manhwa (embedding)
ORGANIZATION NEIGHBOR PARTITIONS
WITH DISTANCE COSINE;
```

### Object Storage Organization
```
codex/                          # MinIO bucket
├── covers/                     # Manhwa cover images
│   ├── {manhwa_id}/
│   └── generated/              # AI-generated covers
├── characters/                 # Character artwork
│   ├── {manhwa_id}/
│   └── generated/              # AI-generated characters
├── scenes/                     # Scene artwork
│   ├── {manhwa_id}/
│   └── generated/              # AI-generated scenes
└── chapters/                   # Chapter pages
    └── {manhwa_id}/
        └── {chapter_id}/
```

### Vector Search Implementation
- **Embedding Generation**: Text content converted to 1536-dimensional vectors
- **Similarity Search**: Cosine distance for semantic matching
- **Hybrid Search**: Combines vector similarity with traditional filters
- **Real-time Indexing**: Automatic embedding updates on content changes

## 📊 Network Architecture

### Internal Service Communication
```
Container Network (10.89.0.x):
├── API Gateway     → 10.89.0.2:8000
├── MinIO          → 10.89.0.3:9000
├── Ollama         → 10.89.0.4:11434
├── Stable Diff    → 10.89.0.5:7860
└── Oracle         → 10.89.0.6:1521
```

### External Access Points
- **Web Application**: `http://localhost:3000`
- **API Documentation**: `http://localhost:8000/docs`
- **MinIO Console**: `http://localhost:9001`
- **Proxy Access**: `http://localhost:8080`

### Security Configuration
```yaml
# Port binding strategy - localhost only
ports:
  - "127.0.0.1:3000:3000"    # UI
  - "127.0.0.1:8000:8000"    # API
  - "127.0.0.1:9000:9000"    # MinIO API
  - "127.0.0.1:9001:9001"    # MinIO Console
  - "127.0.0.1:11434:11434"  # Ollama
  - "127.0.0.1:7860:7860"    # Stable Diffusion
```

## 🔧 Background Processing

### Task Scheduler Architecture
```python
# APScheduler integration
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

# Automated tasks
@scheduler.scheduled_job('cron', hour=2)  # Daily at 2 AM
async def automated_import():
    """Import new manhwa content"""
    
@scheduler.scheduled_job('interval', minutes=30)
async def health_monitor():
    """Monitor service health"""
```

### Service Management
- **Startup Orchestration**: Services initialized in dependency order
- **Health Monitoring**: Continuous availability checking
- **Graceful Shutdown**: Proper resource cleanup on termination
- **Auto-restart**: Container restart policies for high availability

## 💾 Storage Strategy

### Persistent Volumes
```yaml
volumes:
  oracle_data:      # Database files and logs
  minio_data:       # Object storage files
  ollama_models:    # LLM model cache (~10-15GB)
  sd_models:        # Stable Diffusion models (~20-30GB)
  caddy_data:       # SSL certificates and proxy config
  caddy_config:     # Caddy configuration data
```

### Development Volumes
```yaml
# Hot reload support
volumes:
  - ./api:/app                    # API source code
  - ./ui:/app                     # UI source code
  - ./dal:/app/dal               # Shared data access layer
  - ./sd-service:/app            # SD service code
```

## 🚀 Performance Optimization

### Hardware Utilization
- **GPU Acceleration**: Both AI services use NVIDIA GPU passthrough
- **Memory Management**: Containerized resource allocation
- **Storage Performance**: NVMe SSD optimization for model loading
- **CPU Efficiency**: Multi-threaded processing where applicable

### Caching Strategy
- **Model Persistence**: AI models cached across container restarts
- **Database Connections**: Connection pooling for Oracle
- **Static Assets**: CDN-style delivery via MinIO
- **API Responses**: Strategic caching of expensive operations

### Scalability Considerations
```yaml
# Horizontal scaling ready
deploy:
  replicas: 3
  resources:
    limits:
      memory: 8G
      cpus: '4'
  placement:
    constraints:
      - node.role == worker
```

## 🔐 Security Architecture

### Container Security
- **Isolation**: Each service runs in isolated container
- **Network Segmentation**: Internal communication only
- **Secret Management**: Environment variable configuration
- **Image Security**: Regular base image updates

### API Security
```python
# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Data Protection
- **Database Security**: Oracle enterprise security features
- **Object Storage**: Configurable access policies
- **Network Security**: Localhost-only external access
- **SSL/TLS**: Caddy automatic HTTPS certificates

## 📈 Monitoring & Observability

### Health Check Implementation
```python
# Service health endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "database": await check_oracle_health(),
            "storage": await check_minio_health(),
            "llm": await check_ollama_health(),
            "image_gen": await check_sd_health()
        }
    }
```

### Logging Strategy
- **Structured Logging**: JSON format for log aggregation
- **Service Correlation**: Request tracing across services
- **Error Tracking**: Comprehensive error reporting
- **Performance Metrics**: Response time and throughput monitoring

## 🔄 Development Workflow

### Local Development Setup
1. **GPU Setup**: `./scripts/setup-gpu.sh` (one-time)
2. **Environment Initialization**: `./scripts/clean.sh && ./scripts/start.sh`
3. **Asset Population**: `python scripts/upload_assets.py`
4. **Database Seeding**: `python scripts/seed-data.py`

### Hot Reload Support
- **API Changes**: FastAPI auto-reload on code changes
- **UI Changes**: React hot module replacement
- **Service Updates**: Docker volume mounts for development

### Testing Strategy
```bash
# Service health verification
curl http://localhost:8000/health

# AI service testing
curl -X POST http://localhost:7860/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "anime character", "width": 512, "height": 512}'
```

## 📚 API Architecture

### RESTful Endpoint Organization
```
/api/v1/
├── manhwa/           # CRUD operations for manhwa
├── search/           # Search and discovery
├── llm/              # AI text generation
├── images/           # Image upload and management
└── admin/            # Administrative functions
```

### Service Integration Patterns
- **Circuit Breaker**: Prevent cascading failures
- **Retry Logic**: Automatic retry with backoff
- **Bulkhead Pattern**: Service isolation
- **Health Checks**: Continuous monitoring

This architecture provides a robust, scalable foundation for AI-powered manhwa content creation and management, leveraging modern containerization and microservices principles.