import httpx
from app.models import Classroom, ParkingLot
from app.config import get_settings

#https://docs.mapbox.com/api/navigation/matrix/

settings = get_settings()

#Uses user location and parking lot locations to calculate driving distance and duration to each lot 
#DO sorting in sort lots by distance
async def driving_distance_to_lots(classroom: Classroom, lots: list[ParkingLot]) -> list[tuple[ParkingLot, float, float]]: #Assume user is going to the closest parking lot (and not changing to second or third closest lot)
    coords = str(classroom.building.longitude) + ',' + str(classroom.building.latitude) #Classroom coord (long, lat order for Mapbox) 

    for lot in lots: #Add all parking lot coords to one string to send to mapbox API (specific format)
        coords += ';' + str(lot.longitude) + ',' + str(lot.latitude)

    #Set up mapbox call; set to driving profile for now
    url = ("https://api.mapbox.com/directions-matrix/v1/mapbox/driving/" + coords + "?sources=0&annotations=distance,duration&access_token=" + settings.mapbox_access_token)

    #Taken from services/collector.py and changed (just handles requests async so other requests can be handled too)
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json() #Mapbox returns 2D array in row-major order (for distance and durations specifically)

    #Only one source or classroom and calculates to each lot so 2D array only contains one array inside which is just the distances/duration so take it out for easier indexing
    durations = data["durations"][0]
    distances = data["distances"][0]

    #Convert units (Mapbox returns distance in meters, duration in seconds) to miles and minutes 
    lotData = []
    for i, lot in enumerate(lots):
        distanceMiles = distances[i + 1] / 1609.34 #i + 1 since first element is 0 for both distance and duration (calculates classroom to same classroom or 0)
        durationMinutes = round(durations[i + 1] / 60, 2) 
        lotData.append((lot, distanceMiles, durationMinutes))
    return lotData #Return list of tuples with lot, distance, and duration
