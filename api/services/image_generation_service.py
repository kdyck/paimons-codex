import os
import io
import base64
from typing import Dict, Any, List, Optional, Tuple
import logging
import asyncio
from PIL import Image, ImageDraw, ImageFont
from .sd_client import get_sd_client

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """Image generation service that communicates with separate Stable Diffusion container.
    
    This replaces the old direct model loading approach with HTTP calls to the SD service.
    """

    def __init__(self):
        self.loaded_style: Optional[str] = None
        logger.info("ImageGenerationService initialized (using SD service)")

    # ----------------------------- Utilities ---------------------------------
    def _create_placeholder_image(self, width: int, height: int, text: str) -> str:
        try:
            img = Image.new('RGB', (width, height), color='lightgray')
            draw = ImageDraw.Draw(img)
            try:
                font = ImageFont.load_default()
            except Exception:
                font = None
            bbox = draw.textbbox((0, 0), text, font=font)
            x = max(0, (width - (bbox[2] - bbox[0])) // 2)
            y = max(0, (height - (bbox[3] - bbox[1])) // 2)
            draw.text((x, y), text, fill='black', font=font)
            buf = io.BytesIO()
            img.save(buf, format='PNG', optimize=True)
            return base64.b64encode(buf.getvalue()).decode()
        except Exception as e:
            logger.error(f"Error creating placeholder image: {e}")
            return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

    @staticmethod
    def _round_to_8(value: int) -> int:
        """Round dimensions to nearest multiple of 8 for Stable Diffusion"""
        return ((value + 7) // 8) * 8

    # ----------------------------- Prompting ---------------------------------
    def build_prompts(self, prompt: str, style: str = "anime") -> Tuple[str, str]:
        style_prompts = {
            "anime": "anime style, manga art, cel-shaded, clean lines, vibrant colors",
            "realistic": "realistic, detailed, photorealistic, high quality", 
            "chibi": "chibi style, cute, kawaii, simple, rounded features",
        }
        
        # Cardinality cues to prevent multiple subjects/faces
        cardinality_cues = "solo, single subject, 1person, portrait, single character"
        
        # Determine gender-specific cues from prompt
        gender_cues = ""
        prompt_lower = prompt.lower()
        if any(word in prompt_lower for word in ["girl", "woman", "female", "she", "her"]):
            gender_cues = "1girl"
        elif any(word in prompt_lower for word in ["boy", "man", "male", "he", "him"]):
            gender_cues = "1boy"
        else:
            gender_cues = "1person"  # Gender neutral
        
        manhwa = "manhwa style, webtoon style, korean comic art, digital art, beautiful composition, dramatic lighting"
        
        # Build prompt with cardinality cues first (highest priority)
        positive = f"{cardinality_cues}, {gender_cues}, {prompt}, {style_prompts.get(style, style_prompts['anime'])}, {manhwa}"
        
        negative = (
            "lowres, blurry, jpeg artifacts, watermark, text, signature, bad anatomy, "
            "bad proportions, extra fingers, extra limbs, missing limbs, deformed, worst quality, "
            "multiple faces, two faces, double face, duplicate, mutated hands, poorly drawn hands, "
            "poorly drawn face, mutation, deformed face, ugly, bad eyes, crossed eyes, "
            "extra heads, extra arms, extra legs, malformed limbs, fused fingers, too many fingers, "
            "long neck, mutated, bad body, bad proportions, cloned face, gross proportions"
        )
        return positive, negative

    async def _check_sd_service(self) -> bool:
        """Check if SD service is available."""
        sd_client = await get_sd_client()
        return await sd_client.health_check()

    async def _generate_via_service(
        self,
        prompt: str,
        negative_prompt: str,
        width: int,
        height: int,
        steps: int = 20,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate image via the SD service."""
        sd_client = await get_sd_client()
        
        # Round dimensions
        width = self._round_to_8(width)
        height = self._round_to_8(height)
        
        result = await sd_client.generate_image(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            steps=steps,
            guidance_scale=guidance_scale,
            seed=seed
        )
        
        if "error" in result:
            raise Exception(f"SD service error: {result['error']}")
            
        return result

    # --------------------------- Public methods ------------------------------
    async def generate_character_art(
        self,
        character_prompt: str,
        *,
        style: str = "anime",
        width: int = 768,
        height: int = 1152,
        seed: Optional[int] = None,
        lora: Optional[str] = None,
        lora_scale: float = 0.8,
        hires: bool = True,
        model_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        
        # Check if SD service is available
        if not await self._check_sd_service():
            logger.warning("SD service unavailable, returning placeholder")
            img_b64 = self._create_placeholder_image(width, height, f"Character\n{character_prompt[:24]}…")
            return {
                "image_base64": img_b64,
                "prompt": f"character portrait, {character_prompt}, full body",
                "style": style,
                "width": width,
                "height": height,
                "type": "character",
                "placeholder": True,
            }

        try:
            sd_client = await get_sd_client()
            result = await sd_client.generate_character_art(
                character_prompt=character_prompt,
                style=style,
                width=width,
                height=height,
                seed=seed,
                hires=hires
            )
            
            return {
                "image_base64": result["image_base64"],
                "prompt": result.get("prompt", ""),
                "style": style,
                "width": result["width"],
                "height": result["height"],
                "type": "character",
                "seed": seed,
            }
            
        except Exception as e:
            logger.error(f"Character generation failed: {e}")
            img_b64 = self._create_placeholder_image(width, height, f"Error\n{str(e)[:30]}...")
            return {
                "image_base64": img_b64,
                "prompt": pos,
                "style": style,
                "width": width,
                "height": height,
                "type": "character",
                "error": str(e),
            }

    async def generate_scene_art(
        self,
        scene_prompt: str,
        characters: Optional[List[str]] = None,
        *,
        style: str = "anime",
        width: int = 832,
        height: int = 1216,
        seed: Optional[int] = None,
        lora: Optional[str] = None,
        lora_scale: float = 0.8,
        hires: bool = True,
        model_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        
        if not await self._check_sd_service():
            logger.warning("SD service unavailable, returning placeholder")
            img_b64 = self._create_placeholder_image(width, height, f"Scene\n{scene_prompt[:24]}…")
            return {
                "image_base64": img_b64,
                "prompt": scene_prompt,
                "style": style,
                "width": width,
                "height": height,
                "type": "scene",
                "placeholder": True,
            }

        try:
            sd_client = await get_sd_client()
            result = await sd_client.generate_scene_art(
                scene_prompt=scene_prompt,
                characters=characters,
                style=style,
                width=width,
                height=height,
                seed=seed,
                hires=hires
            )
            
            return {
                "image_base64": result["image_base64"],
                "prompt": result.get("prompt", ""),
                "style": style,
                "width": result["width"],
                "height": result["height"],
                "type": "scene",
                "seed": seed,
            }
            
        except Exception as e:
            logger.error(f"Scene generation failed: {e}")
            img_b64 = self._create_placeholder_image(width, height, f"Error\n{str(e)[:30]}...")
            return {
                "image_base64": img_b64,
                "prompt": pos,
                "style": style,
                "width": width,
                "height": height,
                "type": "scene",
                "error": str(e),
            }

    async def generate_cover_art(
        self,
        title: str,
        genre: str,
        main_character: str,
        *,
        style: str = "anime",
        width: int = 832,
        height: int = 1216,
        seed: Optional[int] = None,
        lora: Optional[str] = None,
        lora_scale: float = 0.8,
        hires: bool = True,
        model_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        
        if not await self._check_sd_service():
            logger.warning("SD service unavailable, returning placeholder")
            img_b64 = self._create_placeholder_image(width, height, f"Cover\n{title[:18]}…")
            return {
                "image_base64": img_b64,
                "prompt": f"manhwa cover art, {title}, {genre} theme",
                "style": style,
                "width": width,
                "height": height,
                "type": "cover",
                "title": title,
                "placeholder": True,
            }

        try:
            sd_client = await get_sd_client()
            result = await sd_client.generate_cover_art(
                title=title,
                genre=genre,
                main_character=main_character,
                style=style,
                width=width,
                height=height,
                seed=seed,
                hires=hires
            )
            
            return {
                "image_base64": result["image_base64"],
                "prompt": result.get("prompt", ""),
                "style": style,
                "width": result["width"],
                "height": result["height"],
                "type": "cover",
                "title": title,
                "seed": seed,
            }
            
        except Exception as e:
            logger.error(f"Cover generation failed: {e}")
            img_b64 = self._create_placeholder_image(width, height, f"Error\n{str(e)[:30]}...")
            return {
                "image_base64": img_b64,
                "prompt": pos,
                "style": style,
                "width": width,
                "height": height,
                "type": "cover",
                "title": title,
                "error": str(e),
            }

    def get_style_options(self) -> List[str]:
        return ["anime", "realistic", "chibi"]

    async def cleanup(self):
        """No cleanup needed since we use the SD service."""
        logger.info("ImageGenerationService cleanup complete")