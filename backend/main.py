import uvicorn
import os
import fastapi
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import ocr, receipts, finance_gpt

app = FastAPI(
    title="TrackXpense API",
    description="Backend API for TrackXpense application",
    version="1.0.0"
)

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "message": "API is running"}

# Add redirects for the old endpoint paths
@app.post("/api/process-receipt")
async def redirect_process_receipt(image: fastapi.UploadFile = fastapi.File(...)):
    # Forward the request to the correct endpoint
    return await ocr.process_receipt(image)

@app.post("/api/predict-category")
async def redirect_predict_category(data: dict = fastapi.Body(...)):
    # Forward the request to the correct endpoint
    return await ocr.predict_category(data)

# Add CORS middleware
# For development, we'll allow all origins
# In production, this should be restricted to specific domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(ocr.router, prefix="/api/ocr", tags=["ocr"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["receipts"])
app.include_router(finance_gpt.router, prefix="/api/v1", tags=["finance-gpt"])

# Mount static files directory for uploads
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

if __name__ == "__main__":
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    # Check if SSL certificates exist
    ssl_certfile = "../certificates/localhost.pem"
    ssl_keyfile = "../certificates/localhost-key.pem"
    use_ssl = os.path.exists(ssl_certfile) and os.path.exists(ssl_keyfile)

    # Run with or without SSL based on certificate availability
    if use_ssl:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",  # Listen on all interfaces
            port=8000,
            ssl_certfile=ssl_certfile,
            ssl_keyfile=ssl_keyfile,
            reload=True,
        )
    else:
        # Run without SSL
        uvicorn.run(
            "main:app",
            host="0.0.0.0",  # Listen on all interfaces
            port=8000,
            reload=True,
        )


