from typing import List, Dict, Any
from dal.chroma_client import ChromaClient
from dal.oracle_client import OracleClient

class SearchService:
    def __init__(self):
        self.chroma_client = ChromaClient()
        self.oracle_client = OracleClient()
    
    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        vector_results = await self.chroma_client.similarity_search(
            query=query, 
            limit=limit
        )
        
        results = []
        for result in vector_results:
            manhwa_detail = await self.oracle_client.get_manhwa_by_id(result["id"])
            if manhwa_detail:
                results.append({
                    **manhwa_detail,
                    "relevance_score": result["score"],
                    "snippet": result["snippet"]
                })
        
        return results
    
    async def find_similar(self, manhwa_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        manhwa = await self.oracle_client.get_manhwa_by_id(manhwa_id)
        if not manhwa:
            return []
        
        similar_results = await self.chroma_client.find_similar_manhwa(
            manhwa_id=manhwa_id,
            limit=limit
        )
        
        results = []
        for result in similar_results:
            similar_manhwa = await self.oracle_client.get_manhwa_by_id(result["id"])
            if similar_manhwa:
                results.append({
                    **similar_manhwa,
                    "relevance_score": result["score"]
                })
        
        return results