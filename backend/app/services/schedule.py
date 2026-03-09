import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Building, Classroom, ScheduleEvent, UserSchedule
from app.schemas import ManualEventCreate, ManualEventUpdate

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


async def _resolve_classroom_id(
    db: AsyncSession,
    building_id: uuid.UUID | None,
    room_number: str | None,
) -> uuid.UUID | None:
    """Look up a building by ID and resolve to a classroom, creating one if needed."""
    if building_id is None:
        return None
    result = await db.execute(select(Building).where(Building.id == building_id))
    building = result.scalar_one_or_none()
    if building is None:
        return None
    location_string = (
        f"{building.name} Room: {room_number}" if room_number else building.name
    )
    classroom = await get_or_create_classroom(db, location_string)
    return classroom.id


async def add_single_event(
    db: AsyncSession, user_id: uuid.UUID, data: ManualEventCreate
) -> ScheduleEvent:
    """Add a single manually-created event to the user's schedule."""
    # Get or create the user's schedule
    result = await db.execute(
        select(UserSchedule).where(UserSchedule.user_id == user_id)
    )
    schedule = result.scalar_one_or_none()
    if schedule is None:
        schedule = UserSchedule(user_id=user_id, name="My Schedule")
        db.add(schedule)
        await db.flush()

    classroom_id = await _resolve_classroom_id(db, data.building_id, data.room_number)

    event = ScheduleEvent(
        schedule_id=schedule.id,
        event_name=data.event_name,
        classroom_id=classroom_id,
        start_time=data.start_time,
        end_time=data.end_time,
        days_of_week=data.days_of_week,
        valid_from=data.valid_from,
        valid_until=data.valid_until,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def update_event(
    db: AsyncSession, user_id: uuid.UUID, event_id: uuid.UUID, data: ManualEventUpdate
) -> ScheduleEvent | None:
    """Update a manually-created event. Returns None if not found/owned."""
    result = await db.execute(
        select(ScheduleEvent)
        .join(UserSchedule)
        .where(ScheduleEvent.id == event_id, UserSchedule.user_id == user_id)
    )
    event = result.scalar_one_or_none()
    if event is None:
        return None

    # Update simple fields
    if data.event_name is not None:
        event.event_name = data.event_name
    if data.start_time is not None:
        event.start_time = data.start_time
    if data.end_time is not None:
        event.end_time = data.end_time
    if data.days_of_week is not None:
        event.days_of_week = data.days_of_week
    if data.valid_from is not None:
        event.valid_from = data.valid_from
    if data.valid_until is not None:
        event.valid_until = data.valid_until

    # Reconstruct classroom if building/room fields were sent
    # Use model_fields_set to distinguish "field sent as None" from "field not sent"
    building_sent = "building_id" in data.model_fields_set
    room_sent = "room_number" in data.model_fields_set

    if building_sent or room_sent:
        event.classroom_id = await _resolve_classroom_id(
            db, data.building_id, data.room_number
        )

    await db.commit()
    await db.refresh(event)
    return event


async def delete_event(
    db: AsyncSession, user_id: uuid.UUID, event_id: uuid.UUID
) -> bool:
    """Delete a single event. Returns False if not found or not owned."""
    result = await db.execute(
        select(ScheduleEvent)
        .join(UserSchedule)
        .where(ScheduleEvent.id == event_id, UserSchedule.user_id == user_id)
    )
    event = result.scalar_one_or_none()
    if event is None:
        return False
    await db.delete(event)
    await db.commit()
    return True


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
