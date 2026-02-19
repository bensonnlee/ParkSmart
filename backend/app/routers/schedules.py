from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import User
from app.schemas import UserScheduleRead
from app.services import schedule as schedule_service
from app.services.parser import parse_ics_bytes

router = APIRouter(prefix="/api/schedules", tags=["schedules"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


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

    schedule = await schedule_service.create_schedule(db, user.id, file.filename, parsed_events)
    return UserScheduleRead.model_validate(schedule)


@router.get("/me", response_model=UserScheduleRead)
async def get_my_schedule(
    db: DbSession,
    user: CurrentUser,
) -> UserScheduleRead:
    """Get the current user's schedule."""
    schedule = await schedule_service.get_user_schedule(db, user.id)
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
    deleted = await schedule_service.delete_user_schedule(db, user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No schedule found",
        )
