import os
import io
import base64
from typing import Dict, Any, List, Optional, Tuple
import logging
import asyncio

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

        if not STABLE_DIFFUSION_AVAILABLE:
            self.device = "cpu"
            self.loaded_style = None
            self.loaded_model_id = None
            logger.warning("Stable Diffusion not available - returning placeholders")
            return

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Default HF models (you can override with safetensors paths)
        self.model_id = "runwayml/stable-diffusion-v1-5"
        self.manhwa_style_models = {
            "anime": "runwayml/stable-diffusion-v1-5",
            "realistic": "stabilityai/stable-diffusion-2-1",
            "chibi": "runwayml/stable-diffusion-v1-5",
        }
        self.loaded_style: Optional[str] = None
        self.loaded_model_id: Optional[str] = None

        logger.info(f"ImageGenerationService initialized on device: {self.device}")

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
        style_prompts = {
            "anime": "anime style, manga art, cel-shaded, clean lines, vibrant colors",
            "realistic": "realistic, detailed, photorealistic, high quality", 
            "chibi": "chibi style, cute, kawaii, simple, rounded features",
        }
        manhwa = "manhwa style, webtoon style, korean comic art, digital art, beautiful composition, dramatic lighting"
        positive = f"{prompt}, {style_prompts.get(style, style_prompts['anime'])}, {manhwa}"
        
        negative = (
            "lowres, blurry, jpeg artifacts, watermark, text, signature, bad anatomy, "
            "bad proportions, extra fingers, extra limbs, missing limbs, deformed, worst quality"
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

    # ----------------------------- Model load --------------------------------
    async def load_model(self, style: str = "anime", model_override: Optional[str] = None):
        if not STABLE_DIFFUSION_AVAILABLE:
            return

        async with self._lock:
            target_model_id = model_override or self.manhwa_style_models.get(style, self.model_id)
            if self.pipeline is not None and self.loaded_model_id == target_model_id:
                # already loaded (style may differ but model id is what matters)
                self.loaded_style = style
                return

            logger.info(f"Loading SD model: {target_model_id} (style={style})")
            try:
                dtype = torch.float16 if (self.device == "cuda") else torch.float32
                self.pipeline = StableDiffusionPipeline.from_pretrained(
                    target_model_id,
                    torch_dtype=dtype,
                    safety_checker=None,
                    requires_safety_checker=False,
                )

                # DPM++ Multistep for crisp lines
                try:
                    self.pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
                        self.pipeline.scheduler.config,
                        algorithm_type="dpmsolver++",
                    )
                except Exception as e:
                    logger.warning(f"Falling back to default scheduler: {e}")

                self.pipeline = self.pipeline.to(self.device)

                # Perf toggles
                if self.device == "cuda":
                    torch.backends.cuda.matmul.allow_tf32 = True
                if hasattr(self.pipeline, "enable_attention_slicing"):
                    self.pipeline.enable_attention_slicing("max")
                if hasattr(self.pipeline, "enable_vae_slicing"):
                    self.pipeline.enable_vae_slicing()
                if hasattr(self.pipeline, "vae") and hasattr(self.pipeline.vae, "enable_tiling"):
                    self.pipeline.vae.enable_tiling()
                if self.device == "cuda":
                    try:
                        # better sustained throughput than full offload
                        self.pipeline.enable_sequential_cpu_offload()
                    except Exception:
                        self.pipeline.enable_model_cpu_offload()

                self._i2i = None  # reset; will rebuild from new base pipe lazily
                self._compel = None  # reset; will rebuild with new model
                self.loaded_style = style
                self.loaded_model_id = target_model_id
                logger.info("Model loaded successfully")
            except Exception as e:
                logger.error(f"Error loading model '{target_model_id}': {e}")
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
                    denoise=0.32,
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

    def get_style_options(self) -> List[str]:
        return list(self.manhwa_style_models.keys())

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