import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import PermitType, LotPermitAccess, ParkingLot
from app.schemas import PermitTypeRead, ParkingLotRead

router = APIRouter(prefix="/api/permits", tags=["permits"])


@router.get("", response_model=list[PermitTypeRead])
async def list_permits(db: AsyncSession = Depends(get_db)):
    """Get all permit types."""
    stmt = select(PermitType).order_by(PermitType.name)
    result = await db.execute(stmt)
    permits = result.scalars().all()
    return [PermitTypeRead.model_validate(p) for p in permits]


@router.get("/{permit_id}", response_model=PermitTypeRead)
async def get_permit(permit_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get a single permit type by ID."""
    stmt = select(PermitType).where(PermitType.id == permit_id)
    result = await db.execute(stmt)
    permit = result.scalar_one_or_none()

    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")

    return PermitTypeRead.model_validate(permit)


@router.get("/{permit_id}/lots", response_model=list[ParkingLotRead])
async def get_lots_by_permit(
    permit_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all parking lots accessible by a given permit at the current time/day.
    """
    # Verify permit exists
    permit_stmt = select(PermitType.id).where(PermitType.id == permit_id)
    permit_result = await db.execute(permit_stmt)
    if not permit_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Permit not found")

    # Get current day of week (0=Monday, 6=Sunday in Python)
    now = datetime.now()
    current_day = now.weekday()
    current_time = now.time()

    # Find lots with access rules that apply now
    # Access is granted if:
    # 1. permit_id matches
    # 2. days_of_week is NULL (all days) OR current_day is in days_of_week
    # 3. access_start is NULL OR current_time >= access_start
    # 4. access_end is NULL OR current_time <= access_end
    access_stmt = (
        select(LotPermitAccess.lot_id)
        .where(
            and_(
                LotPermitAccess.permit_id == permit_id,
                or_(
                    LotPermitAccess.days_of_week.is_(None),
                    LotPermitAccess.days_of_week.any(current_day),
                ),
                or_(
                    LotPermitAccess.access_start.is_(None),
                    LotPermitAccess.access_start <= current_time,
                ),
                or_(
                    LotPermitAccess.access_end.is_(None),
                    LotPermitAccess.access_end >= current_time,
                ),
            )
        )
        .distinct()
    )

    # Get the actual lots
    lots_stmt = (
        select(ParkingLot)
        .where(ParkingLot.id.in_(access_stmt))
        .order_by(ParkingLot.name)
    )
    result = await db.execute(lots_stmt)
    lots = result.scalars().all()

    return [ParkingLotRead.model_validate(lot) for lot in lots]
