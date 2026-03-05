import httpx
from app.models import ParkingLot
from app.config import get_settings

#https://docs.mapbox.com/api/navigation/matrix/

settings = get_settings()

async def driving_distance_to_lots(latitude: float, longitude: float, lots: list[ParkingLot]) -> list[tuple[ParkingLot, float]]:
    coords = str(longitude) + ',' + str(latitude)  # User coord (long, lat order for Mapbox)

    for lot in lots:
        coords += ';' + str(lot.longitude) + ',' + str(lot.latitude)

    url = ("https://api.mapbox.com/directions-matrix/v1/mapbox/driving/" + coords + "?sources=0&annotations=distance,duration&access_token=" + settings.mapbox_access_token)
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()

    distances = data["distances"][0]
    durations = data["durations"][0]

    # Build (lot, distance_miles, duration_minutes) and sort by distance
    lotData = []
    for i, lot in enumerate(lots):
        dist_miles = distances[i + 1] / 1609.34  # i + 1 since first element is source-to-source (0)
        dur_minutes = durations[i + 1] / 60.0  # seconds -> minutes
        lotData.append((lot, dist_miles, dur_minutes))

    lotData.sort(key=lambda x: x[1])
    return [(lot, dur) for lot, _, dur in lotData]