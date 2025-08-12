import os
import io
import base64
from typing import Dict, Any, List, Optional, Tuple
import logging
import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

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

# FastAPI app
app = FastAPI(title="Manhwa Image Generation Service", version="1.0.0")

from image_generation_service import ImageGenerationService

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

# Global service instance
image_service = None

@app.on_event("startup")
async def startup_event():
    global image_service
    image_service = ImageGenerationService()
    logger.info("Manhwa Image Generation Service started")

@app.on_event("shutdown")
async def shutdown_event():
    global image_service
    if image_service:
        await image_service.cleanup()
    logger.info("Manhwa Image Generation Service shut down")

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