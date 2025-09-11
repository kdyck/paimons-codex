# 📚 Paimon's Codex

An AI-powered manhwa creation and discovery platform designed for local development and experimentation. Generate complete manhwa stories with AI text generation and stunning artwork using Stable Diffusion, all backed by Oracle 23ai vector search and modern web technologies.

## 🚀 Key Features

- 🤖 **AI Manhwa Generation**: Complete manhwa creation with story, characters, and artwork
- 🎨 **Stable Diffusion Integration**: Generate character art, scenes, and cover artwork
- 💬 **LLM Text Generation**: Powered by Ollama/Mistral for story creation
- 🔍 **Vector Search**: Oracle 23ai semantic search for manhwa discovery  
- 📱 **Modern UI**: React frontend with glassmorphism design
- 🐳 **Containerized**: Full Podman/Docker setup with GPU acceleration
- 📊 **Background Processing**: Automated importing and content management
- ⚡ **High Performance**: Optimized for high-end hardware with RTX 30/40 series GPUs

## 🏗️ Architecture

**Microservices Architecture:**
- **Frontend**: React UI + Caddy reverse proxy
- **Backend**: FastAPI with async processing  
- **AI Services**: Ollama (LLM) + Stable Diffusion (image generation)
- **Data Layer**: Oracle 23ai (vector search) + MinIO (object storage)

📋 **[See ARCHITECTURE.md for detailed technical documentation →](./ARCHITECTURE.md)**

## 📁 Project Structure

```
paimons-codex/
├── api/                    # FastAPI backend service
│   ├── rest/              # REST API endpoints (manhwa, llm, images, import)
│   ├── services/          # Business logic services
│   ├── llm/               # LLM integration (Ollama/Mistral)
│   └── main.py            # FastAPI application entry point
├── dal/                   # Data Access Layer
│   ├── oracle_client.py   # Oracle 23ai database client with vector search
│   └── minio_client.py    # MinIO object storage client
├── ui/                    # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components (including admin panel)
│   │   ├── services/      # API service calls
│   │   └── types/         # TypeScript type definitions
│   └── package.json
├── sd-service/            # Stable Diffusion AI image generation service
│   ├── main.py           # FastAPI service for AI art generation
│   ├── image_generation_service.py  # Core SD functionality
│   └── Dockerfile        # Container configuration
├── config/                # Configuration files
│   ├── Caddyfile         # Caddy reverse proxy config
│   ├── minio-init.sh     # MinIO automatic setup script
│   └── oracle/           # Oracle initialization scripts
├── scripts/               # Utility scripts
│   ├── start.sh          # Development start script (auto-setup)
│   ├── stop.sh           # Stop services script
│   ├── clean.sh          # Clean reset script
│   ├── setup-gpu.sh      # GPU acceleration setup (WSL2+NVIDIA)
│   ├── upload_assets.py  # Upload manhwa images to MinIO
│   └── seed-data.py      # Database seeding script
└── docker-compose.yml     # All 7 services configuration
```

## 🚀 Quick Start

### Prerequisites

- **OS**: Windows 11, macOS, or Linux (cross-platform Docker support)
- **GPU**: NVIDIA RTX 3090/4090 or similar (24GB VRAM ideal for high-resolution generation)
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: NVMe SSD with at least 50GB free space
- **Software**: Docker Desktop or Docker Engine with GPU support

**Install Docker:**
- **Windows/macOS**: Download Docker Desktop from https://docker.com
- **Linux**: Install Docker Engine via package manager

### 1. Clone the Repository

```bash
git clone <repository-url>
cd paimons-codex
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env file with your configuration
```

### 3. GPU Setup (Optional - NVIDIA GPU)

If you have an NVIDIA GPU and want to enable GPU acceleration for AI models:

```bash
# Setup GPU support (cross-platform, one-time setup)
./scripts/setup-gpu.sh
```

### 4. Start the Development Environment

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Clean and start all services (recommended for initial setup)
./scripts/clean.sh
./scripts/start.sh
```

**Note**: The startup script automatically handles setup:
- **MinIO**: Creates the `codex` bucket with public read permissions
- **Ollama**: Pulls mistral model if no models are found
- **Health Checks**: Verifies all services are running properly
- This happens automatically during `./scripts/start.sh`

### 5. Upload Assets (Optional)

To populate the application with sample manhwa covers and images:

```bash
# Upload images from assets directory to MinIO
python scripts/upload_assets.py
```

### 6. Seed the Database (Optional)

```bash
# Wait for services to be fully started, then seed sample data
python scripts/seed-data.py
```

### 7. Access the Application

- **Website**: http://localhost:3000
- **AI Chat Assistant**: http://localhost:3001 (also integrated in main app)
- **API Documentation**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (Login: `paimons/paimons123`)
- **MinIO API**: http://localhost:9000
- **Stable Diffusion API**: http://localhost:7860
- **Ollama API**: http://localhost:11434

## ⚡ Performance

### Optimal Hardware Configuration
Tested on **Intel i9-12900KF + RTX 3090 + 32GB RAM**:

**Image Generation (Stable Diffusion):**
- **512×512**: ~1-2 seconds
- **768×1152** (character portraits): ~3-4 seconds
- **1024×1536** (high-res with upscaling): ~6-8 seconds
- **Batch generation**: Multiple images in parallel

**Text Generation (Ollama/Mistral):**
- **Short responses** (100 tokens): ~1-2 seconds
- **Story generation** (1000+ tokens): ~10-15 seconds
- **Full manhwa stories**: ~30-60 seconds

**Memory Usage:**
- **GPU VRAM**: 8-12GB during generation (RTX 3090's 24GB is excellent)
- **System RAM**: 4-8GB per container
- **Storage**: Models cache ~20-30GB total

## 🛠️ Services Overview

**7 Containerized Services (Docker):**
- **FastAPI Backend**: REST API with async processing and service orchestration
- **React Frontend**: Modern TypeScript SPA with glassmorphism design
- **Caddy Proxy**: HTTPS termination, load balancing, and security headers
- **Oracle 23ai**: Enterprise database with built-in vector search capabilities
- **MinIO**: S3-compatible object storage with web console
- **Ollama**: LLM service running Mistral for text generation
- **Stable Diffusion**: AI image generation service for artwork creation

📋 **[See ARCHITECTURE.md for detailed service specifications →](./ARCHITECTURE.md)**

## 🔧 Development

### Using the Scripts (Recommended)
Always use the provided scripts for consistent service management:

```bash
# Start all services
./scripts/start.sh

