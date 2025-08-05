from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from rest.manhwa import router as manhwa_router
from rest.search import router as search_router
from rest.llm import router as llm_router

app = FastAPI(
    title="Paimon's Codex API",
    description="Manhwa platform API with AI-powered features",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(manhwa_router, prefix="/api/v1/manhwa", tags=["manhwa"])
app.include_router(search_router, prefix="/api/v1/search", tags=["search"])
app.include_router(llm_router, prefix="/api/v1/llm", tags=["llm"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}