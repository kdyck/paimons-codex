from typing import Dict, Any, List
import httpx
import json
import os

class LlamaService:
    def __init__(self):
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://192.168.1.99:11434")
        print(f"LlamaService initialized with Ollama at {self.ollama_base_url}")
    
    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models from Ollama"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.ollama_base_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return data.get("models", [])
                return []
        except Exception as e:
            print(f"Error getting models: {e}")
            return []
    
    async def generate(self, prompt: str, max_tokens: int = 100, temperature: float = 0.7, model: str = None) -> Dict[str, Any]:
        """Generate text using Ollama"""
        try:
            # Get available models if none specified
            if not model:
                models = await self.get_available_models()
                if models:
                    model = models[0]["name"]
                else:
                    return {
                        "generated_text": "No models available in Ollama",
                        "tokens_used": 0
                    }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": temperature
                    }
                }
                
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "generated_text": data.get("response", ""),
                        "tokens_used": data.get("eval_count", 0),
                        "model": model
                    }
                else:
                    return {
                        "generated_text": f"Error: {response.status_code}",
                        "tokens_used": 0
                    }
        except Exception as e:
            print(f"Error generating text: {e}")
            return {
                "generated_text": f"Error: {str(e)}",
                "tokens_used": 0
            }
    
    async def chat(self, messages: List[Dict[str, str]], model: str = None) -> Dict[str, Any]:
        """Chat with Ollama using conversation format"""
        try:
            if not model:
                models = await self.get_available_models()
                if models:
                    model = models[0]["name"]
                else:
                    return {
                        "message": "No models available in Ollama",
                        "tokens_used": 0
                    }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "model": model,
                    "messages": messages,
                    "stream": False
                }
                
                response = await client.post(
                    f"{self.ollama_base_url}/api/chat",
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "message": data.get("message", {}),
                        "tokens_used": data.get("eval_count", 0),
                        "model": model
                    }
                else:
                    return {
                        "message": {"role": "assistant", "content": f"Error: {response.status_code}"},
                        "tokens_used": 0
                    }
        except Exception as e:
            print(f"Error in chat: {e}")
            return {
                "message": {"role": "assistant", "content": f"Error: {str(e)}"},
                "tokens_used": 0
            }
    
    async def summarize_manhwa(self, manhwa_id: str) -> Dict[str, Any]:
        """Summarize manhwa using Ollama"""
        # This would typically fetch manhwa data and create a summary prompt
        prompt = f"Please provide a brief summary for manhwa with ID: {manhwa_id}"
        result = await self.generate(prompt, max_tokens=200)
        return {
            "manhwa_id": manhwa_id,
            "summary": result.get("generated_text", "Unable to generate summary")
        }
    
    async def generate_manhwa_story(self, genre: str, setting: str, main_character: str, 
                                  plot_outline: str, chapter_count: int, art_style: str) -> Dict[str, Any]:
        """Generate a complete manhwa story with chapter outlines"""
        import uuid
        
        prompt = f"""
        Create a {genre} manhwa story with the following elements:
        - Setting: {setting}
        - Main Character: {main_character}
        - Art Style: {art_style}
        {f"- Plot Outline: {plot_outline}" if plot_outline else ""}
        
        Generate:
        1. A compelling title
        2. A 2-3 sentence synopsis
        3. Outline for {chapter_count} chapters with:
           - Chapter title
           - Brief chapter summary (2-3 sentences)
           - Key scenes for visual representation
           - Main characters introduced/featured
        
        Format as JSON-like structure but in readable text format.
        Focus on visual storytelling elements suitable for manhwa format.
        Include emotional beats and dramatic moments.
        """
        
        result = await self.generate(prompt, max_tokens=1000)
        story_id = str(uuid.uuid4())
        
        return {
            "id": story_id,
            "title": f"Generated {genre.title()} Story",
            "synopsis": result.get("generated_text", "")[:200] + "...",
            "genre": genre,
            "setting": setting,
            "main_character": main_character,
            "chapters_outline": [{"chapter": i+1, "outline": "Generated outline"} for i in range(chapter_count)],
            "art_style": art_style,
            "full_content": result.get("generated_text", "")
        }
    
    async def generate_manhwa_chapter(self, story_id: str, chapter_number: int, previous_summary: str = "") -> Dict[str, Any]:
        """Generate detailed content for a specific chapter"""
        
        prompt = f"""
        Generate detailed content for Chapter {chapter_number} of a manhwa story.
        {f"Previous chapter summary: {previous_summary}" if previous_summary else ""}
        
        Include:
        1. Chapter title
        2. Full chapter content with dialogue and narration
        3. Scene descriptions for visual panels (5-8 key scenes)
        4. Character emotions and expressions for each scene
        5. Key dialogue that should be emphasized
        
        Write in manhwa/comic format with clear scene breaks.
        Focus on visual storytelling and dramatic moments.
        Include action lines and emotional beats.
        Keep dialogue concise and impactful.
        """
        
        result = await self.generate(prompt, max_tokens=800)
        content = result.get("generated_text", "")
        
        # Extract scene descriptions (simplified parsing)
        scenes = []
        emotions = []
        dialogue = []
        
        # Basic parsing - in production you'd use more sophisticated text processing
        lines = content.split('\n')
        for line in lines:
            if 'scene:' in line.lower() or 'panel:' in line.lower():
                scenes.append(line.strip())
            elif '"' in line and len(line) < 100:  # Likely dialogue
                dialogue.append(line.strip())
            elif any(emotion in line.lower() for emotion in ['angry', 'sad', 'happy', 'surprised', 'worried', 'excited']):
                emotions.append(line.strip())
        
        return {
            "chapter_number": chapter_number,
            "title": f"Chapter {chapter_number}",
            "content": content,
            "scene_descriptions": scenes[:8],  # Limit to 8 scenes
            "character_emotions": emotions[:5],  # Top 5 emotional moments
            "key_dialogue": dialogue[:10]  # Top 10 dialogue pieces
        }
    
    async def generate_character_sheet(self, character_name: str, description: str, art_style: str) -> Dict[str, Any]:
        """Generate consistent character description for art generation"""
        
        prompt = f"""
        Create a detailed character sheet for {character_name} in {art_style} style.
        Base description: {description}
        
        Generate:
        1. Physical appearance (height, build, hair, eyes, skin, distinctive features)
        2. Clothing style and typical outfits
        3. Personality traits reflected in appearance
        4. Facial expressions and body language
        5. Color palette (hair, eyes, clothing colors)
        6. Art generation prompts for consistent character design
        
        Format for use in image generation systems.
        Be specific about visual details for artistic consistency.
        """
        
        result = await self.generate(prompt, max_tokens=400)
        
        return {
            "character_name": character_name,
            "art_style": art_style,
            "character_sheet": result.get("generated_text", ""),
            "art_prompt": f"{character_name}, {description}, {art_style}, manhwa style, detailed character art",
            "tags": ["manhwa", art_style, "character_design"]
        }