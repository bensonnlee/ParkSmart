import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Building, LotBuildingDistance, ParkingLot
from app.schemas import BuildingLotsResponse, BuildingRead, ParkingLotWithDistance

router = APIRouter(prefix="/api/buildings", tags=["buildings"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[BuildingRead])
async def search_buildings(
    db: DbSession,
    q: str | None = Query(None, min_length=1),
) -> list[BuildingRead]:
    """Search buildings by name or nickname. Returns all buildings if no query."""
    stmt = select(Building)
    if q and q.strip():
        escaped = q.strip().replace("%", r"\%").replace("_", r"\_")
        pattern = f"%{escaped}%"
        stmt = stmt.where(
            Building.name.ilike(pattern, escape="\\")
            | Building.nickname.ilike(pattern, escape="\\")
        )
    stmt = stmt.order_by(Building.name).limit(50)
    result = await db.execute(stmt)
    return [BuildingRead.model_validate(b) for b in result.scalars().all()]


@router.get("/{building_id}/lots", response_model=BuildingLotsResponse)
async def get_building_lots(
    building_id: uuid.UUID,
    db: DbSession,
) -> BuildingLotsResponse:
    """Get a building with all parking lots sorted by walking distance."""
    # Fetch building
    result = await db.execute(select(Building).where(Building.id == building_id))
    building = result.scalar_one_or_none()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Building not found",
        )

    # Join distances with lots directly — avoids loading all lots into memory
    dist_result = await db.execute(
        select(LotBuildingDistance, ParkingLot)
        .join(ParkingLot, LotBuildingDistance.lot_id == ParkingLot.id)
        .where(LotBuildingDistance.building_id == building_id)
        .order_by(LotBuildingDistance.distance_miles)
    )

    lot_responses = []
    for dist, lot in dist_result.all():
        item = ParkingLotWithDistance.model_validate(lot)
        item.travel_minutes = round(float(dist.duration_minutes), 1)
        lot_responses.append(item)

    return BuildingLotsResponse(
        building=BuildingRead.model_validate(building),
        lots=lot_responses,
    )
