"""Seed the Gold Plus Permit and its lot_permit_access rules.

Usage:
    cd backend && python -m seed_gold_plus_permit
    cd backend && python -m seed_gold_plus_permit --dry-run
"""

import argparse
import asyncio
from datetime import time

from sqlalchemy import select

from backend.app.database import async_session_maker
from backend.app.models import LotPermitAccess, ParkingLot, PermitType

# Gold Lots + Big Springs 2 — 24/7 access
LOTS_24_7 = ["Lot 26", "Lot 30", "Lot 32", "Lot 50", "Big Springs 2"]

# Blue Lots — after 6 PM Mon-Fri, all day Sat-Sun
BLUE_LOTS_RESTRICTED = ["Lot 6", "Lot 24"]


async def seed(dry_run: bool = False):
    async with async_session_maker() as session:
        result = await session.execute(
            select(PermitType).where(PermitType.name == "Gold Plus Permit")
        )
        permit = result.scalar_one_or_none()

        if permit is None:
            permit = PermitType(
                name="Gold Plus Permit",
                description=(
                    "Valid 24/7 in Gold Lots (26, 30, 32, 50) and Big Springs 2. "
                    "Valid in select Blue Lots (6, 24) after 6 PM Mon-Fri "
                    "and all day Sat-Sun."
                ),
            )
            session.add(permit)
            await session.flush()
            print(f"Created permit: {permit.name} ({permit.id})")
        else:
            print(f"Permit already exists: {permit.name} ({permit.id})")

        all_lot_names = LOTS_24_7 + BLUE_LOTS_RESTRICTED
        result = await session.execute(
            select(ParkingLot).where(ParkingLot.name.in_(all_lot_names))
        )
        lots_by_name = {lot.name: lot for lot in result.scalars().all()}

        missing = set(all_lot_names) - set(lots_by_name)
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

        for name in BLUE_LOTS_RESTRICTED:
            lot = lots_by_name.get(name)
            if lot is None:
                continue
            session.add(
                LotPermitAccess(
                    lot_id=lot.id,
                    permit_id=permit.id,
                    days_of_week=[0, 1, 2, 3, 4],
                    access_start=time(18, 0),
                    access_end=time(23, 59),
                )
            )
            print(f"  {name}: Mon-Fri 6 PM - 11:59 PM")

        for name in BLUE_LOTS_RESTRICTED:
            lot = lots_by_name.get(name)
            if lot is None:
                continue
            session.add(
                LotPermitAccess(
                    lot_id=lot.id,
                    permit_id=permit.id,
                    days_of_week=[5, 6],
                    access_start=None,
                    access_end=None,
                )
            )
            print(f"  {name}: Sat-Sun all day")

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
