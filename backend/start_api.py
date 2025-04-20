import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print(f"Starting TrackXpense API on {settings.API_URL}")
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        ssl_certfile=settings.SSL_CERTFILE,
        ssl_keyfile=settings.SSL_KEYFILE,
        reload=True,
    )
