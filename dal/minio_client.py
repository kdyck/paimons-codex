import os
from minio import Minio
from minio.error import S3Error
from typing import Optional
import io

class MinIOClient:
    def __init__(self):
        endpoint_url = os.getenv('MINIO_ENDPOINT', 'http://localhost:9000')
        # Remove http:// or https:// prefix for Minio client
        self.endpoint = endpoint_url.replace('http://', '').replace('https://', '')
        self.access_key = os.getenv('MINIO_ACCESS_KEY', 'paimons')
        self.secret_key = os.getenv('MINIO_SECRET_KEY', 'paimons123')
        self.bucket_name = os.getenv('MINIO_BUCKET_NAME', 'codex')
        
        # Initialize MinIO client
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=False  # Set to True for HTTPS
        )
        
        self._initialized = False
        # Try to create bucket, but don't fail if MinIO is not ready
        try:
            self._ensure_bucket_exists()
            self._initialized = True
        except Exception as e:
            print(f"MinIO not ready during initialization: {e}")
            print("MinIO operations will be retried when needed")
    
    def _ensure_bucket_exists(self):
        """Create the bucket if it doesn't exist"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Created bucket: {self.bucket_name}")
            else:
                print(f"Bucket {self.bucket_name} already exists")
        except S3Error as e:
            print(f"Error creating bucket: {e}")
            raise
        except Exception as e:
            print(f"MinIO connection error: {e}")
            raise
    
    def _ensure_initialized(self):
        """Ensure MinIO is initialized and ready"""
        if not self._initialized:
            try:
                self._ensure_bucket_exists()
                self._initialized = True
            except Exception as e:
                print(f"Failed to initialize MinIO: {e}")
                return False
        return True
    
    def upload_file(self, file_path: str, object_name: str) -> Optional[str]:
        """
        Upload a file to MinIO
        
        Args:
            file_path: Path to the local file
            object_name: Name for the object in MinIO (e.g., 'covers/manhwa-1.jpg')
        
        Returns:
            URL to access the uploaded file, or None if failed
        """
        if not self._ensure_initialized():
            return None
            
        try:
            # Upload file
            self.client.fput_object(
                self.bucket_name,
                object_name,
                file_path
            )
            
            # Return the URL to access the file
            endpoint_for_url = self.endpoint.replace('minio:', 'localhost:')
            url = f"http://{endpoint_for_url}/{self.bucket_name}/{object_name}"
            print(f"Successfully uploaded {file_path} as {object_name}")
            return url
            
        except S3Error as e:
            print(f"Error uploading file {file_path}: {e}")
            return None
    
    def upload_bytes(self, file_bytes: bytes, object_name: str, content_type: str = "application/octet-stream") -> Optional[str]:
        """
        Upload bytes data to MinIO
        
        Args:
            file_bytes: File content as bytes
            object_name: Name for the object in MinIO
            content_type: MIME type of the file
        
        Returns:
            URL to access the uploaded file, or None if failed
        """
        if not self._ensure_initialized():
            return None
            
        try:
            # Upload bytes
            self.client.put_object(
                self.bucket_name,
                object_name,
                io.BytesIO(file_bytes),
                len(file_bytes),
                content_type=content_type
            )
            
            # Return the URL to access the file
            endpoint_for_url = self.endpoint.replace('minio:', 'localhost:')
            url = f"http://{endpoint_for_url}/{self.bucket_name}/{object_name}"
            print(f"Successfully uploaded bytes as {object_name}")
            return url
            
        except S3Error as e:
            print(f"Error uploading bytes: {e}")
            return None
    
    def delete_file(self, object_name: str) -> bool:
        """
        Delete a file from MinIO
        
        Args:
            object_name: Name of the object to delete
        
        Returns:
            True if successful, False otherwise
        """
        if not self._ensure_initialized():
            return False
            
        try:
            self.client.remove_object(self.bucket_name, object_name)
            print(f"Successfully deleted {object_name}")
            return True
        except S3Error as e:
            print(f"Error deleting file {object_name}: {e}")
            return False
    
    def get_file_url(self, object_name: str) -> str:
        """
        Get the URL to access a file
        
        Args:
            object_name: Name of the object
        
        Returns:
            URL to access the file
        """
        endpoint_for_url = self.endpoint.replace('minio:', 'localhost:')
        return f"http://{endpoint_for_url}/{self.bucket_name}/{object_name}"
    
    def file_exists(self, object_name: str) -> bool:
        """
        Check if a file exists in MinIO
        
        Args:
            object_name: Name of the object to check
        
        Returns:
            True if file exists, False otherwise
        """
        if not self._ensure_initialized():
            return False
            
        try:
            self.client.stat_object(self.bucket_name, object_name)
            return True
        except S3Error:
            return False