# Stable Diffusion Service - Paimon's Codex

A containerized Stable Diffusion service for generating manhwa-style artwork with custom LoRA training capabilities. This service provides HTTP endpoints for character art, scene art, cover art generation, and comprehensive LoRA training for personalized manhwa content.

## 🎨 Features

### Image Generation
- **Character Art Generation**: Generate character portraits and full-body art with LoRA support
- **Scene Art Generation**: Create background scenes and environments
- **Cover Art Generation**: Generate manhwa cover artwork
- **Custom LoRA Integration**: Use trained character and style LoRAs in generation
- **GPU Acceleration**: CUDA support for faster generation
- **Enhanced Prompting**: Anti-artifact prompts to prevent double faces and distortions

### LoRA Training
- **Character LoRA Training**: Train lightweight models for consistent character appearance
- **Style LoRA Training**: Train models to capture your unique manhwa art style
- **Unified LoRA Training**: Single LoRA combining characters and style
- **RTX 3090 Optimized**: Memory-efficient training for 24GB VRAM
- **Automated Setup**: Complete training pipeline with guided setup

### Monitoring & Health
- **Health Monitoring**: Built-in health check endpoints
- **Training Progress**: Real-time monitoring of LoRA training
- **GPU Monitoring**: VRAM usage and performance tracking

## 🚀 Quick Start

### Prerequisites

- NVIDIA GPU with CUDA support (RTX 3090 recommended for LoRA training)
- Docker/Podman with GPU passthrough configured
- At least 8GB VRAM for generation, 12GB+ for LoRA training
- Manhwa images in `assets/` folder for training

### Running the Service

The service is automatically started as part of the main docker-compose setup:

```bash
# Start all services (including Stable Diffusion)
./scripts/start.sh

# Or start just the SD service
podman-compose up stable-diffusion
```

The service will be available at `http://localhost:7860`

## 🎭 LoRA Training Setup

### Complete Setup (Recommended)
```bash
# Run the complete LoRA setup
./scripts/setup-lora-complete.sh

# Follow the guided setup to:
# - Analyze your manhwa assets
# - Choose training strategy (Multiple/Unified/Both)
# - Create organized datasets
# - Generate training scripts
```

### Training Your LoRAs
```bash
# Option 1: Character + Style LoRAs (Best Quality)
./train_main_character_lora.sh    # Train main character
./train_manhwa_style_lora.sh      # Train art style

# Option 2: Unified LoRA (Simplest)
./train_unified_manhwa_lora.sh    # Train combined model

# Option 3: Manual Training (Advanced)
podman exec -it paimons-sd python train_lora_simple.py \
  --data_dir "/app/training-data/characters/character_main_character" \
  --output_dir "/models/lora/main_character" \
  --resolution 512 --batch_size 1 --max_steps 1150 --learning_rate 5e-5
```

### Monitor Training Progress
```bash
# Watch training logs
podman logs -f paimons-sd

# Check GPU usage
podman exec -it paimons-sd nvidia-smi

# Verify outputs
podman exec -it paimons-sd ls -la /models/lora/
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
# Returns: {"status":"healthy","device":"cuda","stable_diffusion_available":true}
```

### Character Art Generation (with LoRA support)
```bash
POST /generate/character
Content-Type: application/json

{
  "character_prompt": "sksmain_character character walking in garden",
  "style": "manhwa",
  "width": 768,
  "height": 1152,
  "seed": null,
  "lora": "main_character",
  "lora_scale": 0.8,
  "hires": true
}
```

### Scene Art Generation
```bash
POST /generate/scene
Content-Type: application/json

{
  "scene_prompt": "mystical forest with ancient trees, sksmanhwastyle",
  "characters": ["sksmain_character character"],
  "style": "manhwa",
  "width": 832,
  "height": 1216,
  "lora": "style_manhwa",
  "lora_scale": 0.6,
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
  "main_character": "sksmain_character character, mystical warrior",
  "style": "manhwa",
  "width": 832,
  "height": 1216,
  "lora": "main_character",
  "lora_scale": 0.8,
  "hires": true
}
```

### Legacy Generation (Direct Prompt)
```bash
POST /generate
Content-Type: application/json

{
  "prompt": "sksmain_character character portrait, manhwa style, detailed artwork",
  "width": 768,
  "height": 1152,
  "steps": 20,
  "guidance_scale": 7.5,
  "negative_prompt": "multiple faces, two faces, double face, duplicate, poorly drawn hands"
}
```

## ⚙️ Configuration

### Environment Variables

- `CUDA_VISIBLE_DEVICES` - GPU device selection (default: all)
- `HF_HOME` - Hugging Face cache directory (`/models`)
- `PYTHONUNBUFFERED` - Enable real-time logging

### Model Configuration

The service automatically downloads and caches models on first run:
- **Base Model**: Stable Diffusion v1.5 (`runwayml/stable-diffusion-v1-5`)
- **Custom LoRAs**: Your trained character and style models in `/models/lora/`
- **VAE**: High-quality image decoder
- **Enhanced Prompting**: Anti-artifact negative prompts for manhwa generation

### LoRA Configuration

LoRA models are automatically loaded from `/models/lora/`:
```
/models/lora/
├── main_character/          # Character LoRA
├── hero/                    # Character LoRA  
├── villain/                 # Character LoRA
├── style_manhwa/            # Style LoRA
└── manhwa_unified/          # Unified LoRA
```

