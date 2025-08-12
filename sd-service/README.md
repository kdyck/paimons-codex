# Stable Diffusion Service

A containerized Stable Diffusion service for generating manhwa-style artwork. This service provides HTTP endpoints for character art, scene art, and cover art generation.

## 🎨 Features

- **Character Art Generation**: Generate character portraits and full-body art
- **Scene Art Generation**: Create background scenes and environments
- **Cover Art Generation**: Generate manhwa cover artwork
- **GPU Acceleration**: CUDA support for faster generation
- **Health Monitoring**: Built-in health check endpoints
- **Manhwa Style Focus**: Optimized prompts for Korean webtoon aesthetics

## 🚀 Quick Start

### Prerequisites

- NVIDIA GPU with CUDA support (recommended)
- Docker/Podman with GPU passthrough configured
- At least 8GB VRAM for optimal performance

### Running the Service

The service is automatically started as part of the main docker-compose setup:

```bash
# Start all services (including Stable Diffusion)
./scripts/start.sh

# Or start just the SD service
podman-compose up stable-diffusion
```

The service will be available at `http://localhost:7860`

## 📡 API Endpoints

### Health Check
```bash
GET /health
# Returns: {"status":"healthy","device":"cuda","stable_diffusion_available":true}
```

### Character Art Generation
```bash
POST /generate/character
Content-Type: application/json

{
  "character_prompt": "young hero with dark hair",
  "style": "anime",
  "width": 768,
  "height": 1152,
  "seed": null,
  "hires": true
}
```

### Scene Art Generation
```bash
POST /generate/scene
Content-Type: application/json

{
  "scene_prompt": "mystical forest with ancient trees",
  "characters": ["hero", "mage"],
  "style": "anime",
  "width": 832,
  "height": 1216,
  "seed": null,
  "hires": true
}
```

### Cover Art Generation
```bash
POST /generate/cover
Content-Type: application/json

{
  "title": "The Last Guardian",
  "genre": "fantasy",
  "main_character": "mystical warrior",
  "style": "anime",
  "width": 832,
  "height": 1216,
  "seed": null,
  "hires": true
}
```

### Basic Generation (Direct Prompt)
```bash
POST /generate
Content-Type: application/json

{
  "prompt": "anime character portrait",
  "width": 512,
  "height": 512,
  "steps": 20,
  "guidance_scale": 7.5,
  "negative_prompt": "blurry, low quality"
}
```

## ⚙️ Configuration

### Environment Variables

- `CUDA_VISIBLE_DEVICES` - GPU device selection (default: all)
- `HF_HOME` - Hugging Face cache directory
- `TORCH_CACHE` - PyTorch model cache directory

### Model Configuration

The service automatically downloads and caches Stable Diffusion models on first run:
- **Base Model**: Stable Diffusion XL or similar
- **Style LoRAs**: Anime/manga style adaptations
- **VAE**: High-quality image decoder

## 🎯 Art Styles

Supported art styles:
- `anime` - Anime/manga style with cel-shading
- `realistic` - Photorealistic style
- `chibi` - Cute, stylized characters

All styles are enhanced with manhwa-specific prompting for Korean webtoon aesthetics.

## 🔧 GPU Setup

### WSL2 + NVIDIA Setup
```bash
# Run the GPU setup script (one-time)
./scripts/setup-gpu.sh

# Restart containers to apply GPU access
./scripts/stop.sh && ./scripts/start.sh
```

### Verify GPU Access
```bash
# Check if GPU is available to the container
podman exec paimons-sd nvidia-smi

# Test CUDA in Python
podman exec paimons-sd python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```

## 📊 Performance

### VRAM Usage
- **Minimum**: 6GB VRAM (basic generation)
- **Recommended**: 8GB+ VRAM (high-resolution with upscaling)
- **Optimal**: 12GB+ VRAM (multiple concurrent generations)

### Generation Times (RTX 3080)
- **512x512**: ~2-3 seconds
- **768x1152**: ~4-6 seconds  
- **1024x1536** (hires): ~8-12 seconds

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check container logs
podman logs paimons-sd

# Verify GPU access
podman exec paimons-sd nvidia-smi

# Restart the service
podman-compose restart stable-diffusion
```

### Out of Memory Errors
- Reduce image dimensions
- Disable high-resolution upscaling (`"hires": false`)
- Close other GPU-intensive applications
- Use `torch.cuda.empty_cache()` via the health endpoint

### Model Download Issues
```bash
# Clear model cache and restart
podman exec paimons-sd rm -rf /root/.cache/huggingface
podman-compose restart stable-diffusion
```

### Connection Issues
- Verify the service is running: `curl http://localhost:7860/health`
- Check firewall settings
- Ensure correct port mapping in docker-compose.yml

## 🔗 Integration

This service integrates with the main Paimon's Codex API:
- **API Service** connects via `SD_API_URL=http://stable-diffusion:7860`
- **Health checks** verify service availability before generation
- **Error handling** provides placeholder images when service unavailable

## 📝 Development

### Local Development
```bash
cd sd-service

# Install dependencies
pip install -r requirements.txt

# Run locally (requires GPU)
python main.py
```

### Docker Build
```bash
# Build the image
podman build -t paimons-sd .

# Run with GPU support
podman run --rm --device nvidia.com/gpu=all -p 7860:7860 paimons-sd
```

## 📄 Model License

This service uses Stable Diffusion models which have specific licensing requirements:
- Check model cards on Hugging Face for usage terms
- Commercial use may require appropriate licensing
- Generated images inherit model license restrictions

---

For integration details, see the main [README.md](../README.md) and [API documentation](../api/README.md).