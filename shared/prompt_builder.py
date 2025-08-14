"""
Shared prompt building utilities for manhwa image generation.

This module provides consistent prompt building across both the API service
and the SD service to avoid duplication and ensure consistency.
"""

from typing import Tuple


class ManhwaPromptBuilder:
    """Builds optimized prompts for manhwa/webtoon style image generation."""
    
    STYLE_PROMPTS = {
        "anime": "manhwa style, webtoon art, korean comic style, clean line art, soft shading, mature illustration",
        "realistic": "realistic manhwa, detailed illustration, semi-realistic art, professional digital art", 
        "chibi": "chibi manhwa style, cute korean comic, simplified features, soft colors",
    }
    
    BASE_NEGATIVE = (
        "lowres, blurry, jpeg artifacts, watermark, text, signature, bad anatomy, "
        "bad proportions, extra fingers, extra limbs, missing limbs, deformed, worst quality, "
        "genshin impact, genshin style, mihoyo, game character, overly fantasy, gacha game style, "
        "too colorful hair, unnatural hair colors, elaborate costumes, fantasy armor"
    )
    
    MANHWA_STYLE = "korean webtoon style, manhwa illustration, modern digital art, natural lighting, realistic proportions"
    
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
        
        return positive, cls.BASE_NEGATIVE
    
    @classmethod
    def build_character_prompts(cls, character_prompt: str, style: str = "anime") -> Tuple[str, str]:
        """Build prompts specifically for character generation."""
        # Add manhwa-specific character qualities
        character_enhancements = (
            "natural hair colors, realistic clothing, modern fashion, "
            "korean features, expressive eyes, natural proportions, "
            "contemporary style, believable character design"
        )
        full_prompt = f"character portrait, {character_prompt}, {character_enhancements}"
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
    def get_style_options(cls) -> list:
        """Get available style options."""
        return list(cls.STYLE_PROMPTS.keys())