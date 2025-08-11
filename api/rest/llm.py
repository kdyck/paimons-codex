from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from llm.llama_service import LlamaService

router = APIRouter()
llama_service = LlamaService()

class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = 100
    temperature: float = 0.7
    model: str = None

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = None

class GenerateResponse(BaseModel):
    generated_text: str
    tokens_used: int
    model: str = None

class ChatResponse(BaseModel):
    message: Dict[str, Any]
    tokens_used: int
    model: str = None

@router.get("/models")
async def get_models():
    """Get available models from Ollama"""
    try:
        models = await llama_service.get_available_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    try:
        result = await llama_service.generate(
            prompt=request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            model=request.model
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with AI using conversation format"""
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        result = await llama_service.chat(messages=messages, model=request.model)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize")
async def summarize_manhwa(manhwa_id: str):
    return await llama_service.summarize_manhwa(manhwa_id)