"""Seed the Blue Permit and its lot_permit_access rules.

Usage:
    cd backend && python -m seed_blue_permit
    cd backend && python -m seed_blue_permit --dry-run
"""

import argparse
import asyncio

from sqlalchemy import select

from backend.app.database import async_session_maker
from backend.app.models import LotPermitAccess, ParkingLot, PermitType

# All Blue Permit lots — 24/7 access
LOTS_24_7 = ["Lot 6", "Lot 24", "Lot 26", "Lot 30", "Lot 32", "Lot 50"]


async def seed(dry_run: bool = False):
    async with async_session_maker() as session:
        result = await session.execute(
            select(PermitType).where(PermitType.name == "Blue Permit")
        )
        permit = result.scalar_one_or_none()

        if permit is None:
            permit = PermitType(
                name="Blue Permit",
                description=(
                    "Valid 24/7 in Lots 6, 24, 26, 30, 32, 50."
                ),
            )
            session.add(permit)
            await session.flush()
            print(f"Created permit: {permit.name} ({permit.id})")
        else:
            print(f"Permit already exists: {permit.name} ({permit.id})")

        result = await session.execute(
            select(ParkingLot).where(ParkingLot.name.in_(LOTS_24_7))
        )
        lots_by_name = {lot.name: lot for lot in result.scalars().all()}

        missing = set(LOTS_24_7) - set(lots_by_name)
        if missing:
            print(f"Skipping lots not in database: {', '.join(sorted(missing))}")

        for name in LOTS_24_7:
            lot = lots_by_name.get(name)
            if lot is None:
                continue
            session.add(
                LotPermitAccess(
                    lot_id=lot.id,
                    permit_id=permit.id,
                    days_of_week=None,
                    access_start=None,
                    access_end=None,
                )
            )
            print(f"  {name}: 24/7")

        if dry_run:
            await session.rollback()
            print("Dry run — no changes committed.")
        else:
            await session.commit()
            print("Done.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    asyncio.run(seed(dry_run=args.dry_run))
