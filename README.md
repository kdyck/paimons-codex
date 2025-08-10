# 📚 Paimon's Codex

A modern manhwa discovery platform powered by AI, built with FastAPI, React, and Oracle 23ai with vector search.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Caddy       │    │   React UI      │    │   FastAPI       │
│  (Reverse       │────│   (Frontend)    │────│   (Backend)     │
│   Proxy)        │    │   Port: 3000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │              ┌─────────────────┐
         │                       │              │   MinIO         │
         │                       │              │ (Object Store)  │
         │                       │              │ Port: 9000/9001 │
         │                       │              └─────────────────┘
         │                       │                       │
         │                       │              ┌─────────────────┐
         │                       │              │  Oracle 23ai    │
         │                       └──────────────│ (Database +     │
         │                                      │ Vector Search)  │
         │                                      │   Port: 1521    │
         └──────────────────────────────────────└─────────────────┘
```

## 📁 Project Structure

```
paimons-codex/
├── api/                    # FastAPI backend service
│   ├── rest/              # REST API endpoints
│   ├── services/          # Business logic services
│   ├── llm/               # LLM integration (Open LLaMA)
│   └── main.py            # FastAPI application entry point
├── dal/                   # Data Access Layer
│   ├── oracle_client.py   # Oracle 23ai database client with vector search
│   └── minio_client.py    # MinIO object storage client
├── ui/                    # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service calls
│   │   └── types/         # TypeScript type definitions
│   └── package.json
├── config/                # Configuration files
│   ├── Caddyfile         # Caddy reverse proxy config
│   └── oracle/           # Oracle initialization scripts
├── scripts/               # Utility scripts
│   ├── start.sh          # Development start script
│   ├── stop.sh           # Stop services script
│   ├── clean.sh          # Clean reset script
│   └── seed-data.py      # Database seeding script
└── docker-compose.yml     # Docker services configuration
```

## 🚀 Quick Start

### Prerequisites

- Podman and podman-compose
- Git

**Install podman-compose:**
```bash
pip install podman-compose
```

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

### 3. Start the Development Environment

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start all services
./scripts/start.sh
```

### 4. Seed the Database (Optional)

```bash
# Wait for services to be fully started, then seed sample data
python scripts/seed-data.py
```

### 5. Access the Application

- **Website**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Oracle Enterprise Manager**: http://localhost:5500/em
- **MinIO Console**: http://localhost:9001 (Login: `paimons/paimons123`)
- **MinIO API**: http://localhost:9000

## 🛠️ Services

### FastAPI Backend (`api/`)
- **REST API**: Manhwa CRUD operations, search endpoints
- **LLM Integration**: Open LLaMA for text generation and summarization
- **Authentication**: JWT-based authentication (future enhancement)
- **Vector Search**: Oracle 23ai vector capabilities for semantic search

### React Frontend (`ui/`)
- **Modern UI**: Styled-components with glassmorphism design
- **Search**: Real-time manhwa search with AI-powered recommendations
- **Responsive**: Mobile-first responsive design
- **TypeScript**: Full TypeScript support for type safety

### Oracle 23ai Database
- **Relational Data**: Manhwa metadata, user data, reviews
- **Vector Search**: Built-in vector similarity search with VECTOR data type
- **JSON Support**: Advanced JSON document features
- **Performance**: Enterprise-grade performance and reliability
- **AI Integration**: Embeddings stored directly in database for faster queries

### MinIO Object Storage
- **Image Storage**: Manhwa cover images and content
- **S3-Compatible API**: Standard object storage operations
- **Web Console**: Browser-based file management interface
- **Scalable**: High-performance distributed object storage

### Caddy Reverse Proxy
- **HTTPS**: Automatic HTTPS certificates
- **Load Balancing**: Service routing and load balancing
- **Security Headers**: Built-in security headers and protection

## 🔧 Development

### API Development

```bash
# Navigate to API directory
cd api

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
# Navigate to UI directory
cd ui

# Install dependencies
npm install

# Start development server
npm start
```

### Database Management

```bash
# Connect to Oracle container
podman exec -it paimons-oracle sqlplus paimons_user/password123@//localhost:1521/FREEPDB1

# Check Oracle vector search capability
# In Oracle SQL:
# SELECT * FROM manhwa WHERE embedding IS NOT NULL;
```

## 📊 API Endpoints

### Manhwa Management
- `GET /api/manhwa/` - List all manhwa
- `GET /api/manhwa/{id}` - Get specific manhwa
- `POST /api/manhwa/` - Create new manhwa
- `PUT /api/manhwa/{id}` - Update manhwa
- `DELETE /api/manhwa/{id}` - Delete manhwa

### Search & Discovery
- `GET /api/search/?q={query}` - Search manhwa
- `GET /api/manhwa/{id}/similar` - Find similar manhwa using vector search

### Image Management
- `POST /api/images/upload` - Upload single image
- `POST /api/images/upload-multiple` - Upload multiple images
- `DELETE /api/images/{filename}` - Delete image

### AI Features
- `POST /api/llm/generate` - Generate text with LLaMA
- `POST /api/llm/summarize` - Summarize manhwa

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

### Development
```bash
./scripts/start.sh    # Start development environment
./scripts/stop.sh     # Stop all services
```

### Production Deployment
1. Update environment variables for production
2. Configure domain in Caddyfile
3. Set up proper secrets management
4. Enable monitoring and backups

### Clean Reset
```bash
./scripts/clean.sh    # Remove all data and reset environment
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
1. Check the logs: `podman-compose logs <service-name>`
2. Verify service health: `podman-compose ps`
3. Review configuration files
4. Open an issue with detailed information

---

**Happy coding! 🚀**