## 🎯 Training Strategies

### Multiple LoRAs (Recommended)
- **Character LoRAs**: Separate model for each main character
- **Style LoRA**: Single model for your art style
- **Best for**: Maximum flexibility and character consistency
- **Usage**: `"sksmain_character character in forest, sksmanhwastyle"`

### Unified LoRA (Simplest)
- **Single LoRA**: Combines characters and style
- **Best for**: Simplicity and ease of use
- **Usage**: `"character portrait, manhwa style"`

### Training Requirements
| Type | Min Images | Recommended | Training Time (RTX 3090) |
|------|------------|-------------|-------------------------|
| Character LoRA | 5 | 8-15 | 30-60 minutes |
| Style LoRA | 20 | 30-50 | 1-2 hours |
| Unified LoRA | 20 | 50+ | 2-4 hours |

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
- **Generation**: 6-8GB VRAM
- **Character LoRA Training**: 8-10GB VRAM
- **Style LoRA Training**: 10-12GB VRAM
- **Optimal Setup**: RTX 3090 (24GB) for concurrent training + generation

### Generation Times (RTX 3090)
- **512x512**: ~1-2 seconds
- **768x1152**: ~2-4 seconds  
- **1024x1536** (hires): ~4-8 seconds

### Training Times (RTX 3090)
- **Character LoRA** (15 images): 30-60 minutes
- **Style LoRA** (40 images): 1-2 hours
- **Unified LoRA** (60 images): 2-4 hours

## 🐛 Troubleshooting

### LoRA Training Issues

**"Found 0 images for training"**
```bash
# Check data paths in container
podman exec -it paimons-sd ls -la /app/training-data/
podman exec -it paimons-sd ls -la /lora-training/

# Re-run setup if needed
./scripts/setup-lora-complete.sh
```

**"RuntimeError: Input type and weight type should be the same"**
- Fixed in latest `train_lora_simple.py`
- Models now properly moved to GPU

**Training stops/crashes**
```bash
# Check GPU memory
podman exec -it paimons-sd nvidia-smi

# Reduce batch size or resolution
# Restart container
podman restart paimons-sd
```

### Generation Issues

**Service Won't Start**
```bash
# Check container logs
podman logs paimons-sd

# Verify GPU access
podman exec paimons-sd nvidia-smi

# Restart the service
podman-compose restart stable-diffusion
```

**Double faces/artifacts in images**
- Enhanced negative prompts automatically applied
- Use cardinality cues: `"solo, 1girl, single subject"`
- Train character LoRAs for consistency

**Out of Memory Errors**
- Reduce image dimensions
- Disable high-resolution upscaling (`"hires": false`)
- Close other GPU-intensive applications

### Model Issues

**Model Download Issues**
```bash
# Clear model cache and restart
podman exec paimons-sd rm -rf /models/*
podman-compose restart stable-diffusion
```

**LoRA not loading**
```bash
# Check LoRA files exist
podman exec -it paimons-sd ls -la /models/lora/

# Verify model format and naming
# Re-train if corrupted
```

## 🔗 Integration

This service integrates with the main Paimon's Codex API:
- **API Service** connects via `SD_API_URL=http://stable-diffusion:7860`
- **Health checks** verify service availability before generation
- **LoRA Loading** automatic detection and loading of trained models
- **Enhanced Prompting** automatic application of manhwa-optimized prompts

### Using LoRAs in API Calls
```python
# From the main API service
result = await image_service.generate_character_art(
    character_prompt="main character in battle pose",
    style="manhwa",
    lora="main_character",
    lora_scale=0.8
)
```

## 📝 Development

### Local Development
```bash
cd sd-service

# Install dependencies
pip install -r requirements.txt

# Run locally (requires GPU)
python main.py
```

### Adding New LoRA Types
1. Train LoRA using `train_lora_simple.py`
2. Save to `/models/lora/[name]/`
3. Update image generation service to recognize new LoRA
4. Test with API endpoints

### Docker Build
```bash
# Build the image
podman build -t paimons-sd .

# Run with GPU support
podman run --rm --device nvidia.com/gpu=all -p 7860:7860 paimons-sd
```

## 📚 Training Scripts

### Core Scripts
- **`train_lora_simple.py`**: Main LoRA training script
- **`train_character_lora.py`**: Character-specific dataset preparation
- **`train_style_lora.py`**: Style-specific dataset preparation
- **`load_manhwa_models.py`**: Model loading and configuration

### Setup Scripts  
- **`setup-lora-complete.sh`**: Complete guided LoRA setup
- **Generated training scripts**: Auto-created `.sh` files for each character/style

## 📄 License & Models

This service uses Stable Diffusion models which have specific licensing requirements:
- **Stable Diffusion v1.5**: CreativeML Open RAIL-M License
- **Generated LoRAs**: Inherit base model licensing
- **Training Data**: Ensure you have rights to your manhwa content
- **Commercial Use**: Verify licensing for commercial applications

## 📖 Documentation

For comprehensive LoRA training guidance, see:
- **[LoRA Training Guide](../LORA_TRAINING_GUIDE.md)** - Complete setup and training tutorial
- **[Main README](../README.md)** - Project overview and architecture
- **[API Documentation](../api/README.md)** - API integration details

---

🎭 **Ready to train your manhwa LoRAs?** Run `./scripts/setup-lora-complete.sh` to get started!