# Start specific services
./scripts/start.sh api ui ollama

# Stop all services
./scripts/stop.sh

# Stop specific services
./scripts/stop.sh api ui

# Clean reset (removes containers and some volumes)
./scripts/clean.sh

# Check available options
./scripts/start.sh --help
./scripts/stop.sh --help
```

### Local Development
All services support hot-reload for rapid development:

```bash
# API changes auto-reload via uvicorn --reload
# UI changes use React Hot Module Replacement  
# Service logs: Check logs via start script output or docker compose logs -f <service_name>
```

### Database Access
```bash
# Connect to Oracle container
docker exec -it paimons-oracle sqlplus paimons_user/password123@//localhost:1521/FREEPDB1

# Vector search examples available in ARCHITECTURE.md
```

### Testing AI Services
```bash
# Test Stable Diffusion
curl -X POST http://localhost:7860/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "anime character", "width": 512, "height": 512}'

# Test Ollama
curl http://localhost:11434/api/tags
```

## 📊 API Endpoints

The platform provides 30+ REST endpoints across 5 main categories:

### Core Endpoints
- **Manhwa Management**: CRUD operations (`/api/v1/manhwa/`)
- **Search & Discovery**: Vector search and filtering (`/api/v1/search/`)
- **Image Management**: Upload and asset handling (`/api/v1/images/`)
- **AI Generation**: Text and image generation (`/api/v1/llm/`)
- **Admin Functions**: Import and management tools (`/api/v1/admin/`)

### Key AI Features
- `POST /api/v1/llm/generate-full-manhwa` - Complete manhwa generation with story + art
- `POST /api/v1/llm/generate-character-art` - AI character artwork
- `POST /api/v1/llm/generate-scene-art` - AI scene generation
- `POST /api/v1/llm/chat` - Interactive AI chat

📋 **[Full API documentation available at http://localhost:8000/docs when running](http://localhost:8000/docs)**

## 🔐 Security Features

- **HTTPS Enforcement**: Automatic HTTPS redirects
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **CORS Configuration**: Proper CORS setup for API access
- **Input Validation**: Pydantic models for request validation

## 📈 Monitoring & Logging

- **Structured Logging**: JSON-formatted logs
- **Health Checks**: Service health monitoring
- **Performance Metrics**: Built-in performance tracking

## 🚦 Environment Management

### Local Development
```bash
./scripts/start.sh    # Start development environment
./scripts/stop.sh     # Stop all services
```

### Production Deployment Considerations

⚠️ **This setup is designed for local development**. For production deployment, consider:

**Recommended Changes:**
- **Object Storage**: Replace MinIO with OCI Object Storage (simpler licensing)
- **Database**: Use managed Oracle Cloud Database or Oracle Autonomous Database  
- **Container Platform**: Deploy to OCI Container Instances or Kubernetes
- **Security**: Implement proper authentication, HTTPS certificates, and secrets management
- **Monitoring**: Add logging, metrics, and health monitoring
- **Scaling**: Use managed services for high availability

**Benefits of Managed Services:**
- Simplified licensing (no AGPL concerns)
- Better security and compliance
- Automatic scaling and backups
- Professional support

### Clean Reset
```bash
./scripts/clean.sh    # Remove containers and selective volumes (preserves models)
./scripts/clean.sh -y # Auto-confirm the cleanup (non-interactive)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the logs: Use `./scripts/start.sh` for startup logs or `docker compose logs <service-name>`
2. Verify service health: `docker compose ps`
3. Review configuration files
4. Open an issue with detailed information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Third-Party Services**: This project uses several third-party services (MinIO, Oracle, AI models) with their own licensing terms. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for complete licensing information.

## 🙏 Acknowledgments

- **Oracle 23ai** for advanced vector search capabilities
- **Stability AI** for Stable Diffusion models
- **Meta AI** for Llama language models
- **FastAPI** and **React** communities for excellent frameworks
- **Docker** for containerization technology

---

**Happy coding! 🚀**