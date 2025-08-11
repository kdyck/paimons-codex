from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from llm.llama_service import LlamaService
from services.image_generation_service import ImageGenerationService
from services.manhwa_storage_service import ManhwaStorageService

logger = logging.getLogger(__name__)

router = APIRouter()
llama_service = LlamaService()
image_service = ImageGenerationService()
storage_service = ManhwaStorageService()

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

class StoryGenerationRequest(BaseModel):
    genre: str = "fantasy"  # fantasy, romance, action, mystery, etc.
    setting: str = "modern world"  # modern world, medieval fantasy, sci-fi, etc.
    main_character: str = "young hero"
    plot_outline: str = ""  # optional existing plot
    chapter_count: int = 10
    art_style: str = "anime style"  # anime style, realistic, chibi, etc.

class ChapterGenerationRequest(BaseModel):
    story_id: str
    chapter_number: int
    previous_chapter_summary: str = ""

class StoryResponse(BaseModel):
    id: str
    title: str
    synopsis: str
    genre: str
    setting: str
    main_character: str
    chapters_outline: List[Dict[str, Any]]
    art_style: str

class ChapterResponse(BaseModel):
    chapter_number: int
    title: str
    content: str
    scene_descriptions: List[str]  # For image generation
    character_emotions: List[str]  # For consistent art
    key_dialogue: List[str]

@router.post("/generate-story", response_model=StoryResponse)
async def generate_manhwa_story(request: StoryGenerationRequest):
    """Generate a complete manhwa story outline with chapters"""
    try:
        result = await llama_service.generate_manhwa_story(
            genre=request.genre,
            setting=request.setting,
            main_character=request.main_character,
            plot_outline=request.plot_outline,
            chapter_count=request.chapter_count,
            art_style=request.art_style
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-chapter", response_model=ChapterResponse)
async def generate_manhwa_chapter(request: ChapterGenerationRequest):
    """Generate detailed content for a specific chapter"""
    try:
        result = await llama_service.generate_manhwa_chapter(
            story_id=request.story_id,
            chapter_number=request.chapter_number,
            previous_summary=request.previous_chapter_summary
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-character-sheet")
async def generate_character_sheet(character_name: str, description: str, art_style: str = "anime style"):
    """Generate consistent character description for art generation"""
    try:
        result = await llama_service.generate_character_sheet(character_name, description, art_style)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Image Generation Endpoints
class ImageGenerationRequest(BaseModel):
    prompt: str
    style: str = "anime"
    width: int = 512
    height: int = 512
    characters: Optional[List[str]] = None

class CharacterArtRequest(BaseModel):
    character_prompt: str
    style: str = "anime"
    width: int = 512
    height: int = 768

class CoverArtRequest(BaseModel):
    title: str
    genre: str
    main_character: str
    style: str = "anime"

class ImageResponse(BaseModel):
    image_base64: str
    prompt: str
    style: str
    width: int
    height: int
    type: str

@router.get("/art-styles")
async def get_art_styles():
    """Get available art styles for image generation"""
    try:
        styles = image_service.get_style_options()
        return {"styles": styles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-character-art", response_model=ImageResponse)
async def generate_character_art(request: CharacterArtRequest):
    """Generate character artwork using Stable Diffusion"""
    try:
        result = await image_service.generate_character_art(
            character_prompt=request.character_prompt,
            style=request.style,
            width=request.width,
            height=request.height
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-scene-art", response_model=ImageResponse)
async def generate_scene_art(request: ImageGenerationRequest):
    """Generate scene artwork for manhwa panels"""
    try:
        result = await image_service.generate_scene_art(
            scene_prompt=request.prompt,
            characters=request.characters,
            style=request.style,
            width=request.width,
            height=request.height
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-cover-art", response_model=ImageResponse)
async def generate_cover_art(request: CoverArtRequest):
    """Generate cover artwork for manhwa"""
    try:
        result = await image_service.generate_cover_art(
            title=request.title,
            genre=request.genre,
            main_character=request.main_character,
            style=request.style
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-full-manhwa")
async def generate_full_manhwa(story_request: StoryGenerationRequest):
    """Generate complete manhwa with story and art"""
    try:
        # Generate story first
        story = await llama_service.generate_manhwa_story(
            genre=story_request.genre,
            setting=story_request.setting,
            main_character=story_request.main_character,
            plot_outline=story_request.plot_outline,
            chapter_count=story_request.chapter_count,
            art_style=story_request.art_style
        )
        
        # Generate cover art
        cover_art = await image_service.generate_cover_art(
            title=story["title"],
            genre=story_request.genre,
            main_character=story_request.main_character,
            style=story_request.art_style
        )
        
        # Generate character sheet and art
        character_sheet = await llama_service.generate_character_sheet(
            character_name=story_request.main_character,
            description="Main protagonist",
            art_style=story_request.art_style
        )
        
        character_art = await image_service.generate_character_art(
            character_prompt=character_sheet["art_prompt"],
            style=story_request.art_style
        )
        
        # Store complete manhwa in MinIO (optional)
        manhwa_data = {
            "story": story,
            "cover_art": cover_art,
            "character_sheet": character_sheet,
            "character_art": character_art
        }
        
        stored_result = None
        storage_success = False
        
        try:
            stored_result = await storage_service.store_complete_manhwa(manhwa_data)
            storage_success = True
        except Exception as storage_error:
            logger.warning(f"Storage failed but manhwa generated successfully: {storage_error}")
        
        return {
            "story": story,
            "cover_art": cover_art,
            "character_sheet": character_sheet,
            "character_art": character_art,
            "storage_info": stored_result,
            "created": True,
            "stored": storage_success,
            "storage_error": None if storage_success else "MinIO storage unavailable"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Manhwa Storage Management Endpoints
@router.get("/manhwa-list")
async def get_manhwa_list():
    """Get list of all stored manhwa"""
    try:
        manhwa_list = await storage_service.get_manhwa_list()
        return {"manhwa": manhwa_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/manhwa/{manhwa_id}")
async def get_manhwa_details(manhwa_id: str):
    """Get detailed manhwa data including all assets"""
    try:
        manhwa_details = await storage_service.get_manhwa_details(manhwa_id)
        if not manhwa_details:
            raise HTTPException(status_code=404, detail="Manhwa not found")
        return manhwa_details
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/manhwa/{manhwa_id}")
async def delete_manhwa(manhwa_id: str):
    """Delete manhwa and all its assets"""
    try:
        deleted = await storage_service.delete_manhwa(manhwa_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Manhwa not found")
        return {"message": "Manhwa deleted successfully", "deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))