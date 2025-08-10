#!/usr/bin/env python3
"""
Script to upload images from assets directory to MinIO bucket
"""
import os
import sys
from pathlib import Path
import mimetypes

# Add the project root to the path so we can import our modules
sys.path.append(str(Path(__file__).parent.parent))

from dal.minio_client import MinIOClient

def get_content_type(file_path):
    """Get the MIME type for a file"""
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or 'application/octet-stream'

def upload_assets_to_minio(assets_dir="assets", bucket_name=None, manhwa_name=None):
    """
    Upload all images from assets directory to MinIO
    
    Args:
        assets_dir: Directory containing assets (default: "assets")
        bucket_name: Target bucket name (if None, uses default from MinIOClient)
        manhwa_name: Specific manhwa to upload (e.g., "no-more-princes"). If None, uploads all.
    """
    # Get the absolute path to assets directory
    project_root = Path(__file__).parent.parent
    assets_path = project_root / assets_dir
    
    if not assets_path.exists():
        print(f"Assets directory not found: {assets_path}")
        return False
    
    # Initialize MinIO client
    minio_client = MinIOClient()
    
    # Override bucket name if specified
    if bucket_name:
        minio_client.bucket_name = bucket_name
        # Ensure the bucket exists with the new name
        try:
            minio_client._ensure_bucket_exists()
        except Exception as e:
            print(f"Error creating/accessing bucket '{bucket_name}': {e}")
            return False
    
    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'}
    
    uploaded_count = 0
    failed_count = 0
    
    # Determine what to upload
    if manhwa_name:
        manhwa_path = assets_path / manhwa_name
        if not manhwa_path.exists():
            print(f"Manhwa directory not found: {manhwa_path}")
            return False
        upload_paths = [manhwa_path]
        print(f"Uploading manhwa '{manhwa_name}' from {manhwa_path} to bucket '{minio_client.bucket_name}'...")
    else:
        upload_paths = [assets_path]
        print(f"Uploading all images from {assets_path} to bucket '{minio_client.bucket_name}'...")
    
    # Walk through specified paths
    for base_path in upload_paths:
        for file_path in base_path.rglob('*'):
            if file_path.is_file():
                file_extension = file_path.suffix.lower()
                
                # Check if it's an image file
                if file_extension in image_extensions:
                    # Create object name preserving directory structure
                    # Remove the assets directory from the path
                    relative_path = file_path.relative_to(assets_path)
                    object_name = str(relative_path).replace('\\', '/')  # Ensure forward slashes
                    
                    print(f"Uploading: {file_path} -> {object_name}")
                    
                    # Upload the file
                    url = minio_client.upload_file(str(file_path), object_name)
                    
                    if url:
                        print(f"✓ Success: {url}")
                        uploaded_count += 1
                    else:
                        print(f"✗ Failed to upload: {file_path}")
                        failed_count += 1
                else:
                    print(f"Skipping non-image file: {file_path}")
    
    print(f"\nUpload complete!")
    print(f"Successfully uploaded: {uploaded_count} files")
    print(f"Failed uploads: {failed_count} files")
    
    return failed_count == 0

def main():
    """Main function to handle command line arguments"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Upload images from assets directory to MinIO')
    parser.add_argument('--assets-dir', default='assets', 
                       help='Assets directory path (default: assets)')
    parser.add_argument('--bucket', default=None,
                       help='MinIO bucket name (default: uses MinIOClient default)')
    parser.add_argument('--manhwa', default=None,
                       help='Specific manhwa to upload (e.g., "no-more-princes"). If not specified, uploads all.')
    parser.add_argument('--list-only', action='store_true',
                       help='Only list files that would be uploaded, don\'t actually upload')
    
    args = parser.parse_args()
    
    if args.list_only:
        # List mode - show what would be uploaded
        project_root = Path(__file__).parent.parent
        assets_path = project_root / args.assets_dir
        
        if not assets_path.exists():
            print(f"Assets directory not found: {assets_path}")
            return
        
        # Determine what to list
        if args.manhwa:
            manhwa_path = assets_path / args.manhwa
            if not manhwa_path.exists():
                print(f"Manhwa directory not found: {manhwa_path}")
                return
            search_paths = [manhwa_path]
            print(f"Images that would be uploaded for manhwa '{args.manhwa}':")
        else:
            search_paths = [assets_path]
            print(f"Images that would be uploaded from {assets_path}:")
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'}
        
        for base_path in search_paths:
            for file_path in base_path.rglob('*'):
                if file_path.is_file() and file_path.suffix.lower() in image_extensions:
                    relative_path = file_path.relative_to(assets_path)
                    object_name = str(relative_path).replace('\\', '/')
                    print(f"  {file_path} -> {object_name}")
    else:
        # Upload mode
        success = upload_assets_to_minio(args.assets_dir, args.bucket, args.manhwa)
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()