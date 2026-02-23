import httpx
from app.models import ParkingLot
from app.config import get_settings

#https://docs.mapbox.com/api/navigation/matrix/

settings = get_settings()

async def driving_distance_to_lots(latitude:float, longitude:float, lots: list[ParkingLot]) -> list[ParkingLot]:
    coords = str(longitude) + ',' + str(latitude) #Classroom coord (long, lat order for Mapbox)

    for lot in lots: #Add all parking lot coords to one string to send to mapbox API (specific format)
        coords += ';' + str(lot.longitude) + ',' + str(lot.latitude)

    #Set up mapbox call
    url = ("https://api.mapbox.com/directions-matrix/v1/mapbox/driving/" + coords + "?sources=0&annotations=distance,duration&access_token=" + settings.mapbox_access_token)
    #Taken from services/collector.py and changed (just handles requests async so other requests can be handled too)
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json() #Mapbox returns 2D array in row-major order (for distance specifically)

    #Only one source or classroom and calculates to each lot so 2D array only contains one array inside which is just the distance so take it out for easier indexing
    distance = data["distances"][0]

    #Convert units from meters to miles
    lotData = []
    for i, lot in enumerate(lots):
        distanceMiles = distance[i + 1] / 1609.34 #i + 1 since first element is 0 
        lotData.append((lot, distanceMiles))

    lotData.sort(key=lambda x: x[1]) #Sort by distance and only return lots in sorted order
    return [lot for lot, _ in lotData]