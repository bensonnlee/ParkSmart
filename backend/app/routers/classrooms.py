import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Classroom, ParkingLot
from app.schemas import ClassroomLotsResponse, ClassroomWithBuilding, ParkingLotRead
from app.services.location_distance import driving_distance_to_lots

router = APIRouter(prefix="/api/classrooms", tags=["classrooms"])

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


async def _sort_lots_by_distance(  
    classroom: Classroom, lots: list[ParkingLot]
) -> list[tuple[ParkingLot, float, float]]:
    # Calculate distances from each lot to the classroom's building
    # coordinates and return lots sorted closest to farthest, distance in miles, and duration in minutes
    # Classroom -> building -> (latitude, longitude)
    # ParkingLot -> (latitude, longitude)  

    lotDistances = await driving_distance_to_lots(classroom, lots) #gets distance and duration data so convert units here and then sort it
    lotDistances.sort(key=lambda x: x[1]) #Sort by distance (index 1 in tuple)
    
    return lotDistances #Return list of tuples with lot, distance, and duration sorted by distance


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

    lots_result = await db.execute(select(ParkingLot))
    lots = list(lots_result.scalars().all())
    sorted_lots = await _sort_lots_by_distance(classroom, lots)

    return ClassroomLotsResponse(
        classroom=ClassroomWithBuilding.model_validate(classroom),
        lots=[ParkingLotRead.model_validate(lot) for lot, _, _ in sorted_lots], #Changed this part to only return lot info (we can change it or revert it later if the distance and duration is useful or not)
    )
