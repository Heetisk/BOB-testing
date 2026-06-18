from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = ConfigDict(env_file=".env", extra="ignore")

    # Application
    APP_NAME: str = "AccountGuard AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./accountguard.db"

    # JWT Authentication
    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ML Model Paths
    MODEL_PATH: str = "app/ml/model/model.pkl"
    SCALER_PATH: str = "app/ml/model/scaler.pkl"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
