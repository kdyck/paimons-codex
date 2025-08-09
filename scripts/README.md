# Scripts Directory

This directory contains utility scripts for managing the Paimon's Codex development environment.

## Available Scripts

### 🚀 `start.sh` - Start Services
Start all or specific services in the development environment.

```bash
# Start all services
./scripts/start.sh

# Start specific services
./scripts/start.sh ui api          # Start UI and API only
./scripts/start.sh ui              # Start UI only
./scripts/start.sh oracle-db       # Start database only

# Get help
./scripts/start.sh --help
```

**Available Services:**
- `api` - FastAPI backend service
- `ui` - React frontend service  
- `oracle-db` - Oracle 23ai database
- `chromadb` - ChromaDB vector database
- `caddy` - Caddy reverse proxy

### 🛑 `stop.sh` - Stop Services
Stop all or specific services.

```bash
# Stop all services
./scripts/stop.sh

# Stop specific services
./scripts/stop.sh ui api           # Stop UI and API only
./scripts/stop.sh oracle-db        # Stop database only

# Stop and remove containers
./scripts/stop.sh ui --remove      # Stop UI and remove container
./scripts/stop.sh --remove         # Stop all and remove containers

# Stop and remove volumes (⚠️ deletes data!)
./scripts/stop.sh --volumes

# Get help
./scripts/stop.sh --help
```

**Options:**
- `--remove` - Remove containers after stopping
- `--volumes` - Also remove volumes (⚠️ **WARNING:** This deletes all data!)

### 🧹 `clean.sh` - Clean Environment
Completely clean the development environment, removing all containers, images, and data.

```bash
./scripts/clean.sh
```

⚠️ **WARNING:** This will delete all database data and embeddings! Use with caution.

### 🔧 `podman-setup.sh` - Setup Podman
Initialize the Podman environment for the project.

```bash
./scripts/podman-setup.sh
```

### 🚀 `start-dev.sh` - Development Mode
Start services in development mode with additional debugging features.

```bash
./scripts/start-dev.sh
```

### 🛑 `stop-dev.sh` - Stop Development Mode
Stop development mode services.

```bash
./scripts/stop-dev.sh
```

## Common Workflows

### Full Development Setup
```bash
# Initial setup
./scripts/podman-setup.sh
./scripts/start.sh

# Seed database (optional)
python scripts/seed-data.py
```

### Frontend-Only Development
```bash
# Start just UI and API
./scripts/start.sh ui api

# When done
./scripts/stop.sh ui api
```

### Backend-Only Development
```bash
# Start API and databases
./scripts/start.sh api oracle-db chromadb

# When done
./scripts/stop.sh api oracle-db chromadb
```

### Quick Restart
```bash
# Restart specific service
./scripts/stop.sh ui
./scripts/start.sh ui

# Or restart all
./scripts/stop.sh
./scripts/start.sh
```

### Clean Slate
```bash
# Complete reset
./scripts/clean.sh
./scripts/start.sh
```

## Service Dependencies

When starting specific services, be aware of dependencies:

- **UI** depends on **API**
- **API** depends on **ChromaDB** (and optionally **Oracle DB**)
- **Caddy** proxies to **UI** and **API**

For most development work:
- Frontend: `./scripts/start.sh ui api`
- Backend: `./scripts/start.sh api chromadb`
- Full stack: `./scripts/start.sh` (all services)

## Troubleshooting

### Services Won't Start
```bash
# Check Podman status
podman info

# View service logs
podman logs paimons-ui
podman logs paimons-api

# Clean restart
./scripts/clean.sh
./scripts/start.sh
```

### Port Conflicts
Default ports:
- **3000** - React UI
- **8000** - FastAPI backend
- **1521** - Oracle database
- **8001** - ChromaDB
- **8080/8443** - Caddy proxy

### Permission Issues
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

## Advanced Usage

### Override Environment Variables
```bash
# Set environment variables before starting
REACT_APP_API_URL=http://localhost:8000 ./scripts/start.sh ui
```

### Debug Mode
```bash
# Start with verbose logging
PODMAN_COMPOSE_DEBUG=1 ./scripts/start.sh
```

### Custom Configuration
Edit `docker-compose.yml` to modify service configurations before running scripts.

## Script Maintenance

When modifying these scripts:
1. Test with `--help` flag
2. Test both specific services and all services
3. Verify error handling
4. Update this README if adding new functionality

---

For more information, see the main project [README.md](../README.md).