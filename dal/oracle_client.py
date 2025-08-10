import oracledb
import os
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager

class OracleClient:
    def __init__(self):
        self.connection_params = {
            'user': os.getenv('ORACLE_USER', 'paimons_user'),
            'password': os.getenv('ORACLE_PASSWORD', 'password123'),
            'dsn': os.getenv('ORACLE_DSN', 'localhost:1521/FREEPDB1'),
            'config_dir': os.getenv('ORACLE_CONFIG_DIR', '/opt/oracle/instantclient_21_8/network/admin'),
            'wallet_location': os.getenv('ORACLE_WALLET_LOCATION', '/opt/oracle/instantclient_21_8/network/admin'),
        }
        
        # Initialize Oracle client
        try:
            oracledb.init_oracle_client()
        except Exception as e:
            print(f"Oracle client initialization warning: {e}")
            print("Note: Oracle features will be limited without proper client setup")
    
    @asynccontextmanager
    async def get_connection(self):
        connection = None
        try:
            connection = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: oracledb.connect(**self.connection_params)
            )
            yield connection
        finally:
            if connection:
                connection.close()
    
    async def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        async with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                columns = [desc[0].lower() for desc in cursor.description] if cursor.description else []
                rows = cursor.fetchall()
                
                return [dict(zip(columns, row)) for row in rows]
            finally:
                cursor.close()
    
    async def execute_non_query(self, query: str, params: tuple = None) -> None:
        async with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                conn.commit()
            finally:
                cursor.close()
    
    async def init_database(self) -> None:
        """Initialize database tables"""
        create_manhwa_table = """
        CREATE TABLE IF NOT EXISTS manhwa (
            id VARCHAR2(50) PRIMARY KEY,
            title VARCHAR2(500) NOT NULL,
            author VARCHAR2(200) NOT NULL,
            genre CLOB,
            status VARCHAR2(50) DEFAULT 'ongoing',
            description CLOB,
            cover_image VARCHAR2(1000),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            rating NUMBER(3,2) DEFAULT 0.0,
            view_count NUMBER DEFAULT 0,
            embedding VECTOR(384, FLOAT32)
        )
        """
        
        create_vector_index = """
        CREATE VECTOR INDEX IF NOT EXISTS manhwa_vector_idx ON manhwa (embedding)
        ORGANIZATION NEIGHBOR PARTITIONS
        WITH TARGET ACCURACY 95
        """
        
        create_chapters_table = """
        CREATE TABLE IF NOT EXISTS chapters (
            id VARCHAR2(50) PRIMARY KEY,
            manhwa_id VARCHAR2(50) REFERENCES manhwa(id),
            chapter_number NUMBER NOT NULL,
            title VARCHAR2(500),
            content CLOB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        create_reviews_table = """
        CREATE TABLE IF NOT EXISTS reviews (
            id VARCHAR2(50) PRIMARY KEY,
            manhwa_id VARCHAR2(50) REFERENCES manhwa(id),
            user_id VARCHAR2(50),
            rating NUMBER(1) CHECK (rating BETWEEN 1 AND 5),
            comment CLOB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        try:
            await self.execute_non_query(create_manhwa_table)
            await self.execute_non_query(create_chapters_table)
            await self.execute_non_query(create_reviews_table)
            
            # Create vector index (may fail if vectors not supported, that's ok)
            try:
                await self.execute_non_query(create_vector_index)
                print("Vector index created successfully")
            except Exception as ve:
                print(f"Vector index creation skipped: {ve}")
            
            print("Database tables initialized successfully")
        except Exception as e:
            print(f"Error initializing database: {e}")
    
    async def get_manhwa_list(self, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        query = """
        SELECT id, title, author, genre, status, description, cover_image, rating, view_count
        FROM manhwa 
        ORDER BY created_at DESC
        OFFSET :skip ROWS FETCH NEXT :limit ROWS ONLY
        """
        
        results = await self.execute_query(query, (skip, limit))
        
        # Parse JSON genre field
        for result in results:
            if result.get('genre'):
                try:
                    result['genre'] = json.loads(result['genre'])
                except json.JSONDecodeError:
                    result['genre'] = []
            else:
                result['genre'] = []
        
        return results
    
    async def get_manhwa_by_id(self, manhwa_id: str) -> Optional[Dict[str, Any]]:
        query = """
        SELECT id, title, author, genre, status, description, cover_image, rating, view_count
        FROM manhwa 
        WHERE id = :manhwa_id
        """
        
        results = await self.execute_query(query, (manhwa_id,))
        
        if not results:
            return None
        
        result = results[0]
        
        # Parse JSON genre field
        if result.get('genre'):
            try:
                result['genre'] = json.loads(result['genre'])
            except json.JSONDecodeError:
                result['genre'] = []
        else:
            result['genre'] = []
        
        return result
    
    async def create_manhwa(self, manhwa_data: Dict[str, Any]) -> Dict[str, Any]:
        manhwa_id = manhwa_data.get('id') or f"manhwa_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        insert_query = """
        INSERT INTO manhwa (id, title, author, genre, status, description, cover_image)
        VALUES (:id, :title, :author, :genre, :status, :description, :cover_image)
        """
        
        genre_json = json.dumps(manhwa_data.get('genre', []))
        
        params = (
            manhwa_id,
            manhwa_data['title'],
            manhwa_data['author'],
            genre_json,
            manhwa_data.get('status', 'ongoing'),
            manhwa_data.get('description', ''),
            manhwa_data.get('cover_image', '')
        )
        
        await self.execute_non_query(insert_query, params)
        
        return await self.get_manhwa_by_id(manhwa_id)
    
    async def update_manhwa(self, manhwa_id: str, manhwa_data: Dict[str, Any]) -> Dict[str, Any]:
        update_query = """
        UPDATE manhwa 
        SET title = :title, author = :author, genre = :genre, status = :status, 
            description = :description, cover_image = :cover_image, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        """
        
        genre_json = json.dumps(manhwa_data.get('genre', []))
        
        params = (
            manhwa_data.get('title'),
            manhwa_data.get('author'),
            genre_json,
            manhwa_data.get('status'),
            manhwa_data.get('description'),
            manhwa_data.get('cover_image'),
            manhwa_id
        )
        
        await self.execute_non_query(update_query, params)
        
        return await self.get_manhwa_by_id(manhwa_id)
    
    async def delete_manhwa(self, manhwa_id: str) -> bool:
        delete_query = "DELETE FROM manhwa WHERE id = :manhwa_id"
        
        try:
            await self.execute_non_query(delete_query, (manhwa_id,))
            return True
        except Exception as e:
            print(f"Error deleting manhwa: {e}")
            return False
    
    async def increment_view_count(self, manhwa_id: str) -> None:
        update_query = "UPDATE manhwa SET view_count = view_count + 1 WHERE id = :manhwa_id"
        await self.execute_non_query(update_query, (manhwa_id,))
    
    async def update_manhwa_embedding(self, manhwa_id: str, embedding: List[float]) -> None:
        """Update the embedding vector for a manhwa"""
        update_query = "UPDATE manhwa SET embedding = :embedding WHERE id = :manhwa_id"
        
        # Convert list to Oracle vector format
        vector_str = f"[{','.join(map(str, embedding))}]"
        
        try:
            await self.execute_non_query(update_query, (vector_str, manhwa_id))
        except Exception as e:
            print(f"Failed to update embedding for {manhwa_id}: {e}")
    
    async def search_similar_manhwa(self, query_embedding: List[float], limit: int = 10, exclude_id: str = None) -> List[Dict[str, Any]]:
        """Find similar manhwa using vector similarity search"""
        vector_str = f"[{','.join(map(str, query_embedding))}]"
        
        base_query = """
        SELECT id, title, author, genre, status, description, cover_image, rating, view_count,
               VECTOR_DISTANCE(embedding, :query_vector) as similarity_score
        FROM manhwa 
        WHERE embedding IS NOT NULL
        """
        
        if exclude_id:
            query = base_query + " AND id != :exclude_id ORDER BY embedding <-> :query_vector FETCH FIRST :limit ROWS ONLY"
            params = (vector_str, exclude_id, vector_str, limit)
        else:
            query = base_query + " ORDER BY embedding <-> :query_vector FETCH FIRST :limit ROWS ONLY"
            params = (vector_str, vector_str, limit)
        
        try:
            results = await self.execute_query(query, params)
            
            # Parse JSON genre field
            for result in results:
                if result.get('genre'):
                    try:
                        result['genre'] = json.loads(result['genre'])
                    except json.JSONDecodeError:
                        result['genre'] = []
                else:
                    result['genre'] = []
            
            return results
        except Exception as e:
            print(f"Vector search failed: {e}")
            return []
    
    async def search_manhwa_hybrid(self, query_embedding: List[float], genre_filter: str = None, status_filter: str = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Hybrid search combining vector similarity with SQL filters"""
        vector_str = f"[{','.join(map(str, query_embedding))}]"
        
        query = """
        SELECT id, title, author, genre, status, description, cover_image, rating, view_count,
               VECTOR_DISTANCE(embedding, :query_vector) as similarity_score
        FROM manhwa 
        WHERE embedding IS NOT NULL
        """
        
        params = [vector_str]
        
        if genre_filter:
            query += " AND JSON_EXISTS(genre, '$[*]?(@ == $genre)')"
            params.append(genre_filter)
        
        if status_filter:
            query += " AND status = :status"
            params.append(status_filter)
        
        query += " ORDER BY embedding <-> :query_vector FETCH FIRST :limit ROWS ONLY"
        params.append(vector_str)
        params.append(limit)
        
        try:
            results = await self.execute_query(query, tuple(params))
            
            # Parse JSON genre field
            for result in results:
                if result.get('genre'):
                    try:
                        result['genre'] = json.loads(result['genre'])
                    except json.JSONDecodeError:
                        result['genre'] = []
                else:
                    result['genre'] = []
            
            return results
        except Exception as e:
            print(f"Hybrid search failed: {e}")
            return []