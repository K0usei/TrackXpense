from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import finance_gpt
from app.core.config import settings
import os

app = FastAPI(
    title="TrackXpense API",
    description="Backend API for TrackXpense application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.1.5:3000",
        "https://192.168.1.5:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for favicon and other static assets
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include routers
app.include_router(finance_gpt.router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint returning API information"""
    return {
        "app": "TrackXpense Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.exception_handler(404)
async def custom_404_handler(request, exc):
    """Custom 404 error handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource does not exist",
            "path": request.url.path
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

