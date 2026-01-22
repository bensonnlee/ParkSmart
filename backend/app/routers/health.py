from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ParkingSnapshot
from app.schemas import HealthResponse, CollectionResponse
from app.services.collector import collect_parking_data

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """Check API health status and last collection time."""
    stmt = select(ParkingSnapshot.collected_at).order_by(desc(ParkingSnapshot.collected_at)).limit(1)
    result = await db.execute(stmt)
    last_collection = result.scalar_one_or_none()

    return HealthResponse(
        status="ok",
        last_collection=last_collection,
    )


@router.post("/api/collect", response_model=CollectionResponse)
async def trigger_collection():
    """Manually trigger a parking data collection."""
    lots_updated, snapshots_created = await collect_parking_data()
    return CollectionResponse(
        status="ok",
        lots_updated=lots_updated,
        snapshots_created=snapshots_created,
    )
