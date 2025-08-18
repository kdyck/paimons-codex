import os
import io
import base64
from typing import Dict, Any, List, Optional, Tuple
import logging
import asyncio
import sys
sys.path.append('/app')  # Add current directory to path for shared modules

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

# Import shared prompt builder
try:
    from shared.prompt_builder import ManhwaPromptBuilder
    PROMPT_BUILDER_AVAILABLE = True
except ImportError:
    logging.warning("Shared prompt builder not available - using fallback")
    PROMPT_BUILDER_AVAILABLE = False

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """Stable Diffusion-powered service optimized for manhwa/webtoon.

    Key features:
      - Deterministic runs via seed
      - Manhwa-specific prompt builder (positive + negative)
      - DPM-Solver++ scheduler for crisp line art
      - Two-pass high-res refine (img2img) for panel clarity
      - LoRA loading hooks for character/style consistency
      - Model override support per-call
      - Safer memory/perf toggles and OOM recovery
    """

    def __init__(self):
        self.pipeline = None
        self._i2i = None  # lazily built img2img pipeline from base pipe
        self._compel = None  # Compel for long prompt weighting
        self._lock = asyncio.Lock()
        
        # Model cache for 24GB VRAM - keep multiple models loaded
        self._model_cache = {}  # Dict[str, pipeline] 
        self._cache_size_limit = 3  # Keep up to 3 models in VRAM simultaneously
        
        # Preload queue for popular models
        self._preload_queue = []
        self._preload_lock = asyncio.Lock()

        if not STABLE_DIFFUSION_AVAILABLE:
            self.device = "cpu"
            self.loaded_style = None
            self.loaded_model_id = None
            logger.warning("Stable Diffusion not available - returning placeholders")
            return

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Manhwa-optimized models hierarchy: Anything v4.0 -> Counterfeit v3.0 -> SD v1.5
        self.model_id = "xyn-ai/anything-v4.0"  # Default: Anything v4.0 (best for anime/manhwa)
        self.fallback_models = [
            "sinkinai/MeinaMix-v10",                   # High quality fallback
            "stabilityai/stable-diffusion-2-1",       # Fallback: SD 2.1 (reliable)
            "runwayml/stable-diffusion-v1-5"          # Last resort: SD v1.5
        ]
        self.manhwa_style_models = {
            "anime": "sinkinai/MeinaMix-v10",          # MeinaMix v10 - excellent for anime/manhwa and realistic style
            "realistic": "xyn-ai/anything-v4.0",       # Anything v4.0 - versatile for realistic and artistic styles
            "chibi": "sinkinai/MeinaMix-v10",          # MeinaMix v10 - excellent for chibi/cute and realistic style
            "watercolor": "xyn-ai/anything-v4.0",      # Anything v4.0 - good for artistic watercolor style
            "oil painting": "xyn-ai/anything-v4.0",   # Anything v4.0 - good for artistic oil painting style
            "digital art": "sinkinai/MeinaMix-v10",        # MeinaMix v10 - excellent for digital art and realistic style
            "manhwa": "sinkinai/MeinaMix-v10",         # MeinaMix v10 - excellent for manhwa and realistic style
            "webtoon": "sinkinai/MeinaMix-v10",        # MeinaMix v10 - excellent for webtoon and realistic style
            # SDXL models for high-res generation
            "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
            "anime-xl": "cagliostrolab/animagine-xl-3.1",
            # Fallback options
            "sd21": "stabilityai/stable-diffusion-2-1", # SD 2.1 fallback
            "sd15": "runwayml/stable-diffusion-v1-5",  # Explicit SD v1.5 option
        }
        self.loaded_style: Optional[str] = None
        self.loaded_model_id: Optional[str] = None
        
        logger.info(f"ImageGenerationService initialized on device: {self.device}")
        
        # SSD-optimized paths
        self.output_dir = os.getenv("SD_OUTPUT_DIR", "/nvme-outputs")
        self.temp_dir = os.getenv("SD_TEMP_DIR", "/nvme-temp") 
        self.model_cache_dir = os.getenv("HF_HOME", "/nvme-models")
        
        # Ensure SSD directories exist
        self._ensure_ssd_directories()
        
        # Start preloading popular models in background
        if self.device == "cuda":
            asyncio.create_task(self._preload_popular_models())

    # ----------------------------- SSD Utilities -----------------------------
    def _ensure_ssd_directories(self):
        """Ensure NVMe SSD directories exist with proper permissions."""
        try:
            import stat
            dirs_to_create = [
                self.output_dir,
                self.temp_dir,
                self.model_cache_dir,
                f"{self.model_cache_dir}/transformers",
                f"{self.model_cache_dir}/diffusers", 
                f"{self.model_cache_dir}/datasets",
                f"{self.model_cache_dir}/hub",
            ]
            
            for directory in dirs_to_create:
                os.makedirs(directory, exist_ok=True)
                # Set permissions for fast access
                try:
                    os.chmod(directory, stat.S_IRWXU | stat.S_IRWXG | stat.S_IROTH | stat.S_IXOTH)
                except Exception:
                    pass  # Permission changes may fail in containers
                    
            logger.info(f"🚀 NVMe SSD directories configured:")
            logger.info(f"   Models: {self.model_cache_dir}")
            logger.info(f"   Outputs: {self.output_dir}")
            logger.info(f"   Temp: {self.temp_dir}")
            
        except Exception as e:
            logger.warning(f"SSD directory setup failed: {e}")
    
    def save_image_to_ssd(self, image: Image.Image, filename: str) -> str:
        """Save image directly to NVMe SSD for fast access."""
        try:
            filepath = os.path.join(self.output_dir, filename)
            image.save(filepath, format='PNG', optimize=True, compress_level=1)
            logger.debug(f"💾 Saved to SSD: {filepath}")
            return filepath
        except Exception as e:
            logger.warning(f"SSD save failed: {e}")
            return ""

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
    def _image_to_b64(img: Image.Image) -> str:
        buf = io.BytesIO()
        img.save(buf, format='PNG', optimize=True)
        return base64.b64encode(buf.getvalue()).decode()

    def _generator(self, seed: Optional[int]):
        if not STABLE_DIFFUSION_AVAILABLE:
            return None
        if seed is None:
            return None
        gen = torch.Generator(device=self.device)
        return gen.manual_seed(int(seed))

    @staticmethod
    def _round_to_8(value: int) -> int:
        """Round dimensions to nearest multiple of 8 for Stable Diffusion"""
        return ((value + 7) // 8) * 8

    # ----------------------------- Prompting ---------------------------------
    def build_prompts(self, prompt: str, style: str = "anime") -> Tuple[str, str]:
        """Build prompts using shared builder or fallback."""
        if PROMPT_BUILDER_AVAILABLE:
            return ManhwaPromptBuilder.build_prompts(prompt, style)
        else:
            # Fallback implementation
            style_prompts = {
                "anime": "anime style, manga art, cel-shaded, clean lines, vibrant colors, beautiful, high quality, masterpiece, detailed, friendly, pleasant",
                "realistic": "realistic, detailed, photorealistic, high quality, beautiful, masterpiece, pleasant, friendly, well-lit", 
                "chibi": "chibi style, cute, kawaii, simple, rounded features, adorable, cheerful, friendly, wholesome",
            }
            manhwa = "manhwa style, webtoon style, korean comic art, digital art, beautiful composition, dramatic lighting"
            positive = f"{prompt}, {style_prompts.get(style, style_prompts['anime'])}, {manhwa}"
            
            negative = (
                "lowres, blurry, jpeg artifacts, watermark, text, signature, bad anatomy, "
                "bad proportions, extra fingers, extra limbs, missing limbs, deformed, worst quality, "
                "purple artifacts, purple blotches, color corruption, oversaturated, "
                "scary, horror, creepy, nightmare, dark, evil, demon, monster, zombie, gore, blood, "
                "violence, disturbing, unsettling, menacing, sinister, grotesque, macabre, "
                "multiple faces, two faces, double face, duplicate, mutated hands, poorly drawn hands, "
                "poorly drawn face, mutation, deformed face, ugly, bad eyes, crossed eyes"
            )
            return positive, negative

    def _count_tokens(self, text: str) -> int:
        """Count tokens in text using the pipeline's tokenizer"""
        if not STABLE_DIFFUSION_AVAILABLE or self.pipeline is None:
            # Rough word-based estimate if tokenizer unavailable
            return len(text.split())
        
        try:
            tokens = self.pipeline.tokenizer.encode(text)
            return len(tokens)
        except Exception:
            # Fallback to word count
            return len(text.split())
    
    def _check_token_limits(self, prompt: str, negative_prompt: str) -> None:
        """Check and warn about token limits"""
        if not STABLE_DIFFUSION_AVAILABLE:
            return
            
        pos_tokens = self._count_tokens(prompt)
        neg_tokens = self._count_tokens(negative_prompt)
        
        if not COMPEL_AVAILABLE:
            if pos_tokens > 77:
                logger.warning(f"⚠️  Positive prompt has {pos_tokens} tokens (CLIP limit: 77) - text will be truncated! Install 'compel' for long prompt support.")
            if neg_tokens > 77:
                logger.warning(f"⚠️  Negative prompt has {neg_tokens} tokens (CLIP limit: 77) - text will be truncated! Install 'compel' for long prompt support.")
        else:
            if pos_tokens > 77:
                logger.info(f"✅ Long positive prompt detected ({pos_tokens} tokens) - using Compel for processing")
            if neg_tokens > 77:
                logger.info(f"✅ Long negative prompt detected ({neg_tokens} tokens) - using Compel for processing")

    def _get_prompt_embeddings(self, prompt: str, negative_prompt: str) -> Tuple[torch.Tensor, torch.Tensor]:
        """Generate prompt embeddings using Compel for long prompt support"""
        # Check token limits and warn if needed
        self._check_token_limits(prompt, negative_prompt)
        
        if not STABLE_DIFFUSION_AVAILABLE or not COMPEL_AVAILABLE or self.pipeline is None:
            return None, None
            
        if self._compel is None:
            logger.info("Initializing Compel for long prompt weighting")
            try:
                self._compel = Compel(
                    tokenizer=self.pipeline.tokenizer,
                    text_encoder=self.pipeline.text_encoder,
                    device=self.device,
                    truncate_long_prompts=False
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Compel: {e}")
                return None, None
        
        try:
            # Generate embeddings using Compel (handles >77 tokens automatically)
            prompt_embeds = self._compel(prompt)
            negative_prompt_embeds = self._compel(negative_prompt)
            
            # Ensure embeddings have the same shape by padding to the longer length
            if prompt_embeds.shape[1] != negative_prompt_embeds.shape[1]:
                max_length = max(prompt_embeds.shape[1], negative_prompt_embeds.shape[1])
                
                if prompt_embeds.shape[1] < max_length:
                    padding = torch.zeros((prompt_embeds.shape[0], max_length - prompt_embeds.shape[1], prompt_embeds.shape[2]), 
                                        device=prompt_embeds.device, dtype=prompt_embeds.dtype)
                    prompt_embeds = torch.cat([prompt_embeds, padding], dim=1)
                
                if negative_prompt_embeds.shape[1] < max_length:
                    padding = torch.zeros((negative_prompt_embeds.shape[0], max_length - negative_prompt_embeds.shape[1], negative_prompt_embeds.shape[2]), 
                                        device=negative_prompt_embeds.device, dtype=negative_prompt_embeds.dtype)
                    negative_prompt_embeds = torch.cat([negative_prompt_embeds, padding], dim=1)
            
            logger.info(f"Generated embeddings - prompt: {prompt_embeds.shape}, negative: {negative_prompt_embeds.shape}")
            return prompt_embeds, negative_prompt_embeds
            
        except Exception as e:
            logger.warning(f"Failed to generate embeddings with Compel: {e}")
            return None, None

    # ------------------------- Model Cache & Preload ------------------------
    async def _preload_popular_models(self):
        """Background preloading of popular models for instant switching."""
        popular_models = ["anime", "realistic", "chibi"]  # Most used styles
        
        async with self._preload_lock:
            for style in popular_models:
                try:
                    model_id = self.manhwa_style_models.get(style, self.model_id)
                    if model_id not in self._model_cache:
                        logger.info(f"🔄 Preloading {style} model: {model_id}")
                        await self._load_model_to_cache(model_id, style)
                        await asyncio.sleep(1)  # Small delay between loads
                except Exception as e:
                    logger.warning(f"Failed to preload {style}: {e}")
    
    async def _load_model_to_cache(self, model_id: str, style: str) -> StableDiffusionPipeline:
        """Load a model into cache, managing VRAM limits."""
        if model_id in self._model_cache:
            return self._model_cache[model_id]
            
        # Check cache size limit
        if len(self._model_cache) >= self._cache_size_limit:
            # Remove oldest model (simple LRU)
            oldest_key = next(iter(self._model_cache))
            logger.info(f"🗑️ Removing {oldest_key} from cache to make room")
            del self._model_cache[oldest_key]
            torch.cuda.empty_cache()
            
        logger.info(f"📥 Loading {model_id} to cache")
        
        dtype = torch.float16 if (self.device == "cuda") else torch.float32
        
        # Load proper VAE to fix purple blotches in Anything v4.0
        vae = None
        if "anything" in model_id.lower() or "xyn-ai" in model_id.lower():
            try:
                from diffusers import AutoencoderKL
                logger.info("🎨 Loading proper VAE to fix purple blotches...")
                
                # Try multiple VAE options in order of preference
                vae_options = [
                    "stabilityai/sd-vae-ft-mse",     # MSE VAE - best for fixing purple artifacts
                    "stabilityai/sd-vae-ft-ema",     # EMA VAE - alternative high quality
                ]
                
                for vae_model in vae_options:
                    try:
                        vae = AutoencoderKL.from_pretrained(
                            vae_model, 
                            torch_dtype=dtype,
                            cache_dir=self.model_cache_dir
                        )
                        logger.info(f"✅ Loaded {vae_model} VAE for better image quality")
                        break
                    except Exception as ve:
                        logger.warning(f"Could not load {vae_model}: {ve}")
                        continue
                        
            except Exception as e:
                logger.warning(f"Could not load external VAE: {e}")
        
        # Use NVMe SSD for model storage
        pipeline = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=dtype,
            safety_checker=None,
            requires_safety_checker=False,
            cache_dir=self.model_cache_dir,
            vae=vae,  # Use proper VAE if loaded
            # SSD optimization: use local files when possible
            local_files_only=False,
            resume_download=True,
        )
        
        # Apply optimizations
        try:
            pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
                pipeline.scheduler.config,
                algorithm_type="dpmsolver++",
            )
        except Exception as e:
            logger.warning(f"Falling back to default scheduler: {e}")
            
        pipeline = pipeline.to(self.device)
        
        # Performance optimizations for high-VRAM + NVMe SSD setup
        if self.device == "cuda":
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True
            # SSD-optimized CUDA settings
            torch.backends.cudnn.benchmark = True  # Faster for consistent input sizes
            
        # Enable xFormers for 2-3x speedup
        try:
            pipeline.enable_xformers_memory_efficient_attention()
            logger.debug("✅ xFormers enabled for model cache")
        except Exception:
            pass
            
        # VAE optimizations
        if hasattr(pipeline, "enable_vae_slicing"):
            pipeline.enable_vae_slicing()
        if hasattr(pipeline, "vae") and hasattr(pipeline.vae, "enable_tiling"):
            pipeline.vae.enable_tiling()
            
        # SSD-specific optimizations: use temp directory for intermediate files
        if hasattr(pipeline, "unet"):
            # Set temporary directory for model operations
            os.environ['TMPDIR'] = self.temp_dir
            os.environ['TMP'] = self.temp_dir
            
        self._model_cache[model_id] = pipeline
        logger.info(f"✅ Cached {model_id} ({len(self._model_cache)}/{self._cache_size_limit})")
        return pipeline

    # ----------------------------- Model load --------------------------------
    async def load_model(self, style: str = "anime", model_override: Optional[str] = None):
        if not STABLE_DIFFUSION_AVAILABLE:
            return

        async with self._lock:
            target_model_id = model_override or self.manhwa_style_models.get(style, self.model_id)
            
            # Check if already loaded as current pipeline
            if self.pipeline is not None and self.loaded_model_id == target_model_id:
                self.loaded_style = style
                logger.info(f"⚡ Model {target_model_id} already active")
                return

            # Check cache first - instant model switching!
            if target_model_id in self._model_cache:
                logger.info(f"🚀 Switching to cached model: {target_model_id}")
                self.pipeline = self._model_cache[target_model_id]
                self.loaded_style = style
                self.loaded_model_id = target_model_id
                self._i2i = None  # reset for new base pipe
                self._compel = None  # reset for new model
                return

            # Load new model to cache with fallback logic
            models_to_try = [target_model_id] + self.fallback_models
            
            for attempt, model_id in enumerate(models_to_try):
                if model_id == target_model_id:
                    logger.info(f"📥 Loading primary model: {model_id} (style={style})")
                else:
                    logger.warning(f"🔄 Trying fallback model #{attempt}: {model_id}")
                
                try:
                    self.pipeline = await self._load_model_to_cache(model_id, style)
                    self._i2i = None  # reset; will rebuild from new base pipe lazily
                    self._compel = None  # reset; will rebuild with new model
                    self.loaded_style = style
                    self.loaded_model_id = model_id
                    if model_id == target_model_id:
                        logger.info("✅ Primary model loaded successfully")
                    else:
                        logger.info(f"✅ Fallback model loaded: {model_id}")
                    break
                except Exception as e:
                    if attempt < len(models_to_try) - 1:
                        logger.warning(f"❌ Failed to load {model_id}: {e}")
                        continue
                    else:
                        logger.error(f"❌ All models failed. Last error for {model_id}: {e}")
                        raise

    # ----------------------------- LoRA hooks --------------------------------
    def apply_lora(self, lora_path: str, weight: float = 0.8):
        if not STABLE_DIFFUSION_AVAILABLE or self.pipeline is None:
            return
        try:
            # Newer diffusers API
            if hasattr(self.pipeline, "load_lora_weights"):
                self.pipeline.load_lora_weights(lora_path)
                if hasattr(self.pipeline, "fuse_lora"):
                    self.pipeline.fuse_lora(lora_scale=weight)
                elif hasattr(self.pipeline, "set_adapters"):
                    self.pipeline.set_adapters(["default"], [weight])
            else:
                logger.warning("LoRA APIs not found on pipeline; update diffusers.")
        except Exception as e:
            logger.warning(f"LoRA load failed: {e}")

    # -------------------------- High-res refine ------------------------------
    def _get_img2img(self) -> Optional[StableDiffusionImg2ImgPipeline]:
        if not STABLE_DIFFUSION_AVAILABLE or self.pipeline is None:
            return None
        if self._i2i is not None:
            return self._i2i
        try:
            # Prefer creating from the already-loaded base pipe to share weights
            if hasattr(StableDiffusionImg2ImgPipeline, "from_pipe"):
                self._i2i = StableDiffusionImg2ImgPipeline.from_pipe(self.pipeline).to(self.device)
            else:
                # Fallback: construct manually from components
                self._i2i = StableDiffusionImg2ImgPipeline(
                    vae=self.pipeline.vae,
                    text_encoder=self.pipeline.text_encoder,
                    tokenizer=self.pipeline.tokenizer,
                    unet=self.pipeline.unet,
                    scheduler=self.pipeline.scheduler,
                    safety_checker=None,
                    feature_extractor=self.pipeline.feature_extractor,
                    requires_safety_checker=False,
                ).to(self.device)
            # mirror perf toggles
            if hasattr(self._i2i, "enable_attention_slicing"):
                self._i2i.enable_attention_slicing("max")
            if hasattr(self._i2i, "enable_vae_slicing"):
                self._i2i.enable_vae_slicing()
            if hasattr(self._i2i, "vae") and hasattr(self._i2i.vae, "enable_tiling"):
                self._i2i.vae.enable_tiling()
            return self._i2i
        except Exception as e:
            logger.warning(f"Could not build img2img pipeline: {e}")
            return None

    def _hires_refine(
        self,
        img: Image.Image,
        prompt: str,
        negative: str,
        *,
        denoise: float = 0.35,
        upscale: float = 2.0,
        seed: Optional[int] = None,
        steps: int = 18,
        guidance_scale: float = 7.5,
    ) -> Image.Image:
        i2i = self._get_img2img()
        if i2i is None:
            # graceful fallback: manual resize only
            target_w = int(img.width * upscale)
            target_h = int(img.height * upscale)
            return img.resize((target_w, target_h), Image.LANCZOS)

        target_w = int(img.width * upscale)
        target_h = int(img.height * upscale)
        up = img.resize((target_w, target_h), Image.LANCZOS)

        out = i2i(
            prompt=prompt,
            negative_prompt=negative,
            image=up,
            strength=float(denoise),
            guidance_scale=float(guidance_scale),
            num_inference_steps=int(steps),
            generator=self._generator(seed),
        ).images[0]
        return out

    # --------------------------- Public methods ------------------------------
    async def generate_batch(
        self,
        prompts: List[str],
        *,
        style: str = "anime", 
        width: int = 768,
        height: int = 1152,
        num_images: int = 4,
        seed: Optional[int] = None,
        guidance_scale: float = 7.5,
        steps: int = 25,
        model_override: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Generate multiple images in a single batch for maximum efficiency."""
        if not STABLE_DIFFUSION_AVAILABLE:
            results = []
            for i, prompt in enumerate(prompts):
                img_b64 = self._create_placeholder_image(width, height, f"Batch {i+1}\n{prompt[:20]}...")
                results.append({
                    "image_base64": img_b64,
                    "prompt": prompt,
                    "batch_index": i,
                    "placeholder": True
                })
            return results
            
        await self.load_model(style, model_override=model_override)
        
        # Process all prompts together
        batch_results = []
        for prompt in prompts:
            pos, neg = self.build_prompts(prompt, style)
            
            try:
                # Generate batch of images for this prompt
                images = self.pipeline(
                    prompt=[pos] * num_images,
                    negative_prompt=[neg] * num_images,
                    width=self._round_to_8(width),
                    height=self._round_to_8(height),
                    num_inference_steps=steps,
                    guidance_scale=guidance_scale,
                    generator=[self._generator(seed + i if seed else None) for i in range(num_images)],
                ).images
                
                # Convert to results
                for i, img in enumerate(images):
                    batch_results.append({
                        "image_base64": self._image_to_b64(img),
                        "prompt": pos,
                        "width": img.width,
                        "height": img.height,
                        "seed": seed + i if seed else None,
                        "batch_index": len(batch_results),
                        "model": self.loaded_model_id,
                    })
                    
            except RuntimeError as e:
                if "CUDA out of memory" in str(e):
                    logger.warning("OOM in batch generation - reducing batch size")
                    # Fall back to individual generation
                    img = self.pipeline(
                        prompt=pos,
                        negative_prompt=neg,
                        width=self._round_to_8(width),
                        height=self._round_to_8(height),
                        num_inference_steps=steps,
                        guidance_scale=guidance_scale,
                        generator=self._generator(seed),
                    ).images[0]
                    
                    batch_results.append({
                        "image_base64": self._image_to_b64(img),
                        "prompt": pos,
                        "width": img.width,
                        "height": img.height,
                        "seed": seed,
                        "batch_index": len(batch_results),
                        "model": self.loaded_model_id,
                    })
                else:
                    raise
                    
        return batch_results

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
        if not STABLE_DIFFUSION_AVAILABLE:
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

        await self.load_model(style, model_override=model_override)
        if lora:
            self.apply_lora(lora, lora_scale)

        if PROMPT_BUILDER_AVAILABLE:
            pos, neg = ManhwaPromptBuilder.build_character_prompts(character_prompt, style)
        else:
            pos, neg = self.build_prompts(f"character portrait, {character_prompt}, full body", style)

        # Two-pass: generate smaller then refine to target
        base_w = self._round_to_8(max(256, int(width * 0.65)))
        base_h = self._round_to_8(max(256, int(height * 0.65)))
        upscale = max(1.0, width / base_w)

        try:
            # Use Compel for long prompt support
            prompt_embeds, negative_prompt_embeds = self._get_prompt_embeddings(pos, neg)
            
            if prompt_embeds is not None and negative_prompt_embeds is not None:
                # Use embeddings (supports >77 tokens)
                img = self.pipeline(
                    prompt_embeds=prompt_embeds,
                    negative_prompt_embeds=negative_prompt_embeds,
                    width=base_w,
                    height=base_h,
                    num_inference_steps=25,
                    guidance_scale=7.5,
                    generator=self._generator(seed),
                ).images[0]
            else:
                # Fallback to text prompts
                logger.warning("Using fallback text prompts (may truncate >77 tokens)")
                img = self.pipeline(
                    prompt=pos,
                    negative_prompt=neg,
                    width=base_w,
                    height=base_h,
                    num_inference_steps=25,
                    guidance_scale=7.5,
                    generator=self._generator(seed),
                ).images[0]
        except RuntimeError as e:
            if "CUDA out of memory" in str(e):
                logger.warning("OOM on first pass; retrying at smaller base size")
                if hasattr(self.pipeline, "enable_attention_slicing"):
                    self.pipeline.enable_attention_slicing("max")
                torch.cuda.empty_cache()
                base_w = self._round_to_8(int(base_w * 0.9))
                base_h = self._round_to_8(int(base_h * 0.9))
                img = self.pipeline(
                    prompt=pos,
                    negative_prompt=neg,
                    width=base_w,
                    height=base_h,
                    num_inference_steps=22,
                    guidance_scale=7.2,
                    generator=self._generator(seed),
                ).images[0]
            else:
                raise

        if hires:
            try:
                img = self._hires_refine(
                    img,
                    pos,
                    neg,
                    denoise=0.35,
                    upscale=upscale,
                    seed=seed,
                    steps=18,
                    guidance_scale=7.5,
                )
            except RuntimeError as e:
                if "CUDA out of memory" in str(e):
                    logger.warning("OOM during hi-res refine; returning first-pass image")
                else:
                    raise

        return {
            "image_base64": self._image_to_b64(img),
            "prompt": pos,
            "style": style,
            "width": img.width,
            "height": img.height,
            "type": "character",
            "seed": seed,
            "model": self.loaded_model_id,
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
        if not STABLE_DIFFUSION_AVAILABLE:
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

        await self.load_model(style, model_override=model_override)
        if lora:
            self.apply_lora(lora, lora_scale)

        full_prompt = scene_prompt
        if characters:
            full_prompt = f"{scene_prompt}, featuring {', '.join(characters)}"

        if PROMPT_BUILDER_AVAILABLE:
            pos, neg = ManhwaPromptBuilder.build_scene_prompts(scene_prompt, characters, style)
        else:
            pos, neg = self.build_prompts(f"scene illustration, {full_prompt}, cinematic composition", style)

        base_w = self._round_to_8(max(256, int(width * 0.65)))
        base_h = self._round_to_8(max(256, int(height * 0.65)))
        upscale = max(1.0, width / base_w)

        try:
            img = self.pipeline(
                prompt=pos,
                negative_prompt=neg,
                width=base_w,
                height=base_h,
                num_inference_steps=25,
                guidance_scale=7.5,
                generator=self._generator(seed),
            ).images[0]
        except RuntimeError as e:
            if "CUDA out of memory" in str(e):
                logger.warning("OOM on first pass; retrying scene at smaller base size")
                if hasattr(self.pipeline, "enable_attention_slicing"):
                    self.pipeline.enable_attention_slicing("max")
                torch.cuda.empty_cache()
                base_w = self._round_to_8(int(base_w * 0.9))
                base_h = self._round_to_8(int(base_h * 0.9))
                img = self.pipeline(
                    prompt=pos,
                    negative_prompt=neg,
                    width=base_w,
                    height=base_h,
                    num_inference_steps=22,
                    guidance_scale=7.2,
                    generator=self._generator(seed),
                ).images[0]
            else:
                raise

        if hires:
            try:
                img = self._hires_refine(
                    img,
                    pos,
                    neg,
                    denoise=0.35,
                    upscale=upscale,
                    seed=seed,
                    steps=18,
                    guidance_scale=7.5,
                )
            except RuntimeError as e:
                if "CUDA out of memory" in str(e):
                    logger.warning("OOM during scene hi-res; returning first-pass image")
                else:
                    raise

        return {
            "image_base64": self._image_to_b64(img),
            "prompt": pos,
            "style": style,
            "width": img.width,
            "height": img.height,
            "type": "scene",
            "seed": seed,
            "model": self.loaded_model_id,
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
        if not STABLE_DIFFUSION_AVAILABLE:
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

        await self.load_model(style, model_override=model_override)
        if lora:
            self.apply_lora(lora, lora_scale)

        if PROMPT_BUILDER_AVAILABLE:
            pos, neg = ManhwaPromptBuilder.build_cover_prompts(title, genre, main_character, style)
        else:
            cover_prompt = (
                f"manhwa cover art, {title}, {genre} theme, featuring {main_character}, "
                f"dramatic composition, title design, professional book cover"
            )
            pos, neg = self.build_prompts(cover_prompt + ", no lettering, no text", style)
            # Strongly suppress accidental text
            neg = neg + ", letters, words, text, watermark"

        base_w = self._round_to_8(max(256, int(width * 0.65)))
        base_h = self._round_to_8(max(256, int(height * 0.65)))
        upscale = max(1.0, width / base_w)

        try:
            img = self.pipeline(
                prompt=pos,
                negative_prompt=neg,
                width=base_w,
                height=base_h,
                num_inference_steps=30,
                guidance_scale=8.0,
                generator=self._generator(seed),
            ).images[0]
        except RuntimeError as e:
            if "CUDA out of memory" in str(e):
                logger.warning("OOM on cover pass; retrying smaller")
                if hasattr(self.pipeline, "enable_attention_slicing"):
                    self.pipeline.enable_attention_slicing("max")
                torch.cuda.empty_cache()
                base_w = self._round_to_8(int(base_w * 0.9))
                base_h = self._round_to_8(int(base_h * 0.9))
                img = self.pipeline(
                    prompt=pos,
                    negative_prompt=neg,
                    width=base_w,
                    height=base_h,
                    num_inference_steps=26,
                    guidance_scale=7.6,
                    generator=self._generator(seed),
                ).images[0]
            else:
                raise

        if hires:
            try:
                img = self._hires_refine(
                    img,
                    pos,
                    neg,
                    denoise=0.34,
                    upscale=upscale,
                    seed=seed,
                    steps=18,
                    guidance_scale=7.8,
                )
            except RuntimeError as e:
                if "CUDA out of memory" in str(e):
                    logger.warning("OOM during cover hi-res; returning first-pass image")
                else:
                    raise

        return {
            "image_base64": self._image_to_b64(img),
            "prompt": pos,
            "style": style,
            "width": img.width,
            "height": img.height,
            "type": "cover",
            "title": title,
            "seed": seed,
            "model": self.loaded_model_id,
        }

    async def generate_advanced_cover_art(
        self,
        enhanced_prompt: str,
        *,
        style: str = "anime",
        width: int = 832,
        height: int = 1216,
        seed: Optional[int] = None,
        steps: int = 30,
        cfg_scale: float = 9.5,
        lora: Optional[str] = None,
        lora_scale: float = 0.8,
        hires: bool = True,
        model_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate advanced cover art with custom enhanced prompt."""
        if not STABLE_DIFFUSION_AVAILABLE:
            img_b64 = self._create_placeholder_image(width, height, f"Advanced Cover\n{enhanced_prompt[:15]}…")
            return {
                "image_base64": img_b64,
                "prompt": enhanced_prompt,
                "style": style,
                "width": width,
                "height": height,
                "type": "cover",
                "placeholder": True,
            }

        await self.load_model(style, model_override=model_override)
        if lora:
            self.apply_lora(lora, lora_scale)

        # Use enhanced prompt but add style-specific enhancements for consistency with character art
        # This ensures cover art gets the same quality style prompts as character art
        if PROMPT_BUILDER_AVAILABLE:
            style_prompts = ManhwaPromptBuilder.STYLE_PROMPTS.get(style, ManhwaPromptBuilder.STYLE_PROMPTS['anime'])
            pos = f"{enhanced_prompt}, {style_prompts}"
        else:
            # Fallback style prompts if prompt builder not available
            fallback_styles = {
                "digital art": "video game art, game character design, concept art, 3D rendered, game illustration, digital game art, fantasy game style, RPG character art, high quality",
                "anime": "anime style, manga art, cel-shaded, clean lines, vibrant colors",
                "realistic": "realistic, photorealistic, high detail, soft lighting, cinematic lighting",
                "chibi": "chibi style, super deformed, tiny body, big head, large sparkling eyes, cute anime style"
            }
            style_addition = fallback_styles.get(style, fallback_styles['anime'])
            pos = f"{enhanced_prompt}, {style_addition}"
        
        # Build appropriate negative prompt for cover art with character consistency
        character_consistency_negs = (
            "mixed ethnicity on same person, inconsistent skin tone, "
            "different skin color on face and body, partial ethnicity, "
            "multiple races on one character, skin tone mismatch, "
            "inconsistent character features, changing appearance"
        )
        
        # Add ethnicity-specific negative prompts to prevent wrong ethnicities
        ethnicity_negs = ""
        if "black" in enhanced_prompt.lower():
            ethnicity_negs = ", white skin, pale skin, light skin, caucasian features"
        elif "white" in enhanced_prompt.lower() or "caucasian" in enhanced_prompt.lower():
            ethnicity_negs = ", dark skin, black skin, african features"
        elif "asian" in enhanced_prompt.lower():
            ethnicity_negs = ", western features, non-asian features"
        elif "latino" in enhanced_prompt.lower() or "hispanic" in enhanced_prompt.lower():
            ethnicity_negs = ", pale skin, very dark skin, non-latino features"
        
        if PROMPT_BUILDER_AVAILABLE:
            _, base_neg = ManhwaPromptBuilder.build_prompts("dummy", style)
            neg = base_neg + f", {character_consistency_negs}{ethnicity_negs}, letters, words, text, watermark"
        else:
            neg = (
                "lowres, blurry, jpeg artifacts, watermark, text, signature, bad anatomy, "
                "bad proportions, extra fingers, extra limbs, missing limbs, deformed, worst quality, "
                "genshin impact, genshin style, fantasy armor, elaborate costumes, unnatural hair colors, "
                f"{character_consistency_negs}{ethnicity_negs}, letters, words, text, watermark"
            )

        logger.info(f"🎨 Cover Art Style: {style}")
        logger.info(f"📝 Enhanced prompt: {enhanced_prompt[:80]}...")
        logger.info(f"✨ Final positive prompt: {pos[:120]}...")
        logger.info(f"⚙️ Using CFG scale: {cfg_scale}, Steps: {steps}")
        
        base_w = self._round_to_8(max(256, int(width * 0.65)))
        base_h = self._round_to_8(max(256, int(height * 0.65)))
        upscale = max(1.0, width / base_w)

        try:
            # Use user-specified CFG scale and steps from advanced generator UI
            img = self.pipeline(
                prompt=pos,
                negative_prompt=neg,
                width=base_w,
                height=base_h,
                num_inference_steps=steps,
                guidance_scale=cfg_scale,
                generator=self._generator(seed),
            ).images[0]
        except RuntimeError as e:
            if "CUDA out of memory" in str(e):
                logger.warning("OOM on advanced cover pass; retrying smaller")
                if hasattr(self.pipeline, "enable_attention_slicing"):
                    self.pipeline.enable_attention_slicing("max")
                torch.cuda.empty_cache()
                base_w = self._round_to_8(int(base_w * 0.9))
                base_h = self._round_to_8(int(base_h * 0.9))
                img = self.pipeline(
                    prompt=pos,
                    negative_prompt=neg,
                    width=base_w,
                    height=base_h,
                    num_inference_steps=max(20, steps - 4),  # Reduce steps slightly for OOM recovery
                    guidance_scale=max(7.0, cfg_scale - 0.5),  # Reduce CFG slightly for OOM recovery
                    generator=self._generator(seed),
                ).images[0]
            else:
                raise

        if hires:
            try:
                img = self._hires_refine(
                    img,
                    pos,
                    neg,
                    denoise=0.34,
                    upscale=upscale,
                    seed=seed,
                    steps=18,
                    guidance_scale=7.8,
                )
            except RuntimeError as e:
                if "CUDA out of memory" in str(e):
                    logger.warning("OOM during advanced cover hi-res; returning first-pass image")
                else:
                    raise

        return {
            "image_base64": self._image_to_b64(img),
            "prompt": pos,
            "style": style,
            "width": img.width,
            "height": img.height,
            "type": "cover",
            "seed": seed,
            "model": self.loaded_model_id,
            "advanced": True,
        }

    def get_style_options(self) -> List[str]:
        if PROMPT_BUILDER_AVAILABLE:
            return ManhwaPromptBuilder.get_style_options()
        else:
            return list(self.manhwa_style_models.keys())
    
    def get_ssd_stats(self) -> Dict[str, Any]:
        """Get NVMe SSD usage statistics."""
        import shutil
        
        stats = {
            "ssd_paths": {
                "models": self.model_cache_dir,
                "outputs": self.output_dir, 
                "temp": self.temp_dir
            },
            "cache_info": {
                "cached_models": len(self._model_cache),
                "cache_limit": self._cache_size_limit,
                "loaded_model": self.loaded_model_id
            }
        }
        
        # Get disk usage for each SSD path
        for name, path in stats["ssd_paths"].items():
            try:
                if os.path.exists(path):
                    total, used, free = shutil.disk_usage(path)
                    stats[f"{name}_disk"] = {
                        "total_gb": round(total / (1024**3), 2),
                        "used_gb": round(used / (1024**3), 2),  
                        "free_gb": round(free / (1024**3), 2),
                        "usage_percent": round((used / total) * 100, 1)
                    }
            except Exception:
                stats[f"{name}_disk"] = "unavailable"
                
        return stats

    async def cleanup(self):
        if self.pipeline:
            del self.pipeline
            self.pipeline = None
        if self._i2i:
            del self._i2i
            self._i2i = None
        if self._compel:
            del self._compel
            self._compel = None
        if STABLE_DIFFUSION_AVAILABLE and torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("ImageGenerationService cleaned up")