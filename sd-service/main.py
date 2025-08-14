import os
import io
import base64
from typing import Dict, Any, List, Optional, Tuple
import logging
import asyncio
import uvicorn
import warnings
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Suppress deprecation warnings for cleaner logs
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers")
warnings.filterwarnings("ignore", category=FutureWarning, module="diffusers")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="fastapi")

# Optional deps (run without SD for placeholder mode)
try:
    import torch
    from diffusers import (
        StableDiffusionPipeline,
        StableDiffusionImg2ImgPipeline,
        DPMSolverMultistepScheduler,
    )
    STABLE_DIFFUSION_AVAILABLE = True
except Exception as e:
    logging.warning(f"Stable Diffusion dependencies not available: {e}")
    STABLE_DIFFUSION_AVAILABLE = False

# Long prompt weighting support (optional)
try:
    from compel import Compel, ReturnedEmbeddingsType
    COMPEL_AVAILABLE = True
except Exception as e:
    logging.warning(f"Compel not available - long prompts will be truncated: {e}")
    COMPEL_AVAILABLE = False

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# Global service instance
image_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage service lifecycle"""
    global image_service
    
    # Startup
    logger.info("🎨 Starting Manhwa Image Generation Service...")
    setup_models_on_startup()
    image_service = ImageGenerationService()
    logger.info("✅ Manhwa Image Generation Service ready")
    
    yield
    
    # Shutdown
    if image_service:
        await image_service.cleanup()
    logger.info("🛑 Manhwa Image Generation Service shut down")

# FastAPI app with lifespan handler
app = FastAPI(
    title="Manhwa Image Generation Service", 
    version="1.0.0",
    lifespan=lifespan
)

from image_generation_service import ImageGenerationService

# Auto-setup models on startup
def setup_models_on_startup():
    """Setup manhwa models on service startup"""
    try:
        # Create manhwa config directly since load_manhwa_models might not exist
        create_default_config()
        logger.info("✅ Manhwa model configuration ready")
    except Exception as e:
        logger.warning(f"Model setup failed (will use defaults): {e}")

def create_default_config():
    """Create default manhwa configuration"""
    import json
    
    config = {
        "recommended_settings": {
            "sampler": "DPM++ 2M Karras",
            "steps": 25,
            "cfg_scale": 7.5,
            "width": 768,
            "height": 1152,
            "clip_skip": 2,
        },
        "quality_tags": [
            "masterpiece", "best quality", "ultra detailed",
            "extremely detailed face", "perfect lighting",
            "8k uhd", "high resolution"
        ],
        "manhwa_tags": [
            "manhwa style", "korean webtoon", "digital art",
            "clean lines", "cell shading", "anime style",
            "beautiful composition", "professional artwork"
        ],
        "ssd_optimized": True,
        "nvme_paths": {
            "models": "/nvme-models",
            "outputs": "/nvme-outputs",
            "temp": "/nvme-temp"
        }
    }
    
    # Ensure NVMe directories exist
    os.makedirs("/nvme-models", exist_ok=True)
    os.makedirs("/nvme-outputs", exist_ok=True) 
    os.makedirs("/nvme-temp", exist_ok=True)
    
    # Write config to NVMe SSD
    config_path = "/nvme-models/manhwa_config.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    # Create compatibility symlink for backward compatibility
    try:
        old_path = "/models/manhwa_config.json"
        os.makedirs("/models", exist_ok=True)
        if os.path.exists(old_path):
            os.unlink(old_path)
        os.symlink(config_path, old_path)
        logger.info(f"🔗 Created compatibility symlink: {old_path} -> {config_path}")
    except Exception as e:
        logger.warning(f"Could not create symlink: {e}")
    
    logger.info(f"🎨 Created manhwa config at: {config_path}")

# Initialize on startup
setup_models_on_startup()

# Pydantic models
class CharacterRequest(BaseModel):
    character_prompt: str
    style: str = "anime"
    width: int = 768
    height: int = 1152
    seed: Optional[int] = None
    lora: Optional[str] = None
    lora_scale: float = 0.8
    hires: bool = True
    model_override: Optional[str] = None

class SceneRequest(BaseModel):
    scene_prompt: str
    characters: Optional[List[str]] = None
    style: str = "anime"
    width: int = 832
    height: int = 1216
    seed: Optional[int] = None
    lora: Optional[str] = None
    lora_scale: float = 0.8
    hires: bool = True
    model_override: Optional[str] = None

class CoverRequest(BaseModel):
    title: str
    genre: str
    main_character: str
    style: str = "anime"
    width: int = 832
    height: int = 1216
    seed: Optional[int] = None
    lora: Optional[str] = None
    lora_scale: float = 0.8
    hires: bool = True
    model_override: Optional[str] = None

class AdvancedCoverRequest(BaseModel):
    enhanced_prompt: str
    style: str = "anime"
    width: int = 832
    height: int = 1216
    seed: Optional[int] = None
    lora: Optional[str] = None
    lora_scale: float = 0.8
    hires: bool = True
    model_override: Optional[str] = None

class BatchRequest(BaseModel):
    prompts: List[str]
    style: str = "anime"
    width: int = 768
    height: int = 1152
    num_images: int = 4  # Images per prompt
    seed: Optional[int] = None
    guidance_scale: float = 7.5
    steps: int = 25
    model_override: Optional[str] = None

# Global service instance
image_service = None

# Startup/shutdown now handled by lifespan context manager

@app.get("/")
async def root():
    return {"message": "Manhwa Image Generation Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "stable_diffusion_available": STABLE_DIFFUSION_AVAILABLE,
        "compel_available": COMPEL_AVAILABLE
    }

@app.get("/styles")
async def get_styles():
    if image_service:
        return {"styles": image_service.get_style_options()}
    return {"styles": ["anime", "realistic", "chibi"]}

@app.get("/ssd-stats")
async def get_ssd_stats():
    """Get NVMe SSD usage and performance statistics."""
    if image_service:
        return image_service.get_ssd_stats()
    return {"error": "Service not initialized"}

@app.post("/generate/character")
async def generate_character(request: CharacterRequest):
    if not image_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        result = await image_service.generate_character_art(
            character_prompt=request.character_prompt,
            style=request.style,
            width=request.width,
            height=request.height,
            seed=request.seed,
            lora=request.lora,
            lora_scale=request.lora_scale,
            hires=request.hires,
            model_override=request.model_override
        )
        return result
    except Exception as e:
        logger.error(f"Character generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/scene")
async def generate_scene(request: SceneRequest):
    if not image_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        result = await image_service.generate_scene_art(
            scene_prompt=request.scene_prompt,
            characters=request.characters,
            style=request.style,
            width=request.width,
            height=request.height,
            seed=request.seed,
            lora=request.lora,
            lora_scale=request.lora_scale,
            hires=request.hires,
            model_override=request.model_override
        )
        return result
    except Exception as e:
        logger.error(f"Scene generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/cover")
async def generate_cover(request: CoverRequest):
    if not image_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        result = await image_service.generate_cover_art(
            title=request.title,
            genre=request.genre,
            main_character=request.main_character,
            style=request.style,
            width=request.width,
            height=request.height,
            seed=request.seed,
            lora=request.lora,
            lora_scale=request.lora_scale,
            hires=request.hires,
            model_override=request.model_override
        )
        return result
    except Exception as e:
        logger.error(f"Cover generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/advanced-cover")
async def generate_advanced_cover(request: AdvancedCoverRequest):
    if not image_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        result = await image_service.generate_advanced_cover_art(
            enhanced_prompt=request.enhanced_prompt,
            style=request.style,
            width=request.width,
            height=request.height,
            seed=request.seed,
            lora=request.lora,
            lora_scale=request.lora_scale,
            hires=request.hires,
            model_override=request.model_override
        )
        return result
    except Exception as e:
        logger.error(f"Advanced cover generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/batch")
async def generate_batch(request: BatchRequest):
    """High-performance batch generation optimized for 24GB VRAM"""
    if not image_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        results = await image_service.generate_batch(
            prompts=request.prompts,
            style=request.style,
            width=request.width,
            height=request.height,
            num_images=request.num_images,
            seed=request.seed,
            guidance_scale=request.guidance_scale,
            steps=request.steps,
            model_override=request.model_override
        )
        return {
            "images": results,
            "total_generated": len(results),
            "batch_info": {
                "prompts_count": len(request.prompts),
                "images_per_prompt": request.num_images,
                "style": request.style,
                "model": image_service.loaded_model_id if image_service else None
            }
        }
    except Exception as e:
        logger.error(f"Batch generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Legacy endpoint for backward compatibility
@app.post("/generate")
async def generate_legacy(request: dict):
    """Legacy endpoint that maps to character generation"""
    if not image_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Map legacy request to character request
        char_request = CharacterRequest(
            character_prompt=request.get("prompt", ""),
            style=request.get("style", "anime"),
            width=request.get("width", 768),
            height=request.get("height", 1152),
            seed=request.get("seed"),
            hires=request.get("hires", True)
        )
        
        result = await image_service.generate_character_art(
            character_prompt=char_request.character_prompt,
            style=char_request.style,
            width=char_request.width,
            height=char_request.height,
            seed=char_request.seed,
            hires=char_request.hires
        )
        return result
    except Exception as e:
        logger.error(f"Legacy generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7860,
        log_level="info"
    )