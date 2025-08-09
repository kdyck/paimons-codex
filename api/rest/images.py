from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dal.minio_client import MinIOClient
import uuid
import os
from typing import List

router = APIRouter()

# Initialize MinIO client
minio_client = MinIOClient()

# Allowed image types
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def is_allowed_file(filename: str) -> bool:
    """Check if the file extension is allowed"""
    return os.path.splitext(filename.lower())[1] in ALLOWED_EXTENSIONS

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file to MinIO storage
    
    Returns:
        JSON with the image URL and metadata
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    try:
        file_content = await file.read()
        
        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        object_name = f"uploads/{unique_filename}"
        
        # Upload to MinIO
        file_url = minio_client.upload_bytes(
            file_content, 
            object_name, 
            content_type=file.content_type or "image/jpeg"
        )
        
        if not file_url:
            raise HTTPException(status_code=500, detail="Failed to upload image")
        
        return JSONResponse(content={
            "success": True,
            "message": "Image uploaded successfully",
            "data": {
                "url": file_url,
                "filename": unique_filename,
                "original_filename": file.filename,
                "size": len(file_content),
                "content_type": file.content_type
            }
        })
        
    except Exception as e:
        print(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/upload-multiple")
async def upload_multiple_images(files: List[UploadFile] = File(...)):
    """
    Upload multiple image files to MinIO storage
    
    Returns:
        JSON with the list of uploaded images and their URLs
    """
    if len(files) > 10:  # Limit to 10 files at once
        raise HTTPException(status_code=400, detail="Too many files. Maximum 10 files allowed")
    
    uploaded_files = []
    errors = []
    
    for file in files:
        try:
            # Validate file
            if not file.filename:
                errors.append(f"Unnamed file skipped")
                continue
                
            if not is_allowed_file(file.filename):
                errors.append(f"{file.filename}: File type not allowed")
                continue
            
            # Read file content
            file_content = await file.read()
            
            # Check file size
            if len(file_content) > MAX_FILE_SIZE:
                errors.append(f"{file.filename}: File too large")
                continue
            
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            object_name = f"uploads/{unique_filename}"
            
            # Upload to MinIO
            file_url = minio_client.upload_bytes(
                file_content, 
                object_name, 
                content_type=file.content_type or "image/jpeg"
            )
            
            if file_url:
                uploaded_files.append({
                    "url": file_url,
                    "filename": unique_filename,
                    "original_filename": file.filename,
                    "size": len(file_content),
                    "content_type": file.content_type
                })
            else:
                errors.append(f"{file.filename}: Upload failed")
                
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
    
    return JSONResponse(content={
        "success": len(uploaded_files) > 0,
        "message": f"Uploaded {len(uploaded_files)} files successfully",
        "data": {
            "uploaded": uploaded_files,
            "errors": errors,
            "total_uploaded": len(uploaded_files),
            "total_errors": len(errors)
        }
    })

@router.delete("/{filename}")
async def delete_image(filename: str):
    """
    Delete an image from MinIO storage
    
    Args:
        filename: The filename to delete (from uploads/ folder)
    
    Returns:
        JSON response confirming deletion
    """
    object_name = f"uploads/{filename}"
    
    # Check if file exists
    if not minio_client.file_exists(object_name):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete file
    success = minio_client.delete_file(object_name)
    
    if success:
        return JSONResponse(content={
            "success": True,
            "message": f"Image {filename} deleted successfully"
        })
    else:
        raise HTTPException(status_code=500, detail="Failed to delete image")