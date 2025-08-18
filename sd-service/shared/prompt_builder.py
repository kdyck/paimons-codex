"""
Shared prompt building utilities for manhwa image generation.

This module provides consistent prompt building across both the API service
and the SD service to avoid duplication and ensure consistency.
"""

from typing import Tuple


class ManhwaPromptBuilder:
    """Builds optimized prompts for manhwa/webtoon style image generation."""
    
    STYLE_PROMPTS = {
        "anime": "anime style, manga art, cel-shaded, clean lines, vibrant colors, MeinaMix style, high quality anime",
        "realistic": "realistic, photorealistic, high detail, soft lighting, cinematic lighting, perfect face, symmetrical face, delicate features, natural skin texture, volumetric lighting, natural eyes, realistic eyes", 
        "chibi": "chibi style, super deformed, tiny body, big head, large sparkling eyes, rounded features, cute anime style, pastel color palette, soft lines, clean shading, kawaii, short, round, small body proportions, stubby limbs, adorable, wholesome, MeinaMix style",
        "watercolor": "watercolor painting, soft brushstrokes, artistic, painted texture, traditional art style",
        "oil painting": "oil painting style, thick brushstrokes, classical art, painted texture, fine art, museum quality",
        "digital art": "video game art, game character design, concept art, 3D rendered, game illustration, digital game art, fantasy game style, RPG character art, MeinaMix style, high quality",
    }
    
    BASE_NEGATIVE = (
        "lowres, blurry, jpeg artifacts, watermark, text, signature, bad anatomy, "
        "bad proportions, extra fingers, extra limbs, missing limbs, deformed, worst quality, "
        "genshin impact, genshin style, fantasy armor, elaborate costumes, unnatural hair colors"
    )
    
    STYLE_NEGATIVE = {
        "realistic": "anime eyes, unrealistic proportions, overexposed skin, cartoon lines, flat shading, bad anatomy, double face, blurry, weird eyes, distorted eyes, asymmetrical eyes, colored contacts, unnatural eye colors, glowing eyes, fantasy eyes, heterochromia, eye makeup, dramatic eye makeup, colored pupils, spiral eyes, star eyes, heart eyes, multiple pupils, fractured iris, kaleidoscope eyes, rainbow eyes, glitch eyes",
        "chibi": "realistic proportions, tall body, normal sized head, small eyes, dark colors, harsh lines",
        "anime": "realistic skin texture, photorealistic",
        "digital art": "traditional art, painterly, sketch",
        "watercolor": "digital art, 3d render, photorealistic",
        "oil painting": "digital art, flat colors, cartoon style"
    }
    
    MANHWA_STYLE = "manhwa style, webtoon style, korean comic art, digital art, beautiful composition, dramatic lighting"
    
    @classmethod
    def build_prompts(cls, prompt: str, style: str = "anime") -> Tuple[str, str]:
        """
        Build positive and negative prompts for manhwa generation.
        
        Args:
            prompt: Base prompt describing what to generate
            style: Style type ("anime", "realistic", "chibi")
            
        Returns:
            Tuple of (positive_prompt, negative_prompt)
        """
        style_prompt = cls.STYLE_PROMPTS.get(style, cls.STYLE_PROMPTS['anime'])
        positive = f"{prompt}, {style_prompt}, {cls.MANHWA_STYLE}"
        
        # Combine base negative with style-specific negatives
        style_negative = cls.STYLE_NEGATIVE.get(style, "")
        if style_negative:
            negative = f"{cls.BASE_NEGATIVE}, {style_negative}"
        else:
            negative = cls.BASE_NEGATIVE
        
        return positive, negative
    
    @classmethod
    def build_character_prompts(cls, character_prompt: str, style: str = "anime") -> Tuple[str, str]:
        """Build prompts specifically for character generation."""
        # Add realistic character enhancements to counter Genshin style
        character_enhancements = "natural hair colors, modern clothing, realistic features"
        
        # Add ethnicity diversity
        ethnicity_cues = cls._get_ethnicity_cues(character_prompt)
        
        full_prompt = f"character portrait, {character_prompt}, {character_enhancements}, {ethnicity_cues}"
        return cls.build_prompts(full_prompt, style)
    
    @classmethod
    def build_scene_prompts(cls, scene_prompt: str, characters: list = None, style: str = "anime") -> Tuple[str, str]:
        """Build prompts specifically for scene generation."""
        full_prompt = scene_prompt
        if characters:
            full_prompt = f"{scene_prompt}, featuring {', '.join(characters)}"
        
        full_prompt = f"scene illustration, {full_prompt}, cinematic composition"
        return cls.build_prompts(full_prompt, style)
    
    @classmethod
    def build_cover_prompts(cls, title: str, genre: str, main_character: str, style: str = "anime") -> Tuple[str, str]:
        """Build prompts specifically for cover art generation."""
        cover_prompt = (
            f"manhwa cover art, {title}, {genre} theme, featuring {main_character}, "
            f"dramatic composition, title design, professional book cover, no lettering, no text"
        )
        positive, negative = cls.build_prompts(cover_prompt, style)
        
        # Strongly suppress accidental text for covers
        enhanced_negative = negative + ", letters, words, text, watermark"
        return positive, enhanced_negative
    
    @classmethod
    def _get_gender_cues(cls, prompt: str) -> str:
        """Extract gender cues from prompt for better generation."""
        prompt_lower = prompt.lower()
        if any(word in prompt_lower for word in ["girl", "woman", "female", "she", "her"]):
            return "1girl"
        elif any(word in prompt_lower for word in ["boy", "man", "male", "he", "him"]):
            return "1boy"
        else:
            return "1person"  # Gender neutral
    
    @classmethod
    def _get_ethnicity_cues(cls, prompt: str) -> str:
        """Detect and enhance ethnicity representation."""
        prompt_lower = prompt.lower()
        
        # Explicit ethnicity mentions
        if any(word in prompt_lower for word in ["black", "african", "dark skin", "brown skin"]):
            return "dark skin, african features, black person"
        elif any(word in prompt_lower for word in ["latino", "latina", "hispanic", "brown"]):
            return "brown skin, latino features, hispanic person"
        elif any(word in prompt_lower for word in ["asian", "east asian", "korean", "japanese", "chinese"]):
            return "asian features, east asian person"
        elif any(word in prompt_lower for word in ["middle eastern", "arab", "persian"]):
            return "middle eastern features, olive skin"
        elif any(word in prompt_lower for word in ["indian", "south asian", "desi"]):
            return "south asian features, brown skin"
        else:
            # Default to diverse representation if no specific ethnicity mentioned
            import random
            diverse_options = [
                "dark skin, african features",
                "brown skin, latino features", 
                "asian features, east asian",
                "olive skin, middle eastern features",
                "diverse ethnicity, natural skin tone"
            ]
            return random.choice(diverse_options)
    
    @classmethod
    def get_style_options(cls) -> list:
        """Get available style options."""
        return list(cls.STYLE_PROMPTS.keys())