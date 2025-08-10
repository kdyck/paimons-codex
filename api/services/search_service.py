from typing import List, Dict, Any
import os
import hashlib
from dal.oracle_client import OracleClient

class SearchService:
    def __init__(self):
        self.oracle_client = None
        
        # Only initialize Oracle if not skipped
        if not os.getenv('ORACLE_SKIP'):
            try:
                self.oracle_client = OracleClient()
            except Exception as e:
                print(f"Oracle initialization failed in SearchService: {e}")
                print("Search functionality will be limited")
    
    def _generate_simple_embedding(self, text: str) -> List[float]:
        """Generate a simple deterministic embedding for search"""
        text = text.lower()
        
        # Create a hash-based embedding (384 dimensions)
        hash_obj = hashlib.md5(text.encode())
        hash_hex = hash_obj.hexdigest()
        
        # Convert hex to normalized float values
        embedding = []
        for i in range(0, min(len(hash_hex), 96), 2):
            hex_pair = hash_hex[i:i+2]
            val = (int(hex_pair, 16) - 127.5) / 127.5
            embedding.extend([val] * 8)
        
        # Pad or truncate to exactly 384 dimensions
        while len(embedding) < 384:
            embedding.append(0.0)
        embedding = embedding[:384]
        
        return embedding

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        if not self.oracle_client:
            return []
        
        # Generate embedding for the search query
        query_embedding = self._generate_simple_embedding(query)
        
        # Use Oracle's vector search
        vector_results = await self.oracle_client.search_similar_manhwa(
            query_embedding, 
            limit=limit
        )
        
        # Results already contain manhwa details from Oracle
        results = []
        for result in vector_results:
            results.append({
                **result,
                "relevance_score": result.get("similarity_score", 0.0),
                "snippet": f"{result['title']} - {result['description'][:100]}..."
            })
        
        return results
    
    async def find_similar(self, manhwa_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not self.oracle_client:
            return []
            
        manhwa = await self.oracle_client.get_manhwa_by_id(manhwa_id)
        if not manhwa:
            return []
        
        # Generate embedding for the manhwa
        search_text = f"{manhwa['title']} {manhwa['description']} {' '.join(manhwa.get('genre', []))}"
        query_embedding = self._generate_simple_embedding(search_text)
        
        # Use Oracle's vector search with exclusion of the source manhwa
        similar_results = await self.oracle_client.search_similar_manhwa(
            query_embedding,
            limit=limit,
            exclude_id=manhwa_id
        )
        
        results = []
        for result in similar_results:
            results.append({
                **result,
                "relevance_score": result.get("similarity_score", 0.0)
            })
        
        return results