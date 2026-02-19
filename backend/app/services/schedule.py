import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Building, Classroom, ScheduleEvent, UserSchedule

logger = logging.getLogger(__name__)

DAY_NAME_TO_INT: dict[str, int] = {
    "MO": 0,
    "TU": 1,
    "WE": 2,
    "TH": 3,
    "FR": 4,
    "SA": 5,
    "SU": 6,
}


def extract_building_name(location_string: str) -> str | None:
    """Extract building name from '{Name} Room: ####' format.

    location_string is expected to have the 'Campus: Riverside Building: '
    prefix already removed by the parser. See app/services/parser.py.
    """
    if " Room: " in location_string:
        return location_string.split(" Room: ")[0]
    return None


async def resolve_building_id(db: AsyncSession, location_string: str) -> uuid.UUID | None:
    """Try to find a building matching the location string. Logs on miss, never raises."""
    building_name = extract_building_name(location_string)
    if not building_name:
        logger.info("Could not extract building name from location: %r", location_string)
        return None
    result = await db.execute(select(Building).where(Building.name == building_name))
    building = result.scalar_one_or_none()
    if building is None:
        logger.info("No building found for name: %r (from location: %r)", building_name, location_string)
        return None
    return building.id


async def get_or_create_classroom(db: AsyncSession, location_string: str) -> Classroom:
    """Return existing Classroom or create a new one for the given location string."""
    result = await db.execute(
        select(Classroom).where(Classroom.location_string == location_string)
    )
    classroom = result.scalar_one_or_none()
    if classroom is None:
        building_id = await resolve_building_id(db, location_string)
        classroom = Classroom(location_string=location_string, building_id=building_id)
        db.add(classroom)
        await db.flush()
    return classroom


async def create_schedule(
    db: AsyncSession,
    user_id: uuid.UUID,
    filename: str,
    parsed_events: list[dict],
) -> UserSchedule:
    """Create a user schedule from parsed ICS events, replacing any existing one."""
    # Delete existing schedule if any (cascade removes events)
    result = await db.execute(
        select(UserSchedule).where(UserSchedule.user_id == user_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.flush()

    # Build classroom cache for dedup within this upload
    classroom_cache: dict[str, Classroom] = {}

    schedule = UserSchedule(user_id=user_id, name=filename)
    db.add(schedule)
    await db.flush()

    for ev in parsed_events:
        classroom_id = None
        location = ev.get("classroom")
        if location:
            if location not in classroom_cache:
                classroom_cache[location] = await get_or_create_classroom(db, location)
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
    return result.scalar_one()


async def get_user_schedule(db: AsyncSession, user_id: uuid.UUID) -> UserSchedule | None:
    """Get a user's schedule with events loaded."""
    result = await db.execute(
        select(UserSchedule)
        .where(UserSchedule.user_id == user_id)
        .options(selectinload(UserSchedule.events))
    )
    return result.scalar_one_or_none()


async def delete_user_schedule(db: AsyncSession, user_id: uuid.UUID) -> bool:
    """Delete a user's schedule. Returns False if not found."""
    result = await db.execute(
        select(UserSchedule).where(UserSchedule.user_id == user_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        return False
    await db.delete(schedule)
    await db.commit()
    return True
