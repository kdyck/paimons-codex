from typing import Dict, Any

class LlamaService:
    def __init__(self):
        print("LlamaService initialized in simple mode (LLM features disabled)")
        self.model_name = "openlm-research/open_llama_3b_v2"
        self.model_loaded = False
    
    async def generate(self, prompt: str, max_tokens: int = 100, temperature: float = 0.7) -> Dict[str, Any]:
        # Simplified - return mock response
        print(f"Would generate text for prompt: {prompt[:50]}...")
        return {
            "generated_text": "Mock generated text - LLM features are disabled in simple mode.",
            "tokens_used": 10
        }
    
    async def summarize_manhwa(self, manhwa_id: str) -> Dict[str, Any]:
        # Simplified - return mock response
        print(f"Would summarize manhwa: {manhwa_id}")
        return {
            "manhwa_id": manhwa_id,
            "summary": "Mock summary - LLM features are disabled in simple mode."
        }