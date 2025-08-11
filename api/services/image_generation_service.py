import os
import io
import base64
from typing import Dict, Any, List, Optional
import logging

# Handle optional imports gracefully
try:
    import torch
    from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
    STABLE_DIFFUSION_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Stable Diffusion dependencies not available: {e}")
    STABLE_DIFFUSION_AVAILABLE = False

# PIL should always be available since it's in base requirements
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

class ImageGenerationService:
    def __init__(self):
        if not STABLE_DIFFUSION_AVAILABLE:
            logger.warning("Stable Diffusion not available - image generation will return placeholder")
            self.pipeline = None
            self.device = "cpu"
            self.loaded_style = None
            return
            
        self.pipeline = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_id = "runwayml/stable-diffusion-v1-5"  # Good base model for anime/manhwa style
        self.manhwa_style_models = {
            "anime": "runwayml/stable-diffusion-v1-5",
            "realistic": "stabilityai/stable-diffusion-2-1",
            "chibi": "runwayml/stable-diffusion-v1-5"  # Can be fine-tuned
        }
        self.loaded_style = None
        logger.info(f"ImageGenerationService initialized on device: {self.device}")
    
    def _create_placeholder_image(self, width: int, height: int, text: str) -> str:
        """Create a placeholder image as base64 when Stable Diffusion isn't available"""
        # Create a simple placeholder image
        try:
            img = Image.new('RGB', (width, height), color='lightgray')
            draw = ImageDraw.Draw(img)
            
            # Add placeholder text
            try:
                font = ImageFont.load_default()
            except:
                font = None
            
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (width - text_width) // 2
            y = (height - text_height) // 2
            
            draw.text((x, y), text, fill='black', font=font)
            
            # Convert to base64
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            return img_base64
        except Exception as e:
            logger.error(f"Error creating placeholder image: {e}")
            # Return a minimal base64 placeholder
            return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    async def load_model(self, style: str = "anime"):
        """Load Stable Diffusion model for specified style"""
        if not STABLE_DIFFUSION_AVAILABLE:
            return
            
        if self.pipeline is None or self.loaded_style != style:
            try:
                model_id = self.manhwa_style_models.get(style, self.model_id)
                logger.info(f"Loading Stable Diffusion model: {model_id} for {style} style")
                
                self.pipeline = StableDiffusionPipeline.from_pretrained(
                    model_id,
                    torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                    safety_checker=None,  # Disable for artistic content
                    requires_safety_checker=False
                )
                
                # Use DPM solver for faster generation
                self.pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
                    self.pipeline.scheduler.config
                )
                
                self.pipeline = self.pipeline.to(self.device)
                
                # Enable memory efficient attention if available
                if hasattr(self.pipeline, "enable_xformers_memory_efficient_attention"):
                    try:
                        self.pipeline.enable_xformers_memory_efficient_attention()
                    except Exception as e:
                        logger.warning(f"Could not enable xformers: {e}")
                
                # Enable CPU offload for memory efficiency
                if self.device == "cuda":
                    self.pipeline.enable_model_cpu_offload()
                
                self.loaded_style = style
                logger.info(f"Successfully loaded {style} style model")
                
            except Exception as e:
                logger.error(f"Error loading Stable Diffusion model: {e}")
                raise e
    
    def enhance_manhwa_prompt(self, prompt: str, style: str = "anime") -> str:
        """Enhance prompt with manhwa-specific styling"""
        style_prompts = {
            "anime": "anime style, manga art, cel-shaded, clean lines, vibrant colors",
            "realistic": "realistic, detailed, photorealistic, high quality",
            "chibi": "chibi style, cute, kawaii, simple, rounded features"
        }
        
        base_enhancement = style_prompts.get(style, style_prompts["anime"])
        
        # Manhwa-specific enhancements
        manhwa_keywords = [
            "manhwa style", "korean comic art", "webtoon style", "digital art",
            "high quality", "detailed illustration", "professional artwork",
            "dramatic lighting", "beautiful composition"
        ]
        
        enhanced_prompt = f"{prompt}, {base_enhancement}, {', '.join(manhwa_keywords[:3])}"
        
        # Negative prompts to avoid common issues
        self.negative_prompt = (
            "blurry, low quality, distorted, deformed, ugly, bad anatomy, "
            "bad proportions, extra limbs, missing limbs, watermark, text, "
            "signature, jpeg artifacts, worst quality, low resolution"
        )
        
        return enhanced_prompt
    
    async def generate_character_art(self, character_prompt: str, style: str = "anime", 
                                   width: int = 512, height: int = 768) -> Dict[str, Any]:
        """Generate character artwork for manhwa"""
        if not STABLE_DIFFUSION_AVAILABLE:
            logger.info("Using placeholder image for character art")
            img_base64 = self._create_placeholder_image(width, height, f"Character Art\n{character_prompt[:20]}...")
            return {
                "image_base64": img_base64,
                "prompt": f"character portrait, {character_prompt}, full body",
                "style": style,
                "width": width,
                "height": height,
                "type": "character",
                "placeholder": True
            }
        
        await self.load_model(style)
        
        enhanced_prompt = self.enhance_manhwa_prompt(
            f"character portrait, {character_prompt}, full body", style
        )
        
        try:
            logger.info(f"Generating character art with prompt: {enhanced_prompt[:100]}...")
            
            image = self.pipeline(
                prompt=enhanced_prompt,
                negative_prompt=self.negative_prompt,
                width=width,
                height=height,
                num_inference_steps=25,  # Good balance of quality/speed
                guidance_scale=7.5,
                num_images_per_prompt=1
            ).images[0]
            
            # Convert to base64 for API response
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG', quality=95)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            return {
                "image_base64": img_base64,
                "prompt": enhanced_prompt,
                "style": style,
                "width": width,
                "height": height,
                "type": "character"
            }
            
        except Exception as e:
            logger.error(f"Error generating character art: {e}")
            raise e
    
    async def generate_scene_art(self, scene_prompt: str, characters: List[str] = None,
                               style: str = "anime", width: int = 768, height: int = 512) -> Dict[str, Any]:
        """Generate scene artwork for manhwa panels"""
        if not STABLE_DIFFUSION_AVAILABLE:
            logger.info("Using placeholder image for scene art")
            img_base64 = self._create_placeholder_image(width, height, f"Scene Art\n{scene_prompt[:20]}...")
            return {
                "image_base64": img_base64,
                "prompt": scene_prompt,
                "style": style,
                "width": width,
                "height": height,
                "type": "scene",
                "placeholder": True
            }
        
        await self.load_model(style)
        
        # Combine scene and character information
        if characters:
            char_desc = ", ".join(characters)
            full_prompt = f"{scene_prompt}, featuring {char_desc}"
        else:
            full_prompt = scene_prompt
        
        enhanced_prompt = self.enhance_manhwa_prompt(
            f"scene illustration, {full_prompt}, cinematic composition", style
        )
        
        try:
            logger.info(f"Generating scene art with prompt: {enhanced_prompt[:100]}...")
            
            image = self.pipeline(
                prompt=enhanced_prompt,
                negative_prompt=self.negative_prompt,
                width=width,
                height=height,
                num_inference_steps=25,
                guidance_scale=7.5,
                num_images_per_prompt=1
            ).images[0]
            
            # Convert to base64
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG', quality=95)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            return {
                "image_base64": img_base64,
                "prompt": enhanced_prompt,
                "style": style,
                "width": width,
                "height": height,
                "type": "scene"
            }
            
        except Exception as e:
            logger.error(f"Error generating scene art: {e}")
            raise e
    
    async def generate_cover_art(self, title: str, genre: str, main_character: str,
                               style: str = "anime") -> Dict[str, Any]:
        """Generate cover artwork for manhwa"""
        if not STABLE_DIFFUSION_AVAILABLE:
            logger.info("Using placeholder image for cover art")
            img_base64 = self._create_placeholder_image(512, 768, f"Cover Art\n{title[:15]}...")
            return {
                "image_base64": img_base64,
                "prompt": f"manhwa cover art, {title}, {genre} theme",
                "style": style,
                "width": 512,
                "height": 768,
                "type": "cover",
                "title": title,
                "placeholder": True
            }
        
        await self.load_model(style)
        
        cover_prompt = (
            f"manhwa cover art, {title}, {genre} theme, "
            f"featuring {main_character}, dramatic composition, "
            f"title design, professional book cover"
        )
        
        enhanced_prompt = self.enhance_manhwa_prompt(cover_prompt, style)
        
        try:
            logger.info(f"Generating cover art for: {title}")
            
            image = self.pipeline(
                prompt=enhanced_prompt,
                negative_prompt=f"{self.negative_prompt}, text, letters, words",
                width=512,
                height=768,  # Portrait orientation for covers
                num_inference_steps=30,  # Higher quality for covers
                guidance_scale=8.0,
                num_images_per_prompt=1
            ).images[0]
            
            # Convert to base64
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG', quality=95)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            return {
                "image_base64": img_base64,
                "prompt": enhanced_prompt,
                "style": style,
                "width": 512,
                "height": 768,
                "type": "cover",
                "title": title
            }
            
        except Exception as e:
            logger.error(f"Error generating cover art: {e}")
            raise e
    
    def get_style_options(self) -> List[str]:
        """Get available art styles"""
        return list(self.manhwa_style_models.keys())
    
    async def cleanup(self):
        """Clean up GPU memory"""
        if self.pipeline:
            del self.pipeline
            self.pipeline = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("ImageGenerationService cleaned up")