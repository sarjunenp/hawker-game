// src/components/MapGuess.js
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// custom pin icon
const pinIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapClickHandler({ onClick }) {
  // hook to capture map clicks
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

export default function MapGuess({ onGuess }) {
  const [position, setPosition] = useState(null);

  const handleClick = (latlng) => {
    setPosition([latlng.lat, latlng.lng]);
    onGuess({ lat: latlng.lat, lng: latlng.lng });
  };

  return (
    <div style={{ height: "500px", width: "100%", borderRadius: "10px", overflow: "hidden" }}>
      <MapContainer
        center={[1.3521, 103.8198]} // Singapore
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={handleClick} />
        {position && (
          <>
            <Marker position={position} icon={pinIcon} />
            <Circle center={position} radius={150} color="#ff914d" />
          </>
        )}
      </MapContainer>
    </div>
  );
}
