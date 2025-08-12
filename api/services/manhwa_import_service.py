import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from minio import Minio
from minio.error import S3Error
import os
import hashlib

logger = logging.getLogger(__name__)

class ManhwaImportService:
    """Service to import generated manhwa from MinIO bucket into the manhwa database"""
    
    def __init__(self, manhwa_service, minio_client: Optional[Minio] = None):
        self.manhwa_service = manhwa_service
        self.minio_client = minio_client
        
        # MinIO configuration
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "codex")
        self.generated_prefix = "generated/"  # Folder for generated manhwa
        self.imported_prefix = "imported/"    # Move successful imports here
        
        # Track imported files to avoid duplicates
        self._imported_files = set()
        
        logger.info(f"ManhwaImportService initialized with bucket: {self.bucket_name}")
    
    async def scan_and_import(self) -> Dict[str, Any]:
        """Scan the generated bucket for new manhwa and import them"""
        if not self.minio_client:
            logger.warning("MinIO client not available - skipping import")
            return {"status": "skipped", "reason": "MinIO not available"}
        
        try:
            results = {
                "scanned": 0,
                "imported": 0,
                "failed": 0,
                "errors": [],
                "imported_titles": []
            }
            
            logger.info("Starting manhwa import scan...")
            
            # List all objects in the generated folder
            objects = self.minio_client.list_objects(
                self.bucket_name, 
                prefix=self.generated_prefix,
                recursive=True
            )
            
            for obj in objects:
                if obj.object_name.endswith('.json'):
                    results["scanned"] += 1
                    
                    # Skip if already imported
                    if obj.object_name in self._imported_files:
                        logger.debug(f"Skipping already imported: {obj.object_name}")
                        continue
                    
                    try:
                        logger.info(f"Processing file: {obj.object_name}")
                        
                        # Download and parse JSON
                        manhwa_data = await self._download_and_parse_json(obj.object_name)
                        if manhwa_data:
                            logger.info(f"Successfully parsed JSON from {obj.object_name}")
                            # Import into manhwa database
                            imported_manhwa = await self._import_manhwa(manhwa_data, obj.object_name)
                            if imported_manhwa:
                                results["imported"] += 1
                                results["imported_titles"].append(imported_manhwa.get("title", "Unknown"))
                                
                                # Move to imported folder
                                await self._move_to_imported(obj.object_name)
                                self._imported_files.add(obj.object_name)
                                
                                logger.info(f"Successfully imported: {imported_manhwa.get('title', 'Unknown')}")
                            elif imported_manhwa is None:
                                # File was skipped (e.g., metadata file) - not an error
                                logger.debug(f"Skipped file: {obj.object_name}")
                                # Move skipped files to imported folder to avoid reprocessing
                                await self._move_to_imported(obj.object_name)
                                self._imported_files.add(obj.object_name)
                            else:
                                # imported_manhwa is False - actual import failure
                                logger.error(f"Failed to import manhwa from {obj.object_name}")
                                results["failed"] += 1
                                results["errors"].append(f"{obj.object_name}: Import failed")
                        else:
                            logger.error(f"Failed to parse JSON from {obj.object_name}")
                            results["failed"] += 1
                            results["errors"].append(f"{obj.object_name}: JSON parsing failed")
                            
                    except Exception as e:
                        logger.error(f"Failed to import {obj.object_name}: {e}")
                        results["failed"] += 1
                        results["errors"].append(f"{obj.object_name}: {str(e)}")
            
            logger.info(f"Import scan complete - Scanned: {results['scanned']}, Imported: {results['imported']}, Failed: {results['failed']}")
            results["status"] = "completed"
            return results
            
        except Exception as e:
            logger.error(f"Error during manhwa import scan: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _download_and_parse_json(self, object_name: str) -> Optional[Dict[str, Any]]:
        """Download and parse JSON file from MinIO"""
        try:
            response = self.minio_client.get_object(self.bucket_name, object_name)
            content = response.read()
            response.close()
            response.release_conn()
            
            # Parse JSON
            data = json.loads(content.decode('utf-8'))
            return data
            
        except Exception as e:
            logger.error(f"Failed to download/parse {object_name}: {e}")
            return None
    
    async def _import_manhwa(self, generated_data: Dict[str, Any], source_file: str) -> Optional[Dict[str, Any]]:
        """Import generated manhwa data into the manhwa database
        
        Returns:
            Dict: Imported manhwa data if successful
            None: If file should be skipped (not an error)
            False: If import failed (actual error)
        """
        try:
            logger.info(f"Importing manhwa from {source_file}")
            logger.info(f"Generated data keys: {list(generated_data.keys())}")
            
            # Determine the type of file and extract story information accordingly
            story_data = None
            file_type = None
            
            # Handle different file structures
            if "complete_data" in generated_data:
                # Complete manhwa file
                file_type = "complete"
                story_data = generated_data
                logger.info("Processing complete manhwa file")
                
            elif "story" in generated_data:
                # Traditional format with story wrapper
                file_type = "traditional"
                story_data = generated_data.get("story", {})
                logger.info("Processing traditional story format")
                
            elif "title" in generated_data and "synopsis" in generated_data:
                # Story file format  
                file_type = "story"
                story_data = generated_data
                logger.info("Processing story file format")
                
            elif "type" in generated_data:
                # Metadata file - skip these for now
                logger.info(f"Skipping metadata file: {source_file}")
                return None
                
            else:
                logger.warning(f"Unknown file format in {source_file}. Available keys: {list(generated_data.keys())}")
                return False
            
            if not story_data:
                logger.warning(f"No story data extracted from {source_file}")
                return False
            
            logger.info(f"Story data keys: {list(story_data.keys())}")
            
            # Extract title from various possible locations
            title = (story_data.get("title") or 
                    generated_data.get("title") or 
                    f"Generated Manhwa {datetime.now().strftime('%Y%m%d_%H%M%S')}")
            
            # Check if manhwa already exists by title to avoid duplicates
            existing = await self._check_existing_manhwa(title)
            if existing:
                logger.info(f"Manhwa '{title}' already exists - skipping")
                return existing
            
            # Extract genre information
            genre_data = (story_data.get("genre") or 
                         generated_data.get("genre") or 
                         "fantasy")
            
            # Extract description/synopsis
            description = (story_data.get("synopsis") or 
                          story_data.get("description") or
                          story_data.get("full_content", "")[:500] or  # First 500 chars if full content
                          "An AI-generated manhwa story")
            
            # Prepare manhwa data for creation
            manhwa_data = {
                "title": title,
                "author": story_data.get("author", "AI Generated"),
                "genre": self._parse_genre(genre_data),
                "status": "completed",  # Generated manhwa are complete
                "description": description,
                "cover_image": await self._store_cover_image(generated_data, source_file),
                "generated": True,  # Mark as AI generated
                "source_file": source_file,
                "file_type": file_type,
                "generated_at": datetime.now().isoformat()
            }
            
            logger.info(f"Prepared manhwa data: title='{title}', genre={manhwa_data['genre']}, file_type={file_type}")
            
            # Create manhwa in database
            created_manhwa = await self.manhwa_service.create(manhwa_data)
            
            # Store additional generated content (chapters, character art, etc.)
            await self._store_additional_content(created_manhwa, generated_data)
            
            return created_manhwa
            
        except Exception as e:
            logger.error(f"Failed to import manhwa from {source_file}: {e}")
            return False
    
    async def _check_existing_manhwa(self, title: str) -> Optional[Dict[str, Any]]:
        """Check if a manhwa with the same title already exists"""
        if not title:
            return None
            
        try:
            # Get all manhwa and check for duplicates
            # This is inefficient but works for now - could be optimized with a title search endpoint
            all_manhwa = await self.manhwa_service.get_all(limit=1000)
            for manhwa in all_manhwa:
                if manhwa.get("title", "").lower() == title.lower():
                    return manhwa
            return None
            
        except Exception as e:
            logger.error(f"Error checking existing manhwa: {e}")
            return None
    
    def _parse_genre(self, genre_data: Any) -> List[str]:
        """Parse genre data into a list of genre strings"""
        if isinstance(genre_data, str):
            return [g.strip().lower() for g in genre_data.split(',')]
        elif isinstance(genre_data, list):
            return [str(g).strip().lower() for g in genre_data]
        else:
            return ["fantasy"]  # Default genre
    
    async def _store_cover_image(self, generated_data: Dict[str, Any], source_file: str) -> Optional[str]:
        """Store cover image in MinIO and return URL"""
        try:
            cover_art = generated_data.get("cover_art", {})
            if not cover_art or "image_base64" not in cover_art:
                return None
            
            # Generate unique filename for cover
            file_hash = hashlib.md5(source_file.encode()).hexdigest()[:8]
            cover_filename = f"covers/generated_{file_hash}_cover.png"
            
            # Convert base64 to bytes
            import base64
            image_bytes = base64.b64decode(cover_art["image_base64"])
            
            # Upload to MinIO
            from io import BytesIO
            self.minio_client.put_object(
                self.bucket_name,
                cover_filename,
                BytesIO(image_bytes),
                len(image_bytes),
                content_type="image/png"
            )
            
            # Return MinIO URL
            minio_endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
            return f"http://{minio_endpoint}/{self.bucket_name}/{cover_filename}"
            
        except Exception as e:
            logger.error(f"Failed to store cover image: {e}")
            return None
    
    async def _store_additional_content(self, manhwa: Dict[str, Any], generated_data: Dict[str, Any]):
        """Store additional generated content like character art"""
        try:
            manhwa_id = manhwa.get("id")
            if not manhwa_id:
                return
            
            # Store character art if available
            character_art = generated_data.get("character_art", {})
            if character_art and "image_base64" in character_art:
                await self._store_character_art(manhwa_id, character_art)
            
            # Store any chapter images or additional artwork
            # This could be extended to handle full chapter content
            
        except Exception as e:
            logger.error(f"Failed to store additional content: {e}")
    
    async def _store_character_art(self, manhwa_id: str, character_art: Dict[str, Any]):
        """Store character art in MinIO"""
        try:
            # Generate filename for character art
            char_filename = f"characters/{manhwa_id}_character.png"
            
            # Convert base64 to bytes
            import base64
            from io import BytesIO
            image_bytes = base64.b64decode(character_art["image_base64"])
            
            # Upload to MinIO
            self.minio_client.put_object(
                self.bucket_name,
                char_filename,
                BytesIO(image_bytes),
                len(image_bytes),
                content_type="image/png"
            )
            
            logger.info(f"Stored character art for manhwa {manhwa_id}")
            
        except Exception as e:
            logger.error(f"Failed to store character art: {e}")
    
    async def _move_to_imported(self, object_name: str):
        """Move successfully imported file to imported folder"""
        try:
            # Copy to imported folder
            imported_name = object_name.replace(self.generated_prefix, self.imported_prefix)
            
            # Use the correct CopySource format for minio-py
            from minio.commonconfig import CopySource
            
            copy_source = CopySource(self.bucket_name, object_name)
            
            self.minio_client.copy_object(
                self.bucket_name,
                imported_name,
                copy_source
            )
            
            # Delete from generated folder
            self.minio_client.remove_object(self.bucket_name, object_name)
            
            logger.info(f"Moved {object_name} to {imported_name}")
            
        except Exception as e:
            logger.error(f"Failed to move {object_name}: {e}")
            # Don't fail the entire import if moving fails
            logger.warning("Continuing despite move failure - file will remain in generated folder")
    
    async def get_import_status(self) -> Dict[str, Any]:
        """Get current import status and statistics"""
        try:
            generated_count = len(list(self.minio_client.list_objects(
                self.bucket_name, 
                prefix=self.generated_prefix,
                recursive=True
            )))
            
            imported_count = len(list(self.minio_client.list_objects(
                self.bucket_name,
                prefix=self.imported_prefix, 
                recursive=True
            )))
            
            return {
                "generated_files": generated_count,
                "imported_files": imported_count,
                "last_scan": datetime.now().isoformat(),
                "imported_cache_size": len(self._imported_files)
            }
            
        except Exception as e:
            logger.error(f"Failed to get import status: {e}")
            return {"error": str(e)}