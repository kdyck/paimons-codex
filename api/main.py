from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from rest.manhwa import router as manhwa_router
from rest.search import router as search_router
from rest.llm import router as llm_router
from rest.manhwa_import import router as import_router
import os
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    print("=== Starting Paimon's Codex API ===")
    logger.info("Starting Paimon's Codex API")
    
    # Initialize background scheduler
    try:
        print("=== Importing scheduler modules ===")
        from services.background_scheduler import initialize_scheduler
        from services.manhwa_import_service import ManhwaImportService
        
        print("=== Importing ManhwaService ===")
        from services.manhwa_service import ManhwaService
        
        print("=== Importing MinIO client ===")
        from dal.minio_client import get_minio_client
        
        print("=== Initializing ManhwaService ===")
        # Initialize import service for scheduler
        manhwa_service = ManhwaService()
        
        print("=== Getting MinIO client ===")
        minio_client = get_minio_client()
        
        print("=== Creating ManhwaImportService ===")
        import_service = ManhwaImportService(manhwa_service, minio_client)
        
        print("=== Initializing scheduler ===")
        # Start background scheduler
        await initialize_scheduler(import_service)
        print("=== Background scheduler started ===")
        logger.info("Background scheduler started")
        
    except Exception as e:
        print(f"=== ERROR: Failed to initialize background scheduler: {e} ===")
        import traceback
        traceback.print_exc()
        logger.warning(f"Failed to initialize background scheduler: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Paimon's Codex API")
    
    try:
        from services.background_scheduler import shutdown_scheduler
        await shutdown_scheduler()
        logger.info("Background scheduler stopped")
    except Exception as e:
        logger.warning(f"Error shutting down scheduler: {e}")

app = FastAPI(
    title="Paimon's Codex API", 
    description="Manhwa platform API with AI-powered features",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for assets (images, etc.)
assets_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

app.include_router(manhwa_router, prefix="/api/v1/manhwa", tags=["manhwa"])
app.include_router(search_router, prefix="/api/v1/search", tags=["search"])
app.include_router(llm_router, prefix="/api/v1/llm", tags=["llm"])
app.include_router(import_router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}