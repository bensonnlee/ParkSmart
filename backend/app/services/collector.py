import logging
from datetime import UTC, datetime
from decimal import Decimal

import httpx
from sqlalchemy import select

from app.config import get_settings
from app.database import async_session_maker
from app.models import ParkingLot, ParkingSnapshot

logger = logging.getLogger(__name__)


async def collect_parking_data() -> tuple[int, int]:
    """
    Fetch parking data from UCR API and store in database.
    Returns tuple of (lots_updated, snapshots_created).
    """
    settings = get_settings()

    lots_updated = 0
    snapshots_created = 0

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.ucr_api_url, timeout=60.0)
            response.raise_for_status()
            data = response.json()

        async with async_session_maker() as session:
            for lot_data in data:
                name = lot_data.get("location_name")
                if not name:
                    continue

                # Find or create lot
                stmt = select(ParkingLot).where(ParkingLot.name == name)
                result = await session.execute(stmt)
                lot = result.scalar_one_or_none()

                address = lot_data.get("location_address")
                total_spaces = lot_data.get("total_spaces")
                free_spaces = lot_data.get("free_spaces")

                if lot is None:
                    # Create new lot
                    lot = ParkingLot(
                        name=name,
                        address=address,
                        total_spaces=total_spaces,
                    )
                    session.add(lot)
                    await session.flush()
                    lots_updated += 1
                else:
                    # Update existing lot if needed
                    if lot.address != address or lot.total_spaces != total_spaces:
                        lot.address = address
                        lot.total_spaces = total_spaces
                        lots_updated += 1

                # Create snapshot if we have free_spaces data
                if free_spaces is not None:
                    occupancy_pct = None
                    if total_spaces and total_spaces > 0:
                        occupancy_pct = Decimal(
                            ((total_spaces - free_spaces) / total_spaces) * 100
                        ).quantize(Decimal("0.01"))

                    snapshot = ParkingSnapshot(
                        lot_id=lot.id,
                        free_spaces=free_spaces,
                        occupancy_pct=occupancy_pct,
                        collected_at=datetime.now(UTC),
                    )
                    session.add(snapshot)
                    snapshots_created += 1

            await session.commit()

        logger.info(
            f"Collection complete: {lots_updated} lots updated, "
            f"{snapshots_created} snapshots created"
        )

    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching parking data: {e}")
        raise
    except Exception as e:
        logger.error(f"Error collecting parking data: {e}")
        raise

    return lots_updated, snapshots_created
