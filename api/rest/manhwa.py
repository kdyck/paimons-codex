from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from services.manhwa_service import ManhwaService

router = APIRouter()
manhwa_service = ManhwaService()

class ManhwaResponse(BaseModel):
    id: str
    title: str
    author: str
    genre: List[str]
    status: str
    description: str
    cover_image: Optional[str] = None

@router.get("/", response_model=List[ManhwaResponse])
async def get_all_manhwa(skip: int = 0, limit: int = 20):
    return await manhwa_service.get_all(skip=skip, limit=limit)

@router.get("/{manhwa_id}", response_model=ManhwaResponse)
async def get_manhwa(manhwa_id: str):
    manhwa = await manhwa_service.get_by_id(manhwa_id)
    if not manhwa:
        raise HTTPException(status_code=404, detail="Manhwa not found")
    return manhwa

@router.post("/", response_model=ManhwaResponse)
async def create_manhwa(manhwa_data: dict):
    return await manhwa_service.create(manhwa_data)

@router.put("/{manhwa_id}", response_model=ManhwaResponse)
async def update_manhwa(manhwa_id: str, manhwa_data: dict):
    manhwa = await manhwa_service.update(manhwa_id, manhwa_data)
    if not manhwa:
        raise HTTPException(status_code=404, detail="Manhwa not found")
    return manhwa

@router.delete("/{manhwa_id}")
async def delete_manhwa(manhwa_id: str):
    success = await manhwa_service.delete(manhwa_id)
    if not success:
        raise HTTPException(status_code=404, detail="Manhwa not found")
    return {"message": "Manhwa deleted successfully"}

@router.get("/{manhwa_id}/similar", response_model=List[ManhwaResponse])
async def get_similar_manhwa(manhwa_id: str, limit: int = 5):
    """Get manhwa similar to the specified one using vector similarity search"""
    manhwa = await manhwa_service.get_by_id(manhwa_id)
    if not manhwa:
        raise HTTPException(status_code=404, detail="Manhwa not found")
    
    similar_manhwa = await manhwa_service.search_similar_manhwa(manhwa_id, limit)
    return similar_manhwa