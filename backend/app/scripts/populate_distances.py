"""
Populate the lot_building_distances table with walking distances from Mapbox.

Queries all parking lots and buildings from the database, calls the Mapbox
Directions Matrix API (walking profile) for each building, and upserts
distance/duration rows.

Usage:
    cd backend
    python -m app.scripts.populate_distances
"""

import asyncio

import httpx
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.config import get_settings
from app.database import async_session_maker
from app.models.building import Building
from app.models.lot_building_distance import LotBuildingDistance
from app.models.parking_lot import ParkingLot

settings = get_settings()

MAPBOX_MATRIX_URL = "https://api.mapbox.com/directions-matrix/v1/mapbox/walking"
# Mapbox Matrix API allows max 25 coordinates per request.
# 1 slot is used by the building, leaving 24 for lots.
MAX_LOTS_PER_BATCH = 24


async def _fetch_batch(
    building: Building,
    lot_batch: list[ParkingLot],
    client: httpx.AsyncClient,
) -> list[tuple[ParkingLot, float, float]]:
    """Call Mapbox Matrix API for one building against a batch of lots."""
    coords = f"{building.longitude},{building.latitude}"
    for lot in lot_batch:
        coords += f";{lot.longitude},{lot.latitude}"

    url = (
        f"{MAPBOX_MATRIX_URL}/{coords}"
        f"?sources=0&annotations=distance,duration"
        f"&access_token={settings.mapbox_access_token}"
    )

    response = await client.get(url)
    response.raise_for_status()
    data = response.json()

    distances = data["distances"][0]
    durations = data["durations"][0]

    results = []
    for i, lot in enumerate(lot_batch):
        distance_miles = round(distances[i + 1] / 1609.34, 3)  # meters -> miles
        duration_minutes = round(durations[i + 1] / 60, 2)  # seconds -> minutes
        results.append((lot, distance_miles, duration_minutes))

    return results


async def fetch_walking_distances(
    building: Building,
    lots: list[ParkingLot],
    client: httpx.AsyncClient,
) -> list[tuple[ParkingLot, float, float]]:
    """Call Mapbox Matrix API for one building against all lots.

    Automatically batches into chunks of 24 lots to stay within the
    Mapbox 25-coordinate limit. Returns list of (lot, distance_miles, duration_minutes).
    """
    results = []
    for i in range(0, len(lots), MAX_LOTS_PER_BATCH):
        batch = lots[i : i + MAX_LOTS_PER_BATCH]
        results.extend(await _fetch_batch(building, batch, client))
    return results


async def main() -> None:
    async with async_session_maker() as session:
        # Fetch all buildings with coordinates
        buildings = (
            (await session.execute(
                select(Building)
                .where(Building.latitude.is_not(None))
                .where(Building.longitude.is_not(None))
            )).scalars().all()
        )

        # Fetch all lots with coordinates
        lots = (
            (await session.execute(
                select(ParkingLot)
                .where(ParkingLot.latitude.is_not(None))
                .where(ParkingLot.longitude.is_not(None))
            )).scalars().all()
        )

        if not lots:
            print("No parking lots with coordinates found. Exiting.")
            return

        print(f"Found {len(buildings)} buildings and {len(lots)} lots.")
        print(f"Will compute {len(buildings) * len(lots)} distance pairs.\n")

        failed = []
        async with httpx.AsyncClient(timeout=30) as client:
            for building in buildings:
                try:
                    results = await fetch_walking_distances(building, lots, client)
                except httpx.HTTPStatusError as e:
                    print(f"  ERROR: {building.nickname}: Mapbox API returned {e.response.status_code}, skipping.")
                    failed.append(building.nickname)
                    continue
                except httpx.RequestError as e:
                    print(f"  ERROR: {building.nickname}: network error ({e}), skipping.")
                    failed.append(building.nickname)
                    continue

                for lot, distance_miles, duration_minutes in results:
                    stmt = insert(LotBuildingDistance).values(
                        lot_id=lot.id,
                        building_id=building.id,
                        distance_miles=distance_miles,
                        duration_minutes=duration_minutes,
                    )
                    stmt = stmt.on_conflict_do_update(
                        index_elements=["lot_id", "building_id"],
                        set_={
                            "distance_miles": stmt.excluded.distance_miles,
                            "duration_minutes": stmt.excluded.duration_minutes,
                        },
                    )
                    await session.execute(stmt)

                await session.commit()
                print(f"  {building.nickname}: saved {len(results)} distances")

                # Throttle to stay within Mapbox rate limits
                await asyncio.sleep(1)

        if failed:
            print(f"\nFailed buildings ({len(failed)}): {', '.join(failed)}")

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
