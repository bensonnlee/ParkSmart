import { useEffect, useRef} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// https://docs.mapbox.com/mapbox-gl-js/api/map/ 
//Adapt format to React and not JS format

//Tutorial to use with React: https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/?step=0

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface ParkingLot {
    id: string;
    name: string;
    address: string;
    free_spaces: number;
    total_spaces: number;
    latitude: number;
    longitude: number;
}

interface MapboxProps {
    lots: ParkingLot[];
    onLotClick: (lot: ParkingLot) => void;
    center?: [number, number];
    zoom?: number;
}

export function MapboxMap({
    lots,
    onLotClick, 
    center = [0, 0],
    zoom = 5
}: MapboxProps) {
    const mapRef = useRef<HTMLDivElement>(null); //Used to pass map container reference built with React to Mapbox (React uses virtual DOM but Mapbox GL uses JS and it needs physical DOM)
    const mapInstance = useRef<mapboxgl.Map | null>(null); //Stores Mapbox map
    const markers = useRef<mapboxgl.Marker[]>([]); //Used to mark 8 parking lots on map

    //Create map 
    useEffect(() => {
        mapInstance.current = new mapboxgl.Map({
            container: mapRef.current!,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: center,
            zoom: zoom,
        });

        //Add zoom in/zoom out buttons top right 
        const nav = new mapboxgl.NavigationControl();
        mapInstance.current.addControl(nav, 'top-right'); 
    }, []); //Empty array means useEffect only runs once component mounts

    //Update markers when actual parking lot data changes (free spaces/taken spaces, etc.)
    useEffect(() => {
        markers.current.forEach(marker => marker.remove()); //Remove existing markers and readd them later with new updated data
        markers.current = []; //Clear marker array

        //Readd markers for each lot here
        lots.forEach(lot => {
            const marker = new mapboxgl.Marker()
                .setLngLat([lot.longitude, lot.latitude])
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(`${lot.name}\n${lot.address}\nFree spaces: ${lot.free_spaces}/${lot.total_spaces}`)) //Popup with lot info
                .addTo(mapInstance.current!);
        
            marker.getElement().addEventListener('click', () => onLotClick(lot)); //Add click event to marker to call onLotClick with lot data
            markers.current.push(marker); //Add marker to array for future reference
        });
    }, [lots, onLotClick]); //Run this effect whenever lots data or onLotClick function changes

    return <div ref={mapRef} className="w-full h-full" style={{ height: "100%" }} />; //Map container
}