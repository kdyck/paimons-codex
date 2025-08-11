from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from rest.manhwa import router as manhwa_router
from rest.search import router as search_router
from rest.llm import router as llm_router
from rest.images import router as images_router
import os

app = FastAPI(
    title="Paimon's Codex API",
    description="Manhwa platform API with AI-powered features",
    version="1.0.0"
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
app.include_router(images_router, prefix="/api/v1/images", tags=["images"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}