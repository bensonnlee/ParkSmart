import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import auth, classrooms, health, parking, permits, schedules

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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch unhandled exceptions so CORS headers are still applied."""
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Include routers
app.include_router(auth.router)
app.include_router(classrooms.router)
app.include_router(health.router)
app.include_router(parking.router)
app.include_router(permits.router)
app.include_router(schedules.router)


@app.get("/")
async def root() -> dict[str, Any]:
    """Root endpoint with API info."""
    return {
        "name": "ParkSmart API",
        "version": "1.0.0",
        "docs": "/docs",
    }
