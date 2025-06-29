"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 型定義
interface Coordinate {
  lat: number;
  lon: number;
}

// カスタムアイコン作成
const createIcon = (iconUrl: string) =>
  L.icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

const startIcon = createIcon("/start-icon.png");
const endIcon = createIcon("/end-icon.png");
const currentIcon = createIcon("/current-location-icon.png"); // 現在地用

const NavigatingMap = () => {
  const searchParams = useSearchParams();
  const fromLat = parseFloat(searchParams.get("fromLat") || "35.681");
  const fromLon = parseFloat(searchParams.get("fromLon") || "139.767");
  const toLat = parseFloat(searchParams.get("toLat") || "35.689");
  const toLon = parseFloat(searchParams.get("toLon") || "139.691");

  const fromCoord: Coordinate = { lat: fromLat, lon: fromLon };
  const toCoord: Coordinate = { lat: toLat, lon: toLon };

  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [currentPosition, setCurrentPosition] = useState<Coordinate | null>(null);
  const mapRef = useRef<L.Map>(null);

  // ルート取得
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: fromCoord,
            goal: toCoord,
          }),
        });

        const data = await res.json();
        if (data.route) {
          setRouteCoords(data.route);
        }
      } catch (err) {
        console.error("ルート取得失敗:", err);
      }
    };

    fetchRoute();
  }, [fromLat, fromLon, toLat, toLon]);

  // 現在地取得 + 10秒ごと更新
  useEffect(() => {
    const updateCurrentPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const coord = { lat, lon };
          setCurrentPosition(coord);
          if (mapRef.current) {
            mapRef.current.setView([lat, lon]);
          }
        },
        (err) => {
          console.error("現在地取得エラー:", err);
        }
      );
    };

    updateCurrentPosition(); // 初回取得
    const intervalId = setInterval(updateCurrentPosition, 10000); // 10秒ごとに取得

    return () => clearInterval(intervalId); // クリーンアップ
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <MapContainer
        center={[fromLat, fromLon]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* 出発・到着マーカー */}
        <Marker position={[fromLat, fromLon]} icon={startIcon} />
        <Marker position={[toLat, toLon]} icon={endIcon} />

        {/* 経路 */}
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords.map((coord) => [coord.lat, coord.lon])}
            color="blue"
          />
        )}

        {/* 現在地マーカー */}
        {currentPosition && (
          <Marker
            position={[currentPosition.lat, currentPosition.lon]}
            icon={currentIcon}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default NavigatingMap;
