import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Classroom, ParkingLot, LotBuildingDistance
from app.schemas import ClassroomLotsResponse, ClassroomWithBuilding, ParkingLotWithDistance
from app.services.loc_distance import driving_distance_to_lots

router = APIRouter(prefix="/api/classrooms", tags=["classrooms"])


def _to_lot_responses(lot_tuples: list[tuple[ParkingLot, float]]) -> list[ParkingLotWithDistance]:
    """Convert (lot, duration_minutes) tuples to ParkingLotWithDistance schemas."""
    result = []
    for lot, duration in lot_tuples:
        item = ParkingLotWithDistance.model_validate(lot)
        item.travel_minutes = round(duration, 1)
        result.append(item)
    return result

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def _get_classroom(classroom_id: uuid.UUID, db: AsyncSession) -> Classroom:
    """Fetch a classroom by ID with its building, or raise 404."""
    result = await db.execute(
        select(Classroom)
        .where(Classroom.id == classroom_id)
        .options(selectinload(Classroom.building))
    )
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found",
        )
    return classroom


async def _sort_lots_by_walking_distance(
    classroom: Classroom, lots: list[ParkingLot], db: AsyncSession
) -> list[tuple[ParkingLot, float]]:
    # Calculate walking distances from each lot to the classroom's building
    # coordinates and return lots sorted closest to farthest.

    lotID = [lot.id for lot in lots]
    buildingID = classroom.building.id

    result = await db.execute(select(LotBuildingDistance).where(LotBuildingDistance.building_id == buildingID).where(LotBuildingDistance.lot_id.in_(lotID)))
    precomputed_distances = result.scalars().all()

    # Store (distance_miles, duration_minutes) per lot for sorting and response
    distance_map: dict[uuid.UUID, tuple[float, float]] = {}
    for distance in precomputed_distances:
        distance_map[distance.lot_id] = (float(distance.distance_miles), float(distance.duration_minutes))

    # Sort lots from closest to farthest via walking distance, return (lot, duration_minutes)
    lotData = []
    for lot in lots:
        if lot.id in distance_map:
            dist, duration = distance_map[lot.id]
            lotData.append((lot, dist, duration))

    lotData.sort(key=lambda x: x[1])  # Sort by distance
    return [(lot, duration) for lot, _, duration in lotData]

@router.get("/lots/from-location", response_model=list[ParkingLotWithDistance])
async def get_nearest_lots_from_location(latitude: float, longitude: float, db: DbSession) -> list[ParkingLotWithDistance]:
    #Get lots from database db
    lotResults = await db.execute(select(ParkingLot))
    lots = list(lotResults.scalars().all())

    #Call function that does Mapbox API call and sorts them
    sorted_lot_tuples = await driving_distance_to_lots(latitude, longitude, lots)

    return _to_lot_responses(sorted_lot_tuples)


@router.get("/{classroom_id}", response_model=ClassroomWithBuilding)
async def get_classroom(
    classroom_id: uuid.UUID,
    db: DbSession,
) -> ClassroomWithBuilding:
    """Get a classroom by ID, including its building."""
    classroom = await _get_classroom(classroom_id, db)
    return ClassroomWithBuilding.model_validate(classroom)


@router.get("/{classroom_id}/lots", response_model=ClassroomLotsResponse)
async def get_nearest_lots(
    classroom_id: uuid.UUID,
    db: DbSession,
) -> ClassroomLotsResponse:
    """Get a classroom with its building info and all parking lots sorted by distance."""
    classroom = await _get_classroom(classroom_id, db)

    if classroom.building is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Classroom has no mapped building; cannot calculate distances",
        )

    lots_result = await db.execute(select(ParkingLot))
    lots = list(lots_result.scalars().all())
    sorted_lot_tuples = await _sort_lots_by_walking_distance(classroom, lots, db)

    return ClassroomLotsResponse(
        classroom=ClassroomWithBuilding.model_validate(classroom),
        lots=_to_lot_responses(sorted_lot_tuples),
    )
