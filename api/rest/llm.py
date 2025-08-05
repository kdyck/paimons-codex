from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from llm.llama_service import LlamaService

router = APIRouter()
llama_service = LlamaService()

class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = 100
    temperature: float = 0.7

class GenerateResponse(BaseModel):
    generated_text: str
    tokens_used: int

@router.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    try:
        result = await llama_service.generate(
            prompt=request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize")
async def summarize_manhwa(manhwa_id: str):
    return await llama_service.summarize_manhwa(manhwa_id)