from pydantic_settings import BaseSettings
import secrets
from typing import Optional, List

class Settings(BaseSettings):
    # Project settings
    PROJECT_NAME: str = "TrackXpense"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "trackxpense"
    POSTGRES_PORT: str = "5432"

    # Computed database URI
    @property
    def DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: str = "6379"

    # Firebase settings
    FIREBASE_CREDENTIALS_PATH: str = "path/to/serviceAccountKey.json"

    # Security settings
    SECRET_KEY: str = "your-secret-key-here"

    # API Keys
    FINANCE_GPT_API_KEY: str = secrets.token_urlsafe(32)
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # API Settings
    API_HOST: str = "0.0.0.0"  # Allow external connections
    API_PORT: int = 8000

    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]  # Allow all origins for development

    # SSL Settings
    SSL_KEYFILE: str = "../certificates/localhost-key.pem"
    SSL_CERTFILE: str = "../certificates/localhost.pem"
    API_URL: str = "https://localhost:8000"

    class Config:
        env_file = ".env"

settings = Settings()


