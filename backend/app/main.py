import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, health, parking, permits

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown."""
    logger.info("Starting ParkSmart API...")
    yield
    logger.info("ParkSmart API shutdown complete")


app = FastAPI(
    title="ParkSmart API",
    description="API for UCR parking lot availability tracking",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(parking.router)
app.include_router(permits.router)


@app.get("/")
async def root() -> dict[str, Any]:
    """Root endpoint with API info."""
    return {
        "name": "ParkSmart API",
        "version": "1.0.0",
        "docs": "/docs",
    }
