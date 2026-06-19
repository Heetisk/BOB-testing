from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup: create database tables
    await init_db()
    yield
    # Shutdown: cleanup if needed


def create_app() -> FastAPI:
    """Application factory: create and configure the FastAPI app."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-Based Account Takeover Detection System",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Import and register routes
    from app.api.v1.router import api_router
    app.include_router(api_router, prefix="/api/v1")

    # Health check endpoint
    @app.api_route("/health", methods=["GET", "HEAD"])
    async def health_check():
        return {"status": "healthy", "version": settings.APP_VERSION}

    return app


app = create_app()
