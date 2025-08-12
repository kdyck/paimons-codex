from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import logging
import os
from services.manhwa_import_service import ManhwaImportService
from services.manhwa_service import ManhwaService
from services.background_scheduler import get_scheduler
from dal.minio_client import get_minio_client

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
manhwa_service = ManhwaService()
minio_client = get_minio_client()
import_service = ManhwaImportService(manhwa_service, minio_client)

@router.post("/import/scan", response_model=Dict[str, Any])
async def manual_import_scan():
    """Manually trigger a scan and import of generated manhwa"""
    try:
        logger.info("Manual manhwa import triggered")
        results = await import_service.scan_and_import()
        
        return {
            "status": "success",
            "message": f"Import completed - {results['imported']} manhwa imported",
            "details": results
        }
        
    except Exception as e:
        logger.error(f"Manual import failed: {e}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@router.post("/import/background")
async def background_import_scan(background_tasks: BackgroundTasks):
    """Trigger a background scan and import of generated manhwa"""
    try:
        background_tasks.add_task(import_service.scan_and_import)
        
        return {
            "status": "success", 
            "message": "Background import started"
        }
        
    except Exception as e:
        logger.error(f"Background import failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start background import: {str(e)}")

@router.get("/import/status", response_model=Dict[str, Any])
async def get_import_status():
    """Get current import status and statistics"""
    try:
        status = await import_service.get_import_status()
        
        return {
            "status": "success",
            "data": status
        }
        
    except Exception as e:
        logger.error(f"Failed to get import status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.get("/import/files", response_model=Dict[str, Any])
async def list_import_files():
    """List files in both generated and imported folders for debugging"""
    try:
        if not minio_client:
            raise HTTPException(status_code=503, detail="MinIO not available")
        
        bucket_name = os.getenv("MINIO_BUCKET_NAME", "codex")
        
        # List generated files
        generated_files = []
        try:
            objects = minio_client.list_objects(bucket_name, prefix="generated/", recursive=True)
            generated_files = [obj.object_name for obj in objects if obj.object_name.endswith('.json')]
        except Exception as e:
            logger.error(f"Error listing generated files: {e}")
        
        # List imported files  
        imported_files = []
        try:
            objects = minio_client.list_objects(bucket_name, prefix="imported/", recursive=True)
            imported_files = [obj.object_name for obj in objects if obj.object_name.endswith('.json')]
        except Exception as e:
            logger.error(f"Error listing imported files: {e}")
        
        return {
            "status": "success",
            "data": {
                "generated_files": generated_files,
                "imported_files": imported_files,
                "total_generated": len(generated_files),
                "total_imported": len(imported_files)
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to list import files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@router.get("/scheduler/status", response_model=Dict[str, Any])
async def get_scheduler_status():
    """Get background scheduler status"""
    try:
        scheduler = get_scheduler()
        if scheduler:
            return {
                "status": "success",
                "data": scheduler.get_status()
            }
        else:
            return {
                "status": "success",
                "data": {"running": False, "message": "Scheduler not initialized"}
            }
    except Exception as e:
        logger.error(f"Failed to get scheduler status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get scheduler status: {str(e)}")

@router.post("/scheduler/trigger", response_model=Dict[str, Any])  
async def trigger_scheduled_import():
    """Manually trigger the scheduled import task"""
    try:
        scheduler = get_scheduler()
        if not scheduler:
            raise HTTPException(status_code=503, detail="Scheduler not available")
        
        results = await scheduler.trigger_import_now()
        return {
            "status": "success",
            "message": "Scheduled import triggered",
            "details": results
        }
    except Exception as e:
        logger.error(f"Failed to trigger scheduled import: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger import: {str(e)}")

@router.get("/import/health")
async def import_health_check():
    """Health check for the import service"""
    try:
        scheduler = get_scheduler()
        
        # Basic health checks
        checks = {
            "minio_available": minio_client is not None,
            "manhwa_service_available": manhwa_service is not None,
            "import_service_available": import_service is not None,
            "scheduler_available": scheduler is not None,
            "scheduler_running": scheduler.running if scheduler else False
        }
        
        all_healthy = all(checks.values())
        
        return {
            "status": "healthy" if all_healthy else "degraded",
            "checks": checks
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }