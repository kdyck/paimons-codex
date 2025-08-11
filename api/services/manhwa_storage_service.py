import os
import json
import uuid
import base64
from io import BytesIO
from typing import Dict, Any, List, Optional
from minio import Minio
from minio.error import S3Error
import logging

logger = logging.getLogger(__name__)

class ManhwaStorageService:
    def __init__(self):
        self.minio_endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "paimons")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "paimons123")
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "codex")
        
        self.client = Minio(
            self.minio_endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=False
        )
        
        # Manhwa-specific folders
        self.folders = {
            "stories": "generated/stories/",
            "characters": "generated/characters/",
            "scenes": "generated/scenes/",
            "covers": "generated/covers/",
            "metadata": "generated/metadata/"
        }
        
        logger.info(f"ManhwaStorageService initialized for bucket: {self.bucket_name}")
    
    def ensure_bucket_exists(self):
        """Ensure the bucket exists"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
    
    async def store_generated_image(self, image_base64: str, image_type: str, 
                                  metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Store generated image in MinIO"""
        try:
            self.ensure_bucket_exists()
            
            # Generate unique filename
            image_id = str(uuid.uuid4())
            folder = self.folders.get(image_type, "generated/misc/")
            filename = f"{folder}{image_id}.png"
            
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            image_stream = BytesIO(image_data)
            
            # Upload image
            self.client.put_object(
                self.bucket_name,
                filename,
                image_stream,
                length=len(image_data),
                content_type="image/png"
            )
            
            # Store metadata
            metadata_filename = f"{self.folders['metadata']}{image_id}_metadata.json"
            metadata_json = json.dumps(metadata, indent=2).encode('utf-8')
            metadata_stream = BytesIO(metadata_json)
            
            self.client.put_object(
                self.bucket_name,
                metadata_filename,
                metadata_stream,
                length=len(metadata_json),
                content_type="application/json"
            )
            
            # Generate public URL
            image_url = f"http://{self.minio_endpoint}/{self.bucket_name}/{filename}"
            
            logger.info(f"Stored image: {filename}")
            
            return {
                "image_id": image_id,
                "filename": filename,
                "url": image_url,
                "metadata_file": metadata_filename,
                "type": image_type,
                "stored": True
            }
            
        except Exception as e:
            logger.error(f"Error storing image: {e}")
            raise e
    
    async def store_manhwa_story(self, story_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store generated manhwa story"""
        try:
            self.ensure_bucket_exists()
            
            story_id = story_data.get("id", str(uuid.uuid4()))
            filename = f"{self.folders['stories']}{story_id}_story.json"
            
            # Store story data
            story_json = json.dumps(story_data, indent=2).encode('utf-8')
            story_stream = BytesIO(story_json)
            
            self.client.put_object(
                self.bucket_name,
                filename,
                story_stream,
                length=len(story_json),
                content_type="application/json"
            )
            
            logger.info(f"Stored story: {filename}")
            
            return {
                "story_id": story_id,
                "filename": filename,
                "url": f"http://{self.minio_endpoint}/{self.bucket_name}/{filename}",
                "stored": True
            }
            
        except Exception as e:
            logger.error(f"Error storing story: {e}")
            raise e
    
    async def store_complete_manhwa(self, manhwa_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store complete manhwa with all assets"""
        try:
            manhwa_id = str(uuid.uuid4())
            stored_assets = {"manhwa_id": manhwa_id, "assets": []}
            
            # Store cover art
            if "cover_art" in manhwa_data:
                cover_result = await self.store_generated_image(
                    manhwa_data["cover_art"]["image_base64"],
                    "covers",
                    {
                        "manhwa_id": manhwa_id,
                        "type": "cover",
                        "title": manhwa_data.get("story", {}).get("title", ""),
                        "prompt": manhwa_data["cover_art"]["prompt"]
                    }
                )
                stored_assets["assets"].append(cover_result)
            
            # Store character art
            if "character_art" in manhwa_data:
                char_result = await self.store_generated_image(
                    manhwa_data["character_art"]["image_base64"],
                    "characters",
                    {
                        "manhwa_id": manhwa_id,
                        "type": "character",
                        "character_name": manhwa_data.get("story", {}).get("main_character", ""),
                        "prompt": manhwa_data["character_art"]["prompt"]
                    }
                )
                stored_assets["assets"].append(char_result)
            
            # Store story data
            if "story" in manhwa_data:
                story_data = manhwa_data["story"].copy()
                story_data["manhwa_id"] = manhwa_id
                story_result = await self.store_manhwa_story(story_data)
                stored_assets["assets"].append(story_result)
            
            # Store complete manhwa metadata
            manhwa_metadata = {
                "manhwa_id": manhwa_id,
                "created_at": str(uuid.uuid4()),  # Timestamp placeholder
                "title": manhwa_data.get("story", {}).get("title", ""),
                "genre": manhwa_data.get("story", {}).get("genre", ""),
                "assets": [asset["filename"] for asset in stored_assets["assets"]],
                "complete_data": manhwa_data
            }
            
            metadata_filename = f"{self.folders['metadata']}{manhwa_id}_complete.json"
            metadata_json = json.dumps(manhwa_metadata, indent=2).encode('utf-8')
            metadata_stream = BytesIO(metadata_json)
            
            self.client.put_object(
                self.bucket_name,
                metadata_filename,
                metadata_stream,
                length=len(metadata_json),
                content_type="application/json"
            )
            
            stored_assets["metadata_file"] = metadata_filename
            logger.info(f"Stored complete manhwa: {manhwa_id}")
            
            return stored_assets
            
        except Exception as e:
            logger.error(f"Error storing complete manhwa: {e}")
            raise e
    
    async def get_manhwa_list(self) -> List[Dict[str, Any]]:
        """Get list of stored manhwa"""
        try:
            manhwa_list = []
            
            # List metadata files
            objects = self.client.list_objects(
                self.bucket_name, 
                prefix=f"{self.folders['metadata']}",
                recursive=True
            )
            
            for obj in objects:
                if obj.object_name.endswith("_complete.json"):
                    try:
                        # Get metadata
                        response = self.client.get_object(self.bucket_name, obj.object_name)
                        metadata = json.loads(response.read().decode('utf-8'))
                        
                        manhwa_list.append({
                            "manhwa_id": metadata.get("manhwa_id"),
                            "title": metadata.get("title"),
                            "genre": metadata.get("genre"),
                            "created_at": metadata.get("created_at"),
                            "metadata_file": obj.object_name
                        })
                    except Exception as e:
                        logger.warning(f"Error reading metadata {obj.object_name}: {e}")
                        continue
            
            return manhwa_list
            
        except Exception as e:
            logger.error(f"Error getting manhwa list: {e}")
            return []
    
    async def get_manhwa_details(self, manhwa_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed manhwa data"""
        try:
            metadata_filename = f"{self.folders['metadata']}{manhwa_id}_complete.json"
            
            response = self.client.get_object(self.bucket_name, metadata_filename)
            metadata = json.loads(response.read().decode('utf-8'))
            
            # Add URLs for assets
            for asset_filename in metadata.get("assets", []):
                metadata[f"{asset_filename}_url"] = f"http://{self.minio_endpoint}/{self.bucket_name}/{asset_filename}"
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error getting manhwa details for {manhwa_id}: {e}")
            return None
    
    async def delete_manhwa(self, manhwa_id: str) -> bool:
        """Delete manhwa and all its assets"""
        try:
            # Get metadata first
            metadata = await self.get_manhwa_details(manhwa_id)
            if not metadata:
                return False
            
            # Delete all assets
            for asset_filename in metadata.get("assets", []):
                try:
                    self.client.remove_object(self.bucket_name, asset_filename)
                except Exception as e:
                    logger.warning(f"Error deleting asset {asset_filename}: {e}")
            
            # Delete metadata
            metadata_filename = f"{self.folders['metadata']}{manhwa_id}_complete.json"
            self.client.remove_object(self.bucket_name, metadata_filename)
            
            logger.info(f"Deleted manhwa: {manhwa_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting manhwa {manhwa_id}: {e}")
            return False