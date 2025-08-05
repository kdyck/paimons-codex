from typing import List, Optional, Dict, Any
import os
from dal.chroma_client import ChromaClient

class ManhwaService:
    def __init__(self):
        self.chroma_client = ChromaClient()
        self.oracle_client = None
        
        # Only initialize Oracle if not skipped
        if not os.getenv('ORACLE_SKIP'):
            try:
                from dal.oracle_client import OracleClient
                self.oracle_client = OracleClient()
            except Exception as e:
                print(f"Oracle initialization failed: {e}")
                print("Running in ChromaDB-only mode")
    
    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        if self.oracle_client:
            return await self.oracle_client.get_manhwa_list(skip=skip, limit=limit)
        else:
            # Fallback: return sample data for development
            return self._get_sample_data()[skip:skip+limit]
    
    async def get_by_id(self, manhwa_id: str) -> Optional[Dict[str, Any]]:
        if self.oracle_client:
            return await self.oracle_client.get_manhwa_by_id(manhwa_id)
        else:
            # Fallback: search in sample data
            sample_data = self._get_sample_data()
            return next((item for item in sample_data if item["id"] == manhwa_id), None)
    
    async def create(self, manhwa_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.oracle_client:
            manhwa = await self.oracle_client.create_manhwa(manhwa_data)
        else:
            # Fallback: simulate creation
            manhwa = {**manhwa_data, "id": manhwa_data.get("id", f"manhwa_{len(self._get_sample_data()) + 1}")}
        
        await self.chroma_client.add_manhwa_embedding(
            manhwa_id=manhwa["id"],
            title=manhwa["title"],
            description=manhwa["description"],
            genre=manhwa["genre"]
        )
        
        return manhwa
    
    async def update(self, manhwa_id: str, manhwa_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.oracle_client:
            manhwa = await self.oracle_client.update_manhwa(manhwa_id, manhwa_data)
        else:
            # Fallback: simulate update
            manhwa = {**manhwa_data, "id": manhwa_id}
        
        await self.chroma_client.update_manhwa_embedding(
            manhwa_id=manhwa_id,
            title=manhwa["title"],
            description=manhwa["description"],
            genre=manhwa["genre"]
        )
        
        return manhwa
    
    def _get_sample_data(self) -> List[Dict[str, Any]]:
        """Sample data for development when Oracle is not available"""
        return [
            {
                "id": "solo-leveling",
                "title": "Solo Leveling",
                "author": "Chugong",
                "genre": ["Action", "Fantasy", "Adventure"],
                "status": "completed",
                "description": "10 years ago, after the Gate that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate.",
                "cover_image": "https://example.com/solo-leveling-cover.jpg"
            },
            {
                "id": "tower-of-god",
                "title": "Tower of God",
                "author": "SIU",
                "genre": ["Action", "Drama", "Fantasy", "Mystery"],
                "status": "ongoing",
                "description": "Bam, who was alone all his life has entered the tower to chase after his only friend, available to fulfill his promise.",
                "cover_image": "https://example.com/tower-of-god-cover.jpg"
            },
            {
                "id": "the-god-of-high-school",
                "title": "The God of High School",
                "author": "Yongje Park",
                "genre": ["Action", "Comedy", "Supernatural", "Martial Arts"],
                "status": "completed",
                "description": "While an island half-disappearing from the face of the earth, a mysterious organization is sending out invitations for a tournament to every skilled fighter in the world.",
                "cover_image": "https://example.com/god-of-high-school-cover.jpg"
            }
        ]