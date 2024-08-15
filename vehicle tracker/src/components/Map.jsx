import { useEffect, useRef } from "react";
import leaflet from 'leaflet';
import useLocalStorage from "../hooks/useLocalStorage";
import useGeolocation from "../hooks/useGeolocation";

export default function Map() {
    const mapRef = useRef(null);
    const divRef = useRef(null);
    const userMarker = useRef(null);

    const [userPosition, setUserPosition] = useLocalStorage('USER_MARKER', {
        latitude: 0,
        longitude: 0,
    });

    const location = useGeolocation();

    useEffect(() => {
        if (!mapRef.current) {
            // Initialize the map only if it hasn't been initialized
            mapRef.current = leaflet.map(divRef.current).setView([userPosition.latitude, userPosition.longitude], 13);

            leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(mapRef.current);
        }

        // Cleanup function
        return () => {
            if (mapRef.current) {
                mapRef.current.remove(); // Remove the map instance when the component is unmounted
                mapRef.current = null;   // Reset the ref to prevent reuse
            }
        };
    }, []);

    useEffect(() => {
        if (location.latitude && location.longitude) {
            setUserPosition({ latitude: location.latitude, longitude: location.longitude });

            if (mapRef.current) {
                // If there is already a marker, remove it before adding a new one
                if (userMarker.current) {
                    mapRef.current.removeLayer(userMarker.current);
                }

                // Add a new marker to the map at the user's position
                userMarker.current = leaflet.marker([location.latitude, location.longitude]).addTo(mapRef.current);

                mapRef.current.setView([location.latitude, location.longitude]);
            }
        }
    }, [location, setUserPosition]);

    return <div id="map" ref={divRef} style={{ height: '100vh' }}></div>;
}
