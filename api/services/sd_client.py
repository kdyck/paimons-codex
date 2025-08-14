import os
import logging
from typing import Dict, Any, Optional, List
import httpx
import asyncio

logger = logging.getLogger(__name__)


class StableDiffusionClient:
    """Client for communicating with the separate Stable Diffusion service."""
    
    def __init__(self):
        self.base_url = os.getenv('SD_API_URL', 'http://10.89.0.6:7860')
        self.client = httpx.AsyncClient(timeout=300.0)  # 5 minute timeout
        logger.info(f"SD Client initialized with URL: {self.base_url}")
    
    async def health_check(self) -> bool:
        """Check if the SD service is healthy and ready."""
        try:
            logger.info(f"Health check: Connecting to {self.base_url}/health")
            response = await self.client.get(f"{self.base_url}/health")
            logger.info(f"Health check: Response status {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Health check: Response data {data}")
                available = data.get('stable_diffusion_available', False)
                logger.info(f"Health check: SD available = {available}")
                return available
            logger.warning(f"Health check: Non-200 status code {response.status_code}")
            return False
        except Exception as e:
            logger.error(f"SD health check failed: {e}")
            return False
    
    async def generate_character_art(
        self,
        character_prompt: str,
        style: str = "anime",
        width: int = 768,
        height: int = 1152,
        seed: Optional[int] = None,
        hires: bool = True
    ) -> Dict[str, Any]:
        """Generate character art using the SD service."""
        try:
            payload = {
                "character_prompt": character_prompt,
                "style": style,
                "width": width,
                "height": height,
                "seed": seed,
                "hires": hires
            }
            
            logger.info(f"Sending character generation request: {character_prompt[:50]}...")
            
            response = await self.client.post(
                f"{self.base_url}/generate/character", 
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info("Character art generated successfully")
                return result
            else:
                error_msg = f"SD service returned status {response.status_code}: {response.text}"
                logger.error(error_msg)
                return {"error": error_msg}
                
        except Exception as e:
            error_msg = f"SD client error: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}

    async def generate_scene_art(
        self,
        scene_prompt: str,
        characters: Optional[List[str]] = None,
        style: str = "anime",
        width: int = 832,
        height: int = 1216,
        seed: Optional[int] = None,
        hires: bool = True
    ) -> Dict[str, Any]:
        """Generate scene art using the SD service."""
        try:
            payload = {
                "scene_prompt": scene_prompt,
                "characters": characters,
                "style": style,
                "width": width,
                "height": height,
                "seed": seed,
                "hires": hires
            }
            
            logger.info(f"Sending scene generation request: {scene_prompt[:50]}...")
            
            response = await self.client.post(
                f"{self.base_url}/generate/scene", 
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info("Scene art generated successfully")
                return result
            else:
                error_msg = f"SD service returned status {response.status_code}: {response.text}"
                logger.error(error_msg)
                return {"error": error_msg}
                
        except Exception as e:
            error_msg = f"SD client error: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}

    async def generate_cover_art(
        self,
        title: str,
        genre: str,
        main_character: str,
        style: str = "anime",
        width: int = 832,
        height: int = 1216,
        seed: Optional[int] = None,
        hires: bool = True
    ) -> Dict[str, Any]:
        """Generate cover art using the SD service."""
        try:
            payload = {
                "title": title,
                "genre": genre,
                "main_character": main_character,
                "style": style,
                "width": width,
                "height": height,
                "seed": seed,
                "hires": hires
            }
            
            logger.info(f"Sending cover generation request: {title}")
            
            response = await self.client.post(
                f"{self.base_url}/generate/cover", 
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info("Cover art generated successfully")
                return result
            else:
                error_msg = f"SD service returned status {response.status_code}: {response.text}"
                logger.error(error_msg)
                return {"error": error_msg}
                
        except Exception as e:
            error_msg = f"SD client error: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}

    async def generate_advanced_cover_art(
        self,
        enhanced_prompt: str,
        style: str = "anime",
        width: int = 832,
        height: int = 1216,
        seed: Optional[int] = None,
        hires: bool = True
    ) -> Dict[str, Any]:
        """Generate advanced cover art with custom prompt using the SD service."""
        try:
            payload = {
                "enhanced_prompt": enhanced_prompt,
                "style": style,
                "width": width,
                "height": height,
                "seed": seed,
                "hires": hires
            }
            
            logger.info(f"Sending advanced cover generation request: {enhanced_prompt[:50]}...")
            
            response = await self.client.post(
                f"{self.base_url}/generate/advanced-cover", 
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info("Advanced cover art generated successfully")
                return result
            else:
                error_msg = f"SD service returned status {response.status_code}: {response.text}"
                logger.error(error_msg)
                return {"error": error_msg}
                
        except Exception as e:
            error_msg = f"SD client error: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Global instance
_sd_client: Optional[StableDiffusionClient] = None


async def get_sd_client() -> StableDiffusionClient:
    """Get the global SD client instance."""
    global _sd_client
    if _sd_client is None:
        _sd_client = StableDiffusionClient()
    return _sd_client


async def cleanup_sd_client():
    """Clean up the SD client."""
    global _sd_client
    if _sd_client:
        await _sd_client.close()
        _sd_client = None