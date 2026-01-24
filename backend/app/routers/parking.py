import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ParkingLot, ParkingSnapshot
from app.schemas import (
    PaginatedSnapshots,
    ParkingLotWithAvailability,
    ParkingSnapshotRead,
)

router = APIRouter(prefix="/api/lots", tags=["parking"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[ParkingLotWithAvailability])
async def list_lots(db: DbSession) -> list[ParkingLotWithAvailability]:
    """Get all parking lots with their latest availability."""
    # Subquery to get the latest snapshot for each lot
    latest_snapshot_subq = (
        select(
            ParkingSnapshot.lot_id,
            ParkingSnapshot.free_spaces,
            ParkingSnapshot.occupancy_pct,
            ParkingSnapshot.collected_at,
        )
        .distinct(ParkingSnapshot.lot_id)
        .order_by(ParkingSnapshot.lot_id, desc(ParkingSnapshot.collected_at))
        .subquery()
    )

    # Main query joining lots with latest snapshots
    stmt = (
        select(
            ParkingLot,
            latest_snapshot_subq.c.free_spaces,
            latest_snapshot_subq.c.occupancy_pct,
            latest_snapshot_subq.c.collected_at.label("availability_updated_at"),
        )
        .outerjoin(latest_snapshot_subq, ParkingLot.id == latest_snapshot_subq.c.lot_id)
        .order_by(ParkingLot.name)
    )

    result = await db.execute(stmt)
    rows = result.all()

    lots = []
    for row in rows:
        lot = row[0]
        lots.append(
            ParkingLotWithAvailability(
                id=lot.id,
                name=lot.name,
                address=lot.address,
                total_spaces=lot.total_spaces,
                latitude=lot.latitude,
                longitude=lot.longitude,
                created_at=lot.created_at,
                updated_at=lot.updated_at,
                free_spaces=row[1],
                occupancy_pct=row[2],
                availability_updated_at=row[3],
            )
        )

    return lots


@router.get("/{lot_id}", response_model=ParkingLotWithAvailability)
async def get_lot(lot_id: uuid.UUID, db: DbSession) -> ParkingLotWithAvailability:
    """Get a single parking lot by ID with latest availability."""
    # Get the lot
    stmt = select(ParkingLot).where(ParkingLot.id == lot_id)
    result = await db.execute(stmt)
    lot = result.scalar_one_or_none()

    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")

    # Get latest snapshot
    snapshot_stmt = (
        select(ParkingSnapshot)
        .where(ParkingSnapshot.lot_id == lot_id)
        .order_by(desc(ParkingSnapshot.collected_at))
        .limit(1)
    )
    snapshot_result = await db.execute(snapshot_stmt)
    snapshot = snapshot_result.scalar_one_or_none()

    return ParkingLotWithAvailability(
        id=lot.id,
        name=lot.name,
        address=lot.address,
        total_spaces=lot.total_spaces,
        latitude=lot.latitude,
        longitude=lot.longitude,
        created_at=lot.created_at,
        updated_at=lot.updated_at,
        free_spaces=snapshot.free_spaces if snapshot else None,
        occupancy_pct=snapshot.occupancy_pct if snapshot else None,
        availability_updated_at=snapshot.collected_at if snapshot else None,
    )


@router.get("/{lot_id}/history", response_model=PaginatedSnapshots)
async def get_lot_history(
    lot_id: uuid.UUID,
    db: DbSession,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
) -> PaginatedSnapshots:
    """Get historical snapshots for a parking lot with pagination."""
    # Verify lot exists
    lot_stmt = select(ParkingLot.id).where(ParkingLot.id == lot_id)
    lot_result = await db.execute(lot_stmt)
    if not lot_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Lot not found")

    # Count total snapshots
    count_stmt = (
        select(func.count())
        .select_from(ParkingSnapshot)
        .where(ParkingSnapshot.lot_id == lot_id)
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    # Get paginated snapshots
    offset = (page - 1) * per_page
    snapshots_stmt = (
        select(ParkingSnapshot)
        .where(ParkingSnapshot.lot_id == lot_id)
        .order_by(desc(ParkingSnapshot.collected_at))
        .offset(offset)
        .limit(per_page)
    )
    snapshots_result = await db.execute(snapshots_stmt)
    snapshots = snapshots_result.scalars().all()

    pages = (total + per_page - 1) // per_page if total > 0 else 1

    return PaginatedSnapshots(
        items=[ParkingSnapshotRead.model_validate(s) for s in snapshots],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )
