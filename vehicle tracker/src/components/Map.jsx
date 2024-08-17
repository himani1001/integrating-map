import { useEffect, useRef, useState } from "react";
import leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useLocalStorage from "../hooks/useLocalStorage";
import useGeolocation from "../hooks/useGeolocation";
import carIcon from '../assets/car.png';
import './Map.css';

export default function Map() {
    const mapRef = useRef(null);
    const divRef = useRef(null);
    const vehicleMarkerRef = useRef(null);
    const [route, setRoute] = useState([]);
    const [vehiclePosition, setVehiclePosition] = useState({ latitude: 0, longitude: 0 });
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedConnection, setSelectedConnection] = useState('wireless');
    const [isBoxVisible, setIsBoxVisible] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [isPaused, setIsPaused] = useState(false);
    const [intervalId, setIntervalId] = useState(null);

    const [battery, setBattery] = useState(16);
    const [status, setStatus] = useState('STOPPED');
    const [distanceCovered, setDistanceCovered] = useState(834.89);

    const [userPosition, setUserPosition] = useLocalStorage('USER_MARKER', {
        latitude: 0,
        longitude: 0,
    });

    const location = useGeolocation();

    const vehiclePaths = {
        today: [
            [51.505, -0.09],
            [51.51, -0.1],
            [51.515, -0.12],
            [51.52, -0.14]
        ],
        yesterday: [
            [51.50, -0.08],
            [51.505, -0.09],
            [51.51, -0.1],
            [51.515, -0.12]
        ],
        lastWeek: [
            [51.51, -0.12],
            [51.515, -0.14],
            [51.52, -0.15],
            [51.525, -0.16]
        ],
        previousWeek: [
            [51.515, -0.14],
            [51.52, -0.15],
            [51.525, -0.16],
            [51.53, -0.17]
        ],
        thisMonth: [
            [51.505, -0.09],
            [51.51, -0.1],
            [51.515, -0.12],
            [51.52, -0.14]
        ],
        previousMonth: [
            [51.50, -0.08],
            [51.505, -0.09],
            [51.51, -0.1],
            [51.515, -0.12]
        ],
        custom: [
            [51.515, -0.15],
            [51.52, -0.16],
            [51.525, -0.17],
            [51.53, -0.18]
        ]
    };

    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = leaflet.map(divRef.current).setView([userPosition.latitude, userPosition.longitude], 13);

            leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(mapRef.current);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (location.latitude && location.longitude) {
            setUserPosition({ latitude: location.latitude, longitude: location.longitude });
            setVehiclePosition({ latitude: location.latitude, longitude: location.longitude });

            if (mapRef.current) {
                if (!vehicleMarkerRef.current) {
                    vehicleMarkerRef.current = leaflet.marker([location.latitude, location.longitude], {
                        icon: leaflet.icon({
                            iconUrl: carIcon,
                            iconSize: [38, 38],
                            iconAnchor: [19, 19],
                            popupAnchor: [0, -20]
                        })
                    }).addTo(mapRef.current);

                    vehicleMarkerRef.current.bindPopup(() => {
                        const currentDate = new Date();
                        return `
                            <strong>Vehicle 1</strong><br/>
                            Status: ${status}<br/>
                            Date: ${currentDate.toLocaleDateString()}<br/>
                            Time: ${currentDate.toLocaleTimeString()}<br/>
                            Location: ${vehiclePosition.latitude.toFixed(5)}, ${vehiclePosition.longitude.toFixed(5)}<br/>
                            Battery: ${battery}%<br/>
                            Distance Covered: ${distanceCovered} km
                        `;
                    });
                }
            }
        }
    }, [location, setUserPosition]);

    const startSimulation = () => {
        const selectedPath = vehiclePaths[selectedDate] || vehiclePaths.today;

        let index = 0;
        const newIntervalId = setInterval(() => {
            if (!isPaused) {
                const nextPosition = selectedPath[index];
                setVehiclePosition({ latitude: nextPosition[0], longitude: nextPosition[1] });

                vehicleMarkerRef.current.setLatLng(nextPosition);
                mapRef.current.setView(nextPosition);

                if (index > 0) {
                    const previousPosition = selectedPath[index - 1];
                    leaflet.polyline([previousPosition, nextPosition], { color: 'green' }).addTo(mapRef.current);
                }

                index = (index + 1) % selectedPath.length;
            }
        }, 2000 / speed);

        setIntervalId(newIntervalId);
    };

    const handleShowClick = () => {
        setIsBoxVisible(true);

        if (intervalId) clearInterval(intervalId);
        startSimulation();
    };

    const handlePauseClick = () => {
        setIsPaused((prev) => !prev);
    };

    const handleSpeedChange = (e) => {
        const newSpeed = Number(e.target.value);
        setSpeed(newSpeed);

        if (intervalId) clearInterval(intervalId);
        startSimulation();
    };

    return (
        <>
            <div id="map" ref={divRef} style={{ height: '90vh' }}></div>

            <div className="config-panel">
                <div className="config-options">
                    <label htmlFor="connectionType">Connection:</label>
                    <select
                        id="connectionType"
                        value={selectedConnection}
                        onChange={(e) => setSelectedConnection(e.target.value)}
                    >
                        <option value="wireless">WIRELESS</option>
                        <option value="wired">WIRED</option>
                        <option value="bluetooth">BLUETOOTH</option>
                    </select>

                    <label htmlFor="dateSelect">Date:</label>
                    <select
                        id="dateSelect"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="lastWeek">Last Week</option>
                        <option value="previousWeek">Previous Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="previousMonth">Previous Month</option>
                        <option value="custom">Custom</option>
                    </select>

                    <button className="show-btn" onClick={handleShowClick}>SHOW</button>
                </div>
            </div>

            {isBoxVisible && (
                <div className="control-box">
                    <div className="status-box">
                        <p>Status: {status}</p>
                        <p>Battery: {battery}%</p>
                        <p>Distance Covered: {distanceCovered} km</p>
                    </div>
                    <button onClick={handlePauseClick}>
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <label htmlFor="speed">Speed:</label>
                    <input
                        id="speed"
                        type="number"
                        min="1"
                        max="5"
                        value={speed}
                        onChange={handleSpeedChange}
                    />
                </div>
            )}
        </>
    );
}
