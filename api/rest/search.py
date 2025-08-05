from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel
from services.search_service import SearchService

router = APIRouter()
search_service = SearchService()

class SearchResult(BaseModel):
    id: str
    title: str
    author: str
    genre: List[str]
    relevance_score: float
    snippet: str

@router.get("/", response_model=List[SearchResult])
async def search_manhwa(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, le=50, description="Number of results to return")
):
    return await search_service.search(query=q, limit=limit)

@router.get("/similar/{manhwa_id}", response_model=List[SearchResult])
async def find_similar(manhwa_id: str, limit: int = Query(5, le=20)):
    return await search_service.find_similar(manhwa_id=manhwa_id, limit=limit)