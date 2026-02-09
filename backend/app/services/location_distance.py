import math

#This is used for calculating location distance between user location and nearest parking lot with Haversine's algorithm

#https://www.movable-type.co.uk/scripts/latlong.html

def haversine_algorithm(lat1: float, long1: float, lat2: float, long2: float) -> float:
    lat1 = math.radians(lat1)
    long1 = math.radians(long1)
    lat2 = math.radians(lat2)
    long2 = math.radians(long2)

    RADIUS = 3959 #r
    a = math.sin( (lat2 - lat1) / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin( (long2 - long1) / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return RADIUS * c

if __name__ == "__main__":
    distance = haversine_algorithm(34.0689, -118.4452, 34.0224, -118.2851) #Should return 9.71 miles; change later when I have UCR location database and parking lot database 
    print(f"{distance:.2f} miles") 
