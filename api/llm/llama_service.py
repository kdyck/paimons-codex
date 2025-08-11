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