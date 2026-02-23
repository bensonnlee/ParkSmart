import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Classroom, ParkingLot, LotBuildingDistance
from app.schemas import ClassroomLotsResponse, ClassroomWithBuilding, ParkingLotRead
from app.services.loc_distance import driving_distance_to_lots

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


async def _sort_lots_by_walking_distance(  
    classroom: Classroom, lots: list[ParkingLot], db: AsyncSession
) -> list[ParkingLot]:
    # Calculate walking distances from each lot to the classroom's building
    # coordinates and return lots sorted closest to farthest.
    # Classroom -> building -> (latitude, longitude)
    # ParkingLot -> (latitude, longitude)  

    #Gets each lot from database
    lotID = []
    for lot in lots:
        lotID.append(lot.id)

    #Each classroom is associated with a building so get that buildingID from database
    buildingID = classroom.building.id

    #Get precomputed walking distances from lots that match lotID to specific building that matches buildingID and then convert results into a list for easier access
    result = await db.execute(select(LotBuildingDistance).where(LotBuildingDistance.building_id == buildingID).where(LotBuildingDistance.lot_id.in_(lotID)))
    precomputed_distances = result.scalars().all()

    #Create map/dictionary and only store the precomputed walking distances we found (since not all lots can have precomputed walking distance ?); also has quick lookup
    distance_map = {}
    for distance in precomputed_distances:
        distance_map[distance.lot_id] = float(distance.distance_miles)

    #Add lots and sort lots from closest to farthest via walking distance
    lotData = []
    for lot in lots:
        if lot.id in distance_map:
            lotData.append((lot, distance_map[lot.id]))
    
    lotData.sort(key=lambda x: x[1]) #Sort by distance (index 1 in tuple)
    return [lot for lot, _ in lotData] #Only return sorted lots; ignore distance

@router.get("/lots/from-location", response_model=list[ParkingLotRead])
async def get_nearest_lots_from_location(latitude: float, longitude: float, db: DbSession) -> list[ParkingLotRead]:
    #Get lots from database db
    lotResults = await db.execute(select(ParkingLot))
    lots = list(lotResults.scalars().all())

    #Call function that does Mapbox API call and sorts them
    sortedLots = await driving_distance_to_lots(latitude, longitude, lots)

    return [ParkingLotRead.model_validate(lot) for lot in sortedLots]


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
    sorted_lots = await _sort_lots_by_walking_distance(classroom, lots, db)

    return ClassroomLotsResponse(
        classroom=ClassroomWithBuilding.model_validate(classroom),
        lots=[ParkingLotRead.model_validate(lot) for lot in sorted_lots],
    )
