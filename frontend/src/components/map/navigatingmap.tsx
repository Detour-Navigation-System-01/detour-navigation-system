"use client";
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface Step {
  sequence: number;
  instruction: string;
  distance: number;
  duration: number;
  start_lat: number;
  start_lng: number;
  maneuver: string;
}

// 現在地マーカー用のアイコン（青い丸）
const currentLocationIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#2563eb" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" stroke="white" stroke-width="2" fill="#2563eb" />
      </svg>
    `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NavigatingPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [center, setCenter] = useState<[number, number]>([35.681236, 139.767125]); // 東京駅
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [nearbyMessage, setNearbyMessage] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const getMapSettings = () => {
    if (!fromCoord || !toCoord) {
      return { center: [35.681236, 139.767125] as [number, number], zoom: 13 };
    }
    
    // 中点を計算
    const centerLat = (fromCoord.lat + toCoord.lat) / 2;
    const centerLon = (fromCoord.lon + toCoord.lon) / 2;
    
    // 2点間の距離を計算してズームレベルを決定
    const latDiff = Math.abs(fromCoord.lat - toCoord.lat);
    const lonDiff = Math.abs(fromCoord.lon - toCoord.lon);
    
    const maxDiff = Math.max(latDiff, lonDiff);
    let zoom = 15;
    
    if (maxDiff > 2) zoom = 7;
    else if (maxDiff > 1) zoom = 8;
    else if (maxDiff > 0.5) zoom = 9;
    else if (maxDiff > 0.2) zoom = 10;
    else if (maxDiff > 0.1) zoom = 11;
    else if (maxDiff > 0.05) zoom = 12;
    else if (maxDiff > 0.02) zoom = 13;
    else if (maxDiff > 0.01) zoom = 14;
    
    console.log(`🗺️ マップ設定: 中心点(${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}), ズーム: ${zoom}`);
    
    return { center: [centerLat, centerLon] as [number, number], zoom };
  };
  

  useEffect(() => {
    const stored = sessionStorage.getItem("routeSteps");
    if (stored) {
      const parsed: Step[] = JSON.parse(stored);
      setSteps(parsed);

      const coords = parsed.map((s) => [s.start_lat, s.start_lng] as [number, number]);
      setRouteCoords(coords);

      if (coords.length > 0) {
        const avgLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
        setCenter([avgLat, avgLng]);
      }
    }
  }, []);

  useEffect(() => {
    const storedSteps = sessionStorage.getItem("routeSteps");
    const storedCoords = sessionStorage.getItem("routeCoordinates");

    if (storedSteps) {
      const parsedSteps: Step[] = JSON.parse(storedSteps);
      setSteps(parsedSteps);
    }

    if (storedCoords) {
      const parsedCoords: [number, number][] = JSON.parse(storedCoords);
      setRouteCoords(parsedCoords);

      if (parsedCoords.length > 0) {
        const avgLat = parsedCoords.reduce((sum, c) => sum + c[0], 0) / parsedCoords.length;
        const avgLng = parsedCoords.reduce((sum, c) => sum + c[1], 0) / parsedCoords.length;
        setCenter([avgLat, avgLng]);
      }
    }
  }, []);


  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("位置情報はこのブラウザでサポートされていません");
      return;
    }

    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCurrentPosition(coords);
          console.log(`📍 現在地更新: lat=${coords[0].toFixed(6)}, lon=${coords[1].toFixed(6)} (${new Date().toLocaleTimeString()})`);

          // 次のステップとの距離を確認
          if (steps.length > 0) {
            const nextStep = steps[0]; // とりあえず1番目だけ確認
            const distance = getDistanceMeters(coords[0], coords[1], nextStep.start_lat, nextStep.start_lng);
            if (distance < 10) {
              setNearbyMessage(`「${nextStep.instruction}」が近くにあります`);
            } else {
              setNearbyMessage(null);
            }
          }
        },
        (err) => {
          console.error("位置情報の取得に失敗しました:", err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    };

    updatePosition();
    const intervalId = setInterval(updatePosition, 10000);

    return () => {
      clearInterval(intervalId);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [steps]);

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">

      {nearbyMessage && (
        <div className="p-3 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-center font-medium shadow">
          {nearbyMessage}
        </div>
      )}

      {steps.length === 0 ? (
        <p>案内データが見つかりませんでした。</p>
      ) : (
        <>
          <div style={{ height: 400, width: "100%" }}>
            <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {routeCoords.length > 0 && (
                <Polyline positions={routeCoords} color="#2563eb" weight={5} opacity={0.7} />
              )}
              {currentPosition && (
                <Marker position={currentPosition} icon={currentLocationIcon}>
                  <Popup>現在地</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          <ol className="space-y-4">
            {steps.map((step, idx) => (
              <li key={idx} className="p-4 border rounded-lg shadow-sm bg-white">
                <p className="font-semibold text-gray-800">
                  {step.sequence}. {step.instruction}
                </p>
                <p className="text-sm text-gray-600">
                  {step.distance.toFixed(1)}m / {Math.round(step.duration)}秒
                </p>
                <p className="text-xs text-gray-400">
                  緯度: {step.start_lat}, 経度: {step.start_lng}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
