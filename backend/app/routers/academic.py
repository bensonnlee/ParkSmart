"""Academic calendar router — manage terms and auto-generated weeks."""

import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies.auth import get_admin_user
from app.models import AcademicTerm, AcademicWeek, User
from app.schemas import (
    AcademicTermCreate,
    AcademicTermRead,
    AcademicTermUpdate,
    CurrentTermResponse,
)

router = APIRouter(prefix="/api/academic", tags=["academic"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
AdminUser = Annotated[User, Depends(get_admin_user)]

PACIFIC = ZoneInfo("America/Los_Angeles")
TERM_WEEKS = 11
TERM_DAYS = TERM_WEEKS * 7 - 1  # 76 days from start Sunday to end Saturday


def _validate_sunday(d: date) -> None:
    """Raise 422 if the date is not a Sunday."""
    if d.weekday() != 6:  # Python: Monday=0, Sunday=6
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"start_date must be a Sunday, got {d.strftime('%A')}",
        )


async def _check_uniqueness(
    db: AsyncSession, term_type: str, year: int, exclude_id: uuid.UUID | None = None,
) -> None:
    """Raise 409 if a term with the same type and year already exists."""
    stmt = select(AcademicTerm).where(
        AcademicTerm.term_type == term_type,
        func.extract("year", AcademicTerm.start_date) == year,
    )
    if exclude_id:
        stmt = stmt.where(AcademicTerm.id != exclude_id)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{term_type.title()} {year} already exists",
        )


async def _check_overlap(
    db: AsyncSession, start: date, exclude_id: uuid.UUID | None = None,
) -> None:
    """Raise 409 if the new term's 11-week range overlaps an existing term."""
    new_end = start + timedelta(days=TERM_DAYS)
    stmt = select(AcademicTerm).where(
        # Closed-interval overlap: A.start <= B.end AND B.start <= A.end
        AcademicTerm.start_date <= new_end,
        AcademicTerm.start_date + timedelta(days=TERM_DAYS) >= start,
    )
    if exclude_id:
        stmt = stmt.where(AcademicTerm.id != exclude_id)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Term dates overlap with an existing term",
        )


def _generate_weeks(term: AcademicTerm) -> list[AcademicWeek]:
    """Create 11 AcademicWeek objects for a term."""
    weeks = []
    for i in range(TERM_WEEKS):
        week_start = term.start_date + timedelta(weeks=i)
        weeks.append(
            AcademicWeek(
                term_id=term.id,
                week_number=i + 1,
                start_date=week_start,
                end_date=week_start + timedelta(days=6),
            )
        )
    return weeks


async def _load_term(db: AsyncSession, term_id: uuid.UUID) -> AcademicTerm:
    """Load a term with its weeks. Raises 404 if not found."""
    result = await db.execute(
        select(AcademicTerm)
        .where(AcademicTerm.id == term_id)
        .options(selectinload(AcademicTerm.weeks))
    )
    term = result.scalar_one_or_none()
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Term not found"
        )
    return term


@router.post("/terms", response_model=AcademicTermRead, status_code=status.HTTP_201_CREATED)
async def create_term(body: AcademicTermCreate, db: DbSession, admin: AdminUser) -> AcademicTermRead:
    """Create an academic term and auto-generate 11 weeks."""
    _validate_sunday(body.start_date)
    await _check_uniqueness(db, body.term_type, body.start_date.year)
    await _check_overlap(db, body.start_date)

    term = AcademicTerm(
        name=f"{body.term_type.title()} {body.start_date.year}",
        term_type=body.term_type,
        start_date=body.start_date,
    )
    db.add(term)
    await db.flush()  # Populate term.id

    db.add_all(_generate_weeks(term))
    await db.commit()

    term = await _load_term(db, term.id)
    return AcademicTermRead.model_validate(term)


@router.get("/terms", response_model=list[AcademicTermRead])
async def list_terms(db: DbSession) -> list[AcademicTermRead]:
    """List all academic terms, most recent first."""
    result = await db.execute(
        select(AcademicTerm)
        .options(selectinload(AcademicTerm.weeks))
        .order_by(AcademicTerm.start_date.desc())
    )
    terms = result.scalars().all()
    return [AcademicTermRead.model_validate(t) for t in terms]


# Must precede /{term_id} to avoid "current" being parsed as UUID
@router.get("/terms/current", response_model=CurrentTermResponse)
async def get_current_term(db: DbSession) -> CurrentTermResponse:
    """Return the term containing today (Pacific time), or null if on break/summer."""
    today = datetime.now(UTC).astimezone(PACIFIC).date()

    result = await db.execute(
        select(AcademicTerm)
        .where(
            exists(
                select(AcademicWeek.id).where(
                    AcademicWeek.term_id == AcademicTerm.id,
                    AcademicWeek.start_date <= today,
                    AcademicWeek.end_date >= today,
                )
            )
        )
        .options(selectinload(AcademicTerm.weeks))
    )
    term = result.scalar_one_or_none()
    return CurrentTermResponse(current_term=AcademicTermRead.model_validate(term) if term else None)


@router.get("/terms/{term_id}", response_model=AcademicTermRead)
async def get_term(term_id: uuid.UUID, db: DbSession) -> AcademicTermRead:
    """Get a single term with its weeks."""
    term = await _load_term(db, term_id)
    return AcademicTermRead.model_validate(term)


@router.put("/terms/{term_id}", response_model=AcademicTermRead)
async def update_term(
    term_id: uuid.UUID, body: AcademicTermUpdate, db: DbSession, admin: AdminUser,
) -> AcademicTermRead:
    """Update a term. Deletes and regenerates weeks in a single transaction."""
    _validate_sunday(body.start_date)
    term = await _load_term(db, term_id)

    await _check_uniqueness(db, body.term_type, body.start_date.year, exclude_id=term.id)
    await _check_overlap(db, body.start_date, exclude_id=term.id)

    term.term_type = body.term_type
    term.start_date = body.start_date
    term.name = f"{body.term_type.title()} {body.start_date.year}"

    for week in list(term.weeks):
        await db.delete(week)
    await db.flush()

    db.add_all(_generate_weeks(term))
    await db.commit()

    term = await _load_term(db, term.id)
    return AcademicTermRead.model_validate(term)


@router.delete("/terms/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_term(term_id: uuid.UUID, db: DbSession, admin: AdminUser) -> None:
    """Delete a term and its weeks (cascade)."""
    term = await _load_term(db, term_id)
    await db.delete(term)
    await db.commit()
