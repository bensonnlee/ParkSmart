import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Classroom, ParkingLot
from app.schemas import ClassroomLotsResponse, ClassroomWithBuilding, ParkingLotRead
from services.location_distance import haversine_distance

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


def _sort_lots_by_distance(
    classroom: Classroom, lots: list[ParkingLot]
) -> list[ParkingLot]:
    # TODO: Calculate distances from each lot to the classroom's building
    # coordinates and return lots sorted closest to farthest.
    # Classroom -> building -> (latitude, longitude)
    # ParkingLot -> (latitude, longitude)  // so return in lat long tuple 

    # get nearest lots calls classroom, gets the specific requested classroom and its data from database and also all 8 lots, and then calls this to sort lots by distance from smallest to largest so we can display them later
    # so basically for each lot's latitude and longitude, send that in along with classroom's long and lat so then sort at end 

    #in models folder specifically with classroom and building.py we create a two-way relationship with building and classroom
    #bunch of classrooms in same building so we link those classrooms to same building ID and we can access the classroom's building or all classrooms in building

    #Gets classroom latitude and longitude
    classroomLatitude = classroom.building.latitude
    classroomLongitude = classroom.building.longitude

    #Now, calculate distance from each parking lot to specific classroom and return them sorted from closest to farthest (Classroom classroom and lists[Parkinglot] lots)
    classroomLotDistances = []
    for lot in lots:
        #haversine_distance(lat1, long1, lat2, long2) whree lat1 long1 is classroom and lat2 long2 is parking lot
        distance = haversine_distance(classroomLatitude, classroomLongitude, lots.latitude, lots.longitude)
        classroomLotDistances.append((lot, distance)) #Append specific lot and distance to print out later with frontend
    classroomLotDistances.sort(key = lambda x: x[1]) #Sort from closest to farthest distance

    return lots


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
    sorted_lots = _sort_lots_by_distance(classroom, lots)

    return ClassroomLotsResponse(
        classroom=ClassroomWithBuilding.model_validate(classroom),
        lots=[ParkingLotRead.model_validate(lot) for lot in sorted_lots],
    )
