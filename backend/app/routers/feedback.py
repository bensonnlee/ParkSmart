"""Feedback router - accepts beta user feedback submissions."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Feedback, User
from app.schemas import FeedbackCreate, FeedbackRead

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("", response_model=FeedbackRead, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    body: FeedbackCreate,
    db: DbSession,
    user: CurrentUser,
) -> FeedbackRead:
    """Submit feedback. Requires authentication."""
    feedback = Feedback(
        user_id=user.id,
        category=body.category,
        message=body.message,
        contact_email=body.contact_email,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return FeedbackRead.model_validate(feedback)
