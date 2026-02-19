import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Building, Classroom, ScheduleEvent, User, UserSchedule
from app.schemas import UserScheduleRead
from app.services.parser import parse_ics_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/schedules", tags=["schedules"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

DAY_NAME_TO_INT: dict[str, int] = {
    "MO": 0,
    "TU": 1,
    "WE": 2,
    "TH": 3,
    "FR": 4,
    "SA": 5,
    "SU": 6,
}


def _extract_building_name(location_string: str) -> str | None:
    """Extract building name from '{Name} Room: ####' format.

    location_string is expected to have the 'Campus: Riverside Building: '
    prefix already removed by the parser. See app/services/parser.py.
    """
    if " Room: " in location_string:
        return location_string.split(" Room: ")[0]
    return None


async def _resolve_building_id(db: AsyncSession, location_string: str) -> uuid.UUID | None:
    """Try to find a building matching the location string. Logs on miss, never raises."""
    building_name = _extract_building_name(location_string)
    if not building_name:
        logger.info("Could not extract building name from location: %r", location_string)
        return None
    result = await db.execute(select(Building).where(Building.name == building_name))
    building = result.scalar_one_or_none()
    if building is None:
        logger.info("No building found for name: %r (from location: %r)", building_name, location_string)
        return None
    return building.id


async def _get_or_create_classroom(db: AsyncSession, location_string: str) -> Classroom:
    """Return existing Classroom or create a new one for the given location string."""
    result = await db.execute(
        select(Classroom).where(Classroom.location_string == location_string)
    )
    classroom = result.scalar_one_or_none()
    if classroom is None:
        building_id = await _resolve_building_id(db, location_string)
        classroom = Classroom(location_string=location_string, building_id=building_id)
        db.add(classroom)
        await db.flush()
    return classroom


@router.post(
    "/upload", response_model=UserScheduleRead, status_code=status.HTTP_201_CREATED
)
async def upload_schedule(
    file: UploadFile,
    db: DbSession,
    user: CurrentUser,
) -> UserScheduleRead:
    """Upload an .ics file and create the user's schedule."""
    if not file.filename or not file.filename.lower().endswith(".ics"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .ics files are accepted",
        )

    data = await file.read()

    try:
        parsed_events = parse_ics_bytes(data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse .ics file: {e}",
        ) from e

    # Delete existing schedule if any (cascade removes events)
    result = await db.execute(
        select(UserSchedule).where(UserSchedule.user_id == user.id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.flush()

    # Build classroom cache for dedup within this upload
    classroom_cache: dict[str, Classroom] = {}

    schedule = UserSchedule(user_id=user.id, name=file.filename)
    db.add(schedule)
    await db.flush()

    for ev in parsed_events:
        classroom_id = None
        location = ev.get("classroom")
        if location:
            if location not in classroom_cache:
                classroom_cache[location] = await _get_or_create_classroom(db, location)
            classroom_id = classroom_cache[location].id

        days_of_week = [
            DAY_NAME_TO_INT[d] for d in ev.get("days", []) if d in DAY_NAME_TO_INT
        ] or None

        event = ScheduleEvent(
            schedule_id=schedule.id,
            event_name=ev.get("class", ""),
            classroom_id=classroom_id,
            start_time=ev["start_time"].time(),
            end_time=ev["end_time"].time(),
            days_of_week=days_of_week,
            valid_from=ev["start_time"].date(),
            valid_until=ev["until"].date() if ev.get("until") else None,
        )
        db.add(event)

    await db.commit()

    # Re-query with relationships loaded
    result = await db.execute(
        select(UserSchedule)
        .where(UserSchedule.id == schedule.id)
        .options(selectinload(UserSchedule.events))
    )
    schedule = result.scalar_one()
    return UserScheduleRead.model_validate(schedule)


@router.get("/me", response_model=UserScheduleRead)
async def get_my_schedule(
    db: DbSession,
    user: CurrentUser,
) -> UserScheduleRead:
    """Get the current user's schedule."""
    result = await db.execute(
        select(UserSchedule)
        .where(UserSchedule.user_id == user.id)
        .options(selectinload(UserSchedule.events))
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No schedule found",
        )
    return UserScheduleRead.model_validate(schedule)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_schedule(
    db: DbSession,
    user: CurrentUser,
) -> None:
    """Delete the current user's schedule."""
    result = await db.execute(
        select(UserSchedule).where(UserSchedule.user_id == user.id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No schedule found",
        )
    await db.delete(schedule)
    await db.commit()
