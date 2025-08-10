from typing import List, Optional, Dict, Any
import os
import hashlib
import json

class ManhwaService:
    def __init__(self):
        self.oracle_client = None
        
        # In-memory storage for fallback mode (when Oracle is not available)
        self._memory_storage = []
        
        # Only initialize Oracle if not skipped
        if not os.getenv('ORACLE_SKIP'):
            try:
                from dal.oracle_client import OracleClient
                self.oracle_client = OracleClient()
            except Exception as e:
                print(f"Oracle initialization failed: {e}")
                print("Running in in-memory fallback mode")
    
    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        if self.oracle_client:
            return await self.oracle_client.get_manhwa_list(skip=skip, limit=limit)
        else:
            # Fallback: return sample data + memory storage for development
            all_data = self._get_sample_data() + self._memory_storage
            return all_data[skip:skip+limit]
    
    async def get_by_id(self, manhwa_id: str) -> Optional[Dict[str, Any]]:
        if self.oracle_client:
            return await self.oracle_client.get_manhwa_by_id(manhwa_id)
        else:
            # Fallback: search in sample data + memory storage
            all_data = self._get_sample_data() + self._memory_storage
            return next((item for item in all_data if item["id"] == manhwa_id), None)
    
    async def create(self, manhwa_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.oracle_client:
            manhwa = await self.oracle_client.create_manhwa(manhwa_data)
            # Generate and store embedding
            await self.generate_and_update_embedding(
                manhwa["id"],
                manhwa["title"],
                manhwa["description"],
                manhwa["genre"]
            )
        else:
            # Fallback: create in memory storage
            next_id = len(self._get_sample_data()) + len(self._memory_storage) + 1
            manhwa = {
                **manhwa_data, 
                "id": manhwa_data.get("id", f"manhwa_{next_id}")
            }
            # Add to memory storage for persistence across requests
            self._memory_storage.append(manhwa)
            print(f"Created manhwa in memory: {manhwa['title']} (ID: {manhwa['id']})")
        
        return manhwa
    
    async def update(self, manhwa_id: str, manhwa_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.oracle_client:
            manhwa = await self.oracle_client.update_manhwa(manhwa_id, manhwa_data)
            # Update embedding if content changed
            await self.generate_and_update_embedding(
                manhwa["id"],
                manhwa["title"],
                manhwa["description"],
                manhwa["genre"]
            )
        else:
            # Fallback: update in memory storage
            for i, item in enumerate(self._memory_storage):
                if item["id"] == manhwa_id:
                    self._memory_storage[i] = {**manhwa_data, "id": manhwa_id}
                    break
            manhwa = {**manhwa_data, "id": manhwa_id}
        
        return manhwa
    
    async def delete(self, manhwa_id: str) -> bool:
        if self.oracle_client:
            success = await self.oracle_client.delete_manhwa(manhwa_id)
        else:
            # Fallback: remove from memory storage
            initial_count = len(self._memory_storage)
            self._memory_storage = [item for item in self._memory_storage if item["id"] != manhwa_id]
            success = len(self._memory_storage) < initial_count
            if success:
                print(f"Deleted manhwa from memory: {manhwa_id}")
        
        return success
    
    def _generate_simple_embedding(self, title: str, description: str, genres: List[str]) -> List[float]:
        """Generate a simple deterministic embedding for development/fallback"""
        # Combine text for embedding
        text = f"{title} {description} {' '.join(genres)}".lower()
        
        # Create a hash-based embedding (384 dimensions)
        hash_obj = hashlib.md5(text.encode())
        hash_hex = hash_obj.hexdigest()
        
        # Convert hex to normalized float values
        embedding = []
        for i in range(0, min(len(hash_hex), 96), 2):  # 96 hex chars = 48 bytes = 384 bits
            hex_pair = hash_hex[i:i+2]
            # Convert hex to float between -1 and 1
            val = (int(hex_pair, 16) - 127.5) / 127.5
            embedding.extend([val] * 8)  # Repeat to get to 384 dimensions
        
        # Pad or truncate to exactly 384 dimensions
        while len(embedding) < 384:
            embedding.append(0.0)
        embedding = embedding[:384]
        
        return embedding
    
    async def generate_and_update_embedding(self, manhwa_id: str, title: str, description: str, genres: List[str]) -> None:
        """Generate and update embedding for a manhwa"""
        if self.oracle_client:
            # Generate embedding (in a real app, you'd use a proper embedding model)
            embedding = self._generate_simple_embedding(title, description, genres)
            await self.oracle_client.update_manhwa_embedding(manhwa_id, embedding)
    
    async def search_similar_manhwa(self, manhwa_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Find similar manhwa to the given one"""
        if not self.oracle_client:
            return []  # No similarity search in fallback mode
        
        # Get the manhwa to find similar ones
        manhwa = await self.get_by_id(manhwa_id)
        if not manhwa:
            return []
        
        # Generate embedding for search
        embedding = self._generate_simple_embedding(
            manhwa['title'], 
            manhwa['description'], 
            manhwa['genre']
        )
        
        return await self.oracle_client.search_similar_manhwa(embedding, limit, exclude_id=manhwa_id)
    
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