"use client";
import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  CircleMarker,
  Polygon,
} from "react-leaflet";
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

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateViewCone(
  center: [number, number],
  heading: number,
  range: number = 50,
  angle: number = 60
): [number, number][] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat = center[0];
  const lon = center[1];
  const R = 6371000; // 地球半径[m]

  const points: [number, number][] = [center];

  for (let a = -angle / 2; a <= angle / 2; a += angle) {
    const θ = toRad(heading + a);
    const dx = range * Math.sin(θ);
    const dy = range * Math.cos(θ);

    const dLat = (dy / R) * (180 / Math.PI);
    const dLon = (dx / (R * Math.cos(toRad(lat)))) * (180 / Math.PI);

    points.push([lat + dLat, lon + dLon]);
  }
  return points;
}

export default function NavigatingPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [center, setCenter] = useState<[number, number]>([35.681236, 139.767125]); // 東京駅
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(
    null
  );
  const [nearbyMessage, setNearbyMessage] = useState<string | null>(null);
  const [heading, setHeading] = useState<number | null>(null); // 初期値nullに変更

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const storedSteps = sessionStorage.getItem("routeSteps");
    const storedCoords = sessionStorage.getItem("routeCoordinates");

    if (storedSteps) {
      const parsedSteps: Step[] = JSON.parse(storedSteps);
      setSteps(parsedSteps);

      if (parsedSteps.length > 0) {
        setCenter([parsedSteps[0].start_lat, parsedSteps[0].start_lng]);
      }
    }

    if (storedCoords) {
      const parsedCoords: [number, number][] = JSON.parse(storedCoords);
      setRouteCoords(parsedCoords);

      if (parsedCoords.length > 0 && !storedSteps) {
        const avgLat =
          parsedCoords.reduce((sum, c) => sum + c[0], 0) / parsedCoords.length;
        const avgLng =
          parsedCoords.reduce((sum, c) => sum + c[1], 0) / parsedCoords.length;
        setCenter([avgLat, avgLng]);
      }
    }
  }, []);

  // 端末の向き取得
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // alphaは0〜360度。北を基準に時計回り
        setHeading(event.alpha);
      }
    };

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      // iOS向け許可取得
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === "granted") {
            window.addEventListener("deviceorientation", handleOrientation, true);
          }
        })
        .catch(() => {
          console.log("Device orientation permission denied or unsupported.");
        });
    } else if ("DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    } else {
      console.log("DeviceOrientationEvent is not supported on this device/browser.");
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // 現在地取得（10秒毎）
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("位置情報はこのブラウザでサポートされていません");
      return;
    }

    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setCurrentPosition(coords);
          console.log(
            `📍 現在地更新: lat=${coords[0].toFixed(
              6
            )}, lon=${coords[1].toFixed(6)} (${new Date().toLocaleTimeString()})`
          );

          if (steps.length > 0) {
            const nextStep = steps[0];
            const distance = getDistanceMeters(
              coords[0],
              coords[1],
              nextStep.start_lat,
              nextStep.start_lng
            );
            if (distance < 100) {
              setNearbyMessage(`${nextStep.instruction}`);
              console.log("案内表示");
            } else {
              setNearbyMessage(null);
              console.log("案内非表示");
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
      {steps.length === 0 ? (
        <p>案内データが見つかりませんでした。</p>
      ) : (
        <>
          <div style={{ height: "763px", width: "100%" }}>
            <MapContainer
              center={center}
              zoom={17}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {routeCoords.length > 0 && (
                <Polyline
                  positions={routeCoords}
                  color="#2563eb"
                  weight={5}
                  opacity={0.7}
                />
              )}

              {currentPosition && (
                <>
                  <Marker position={currentPosition} icon={currentLocationIcon}>
                    <Popup>現在地</Popup>
                  </Marker>

                  <CircleMarker
                    center={currentPosition}
                    radius={8}
                    pathOptions={{
                      color: "#2563eb",
                      fillColor: "#2563eb",
                      fillOpacity: 1,
                    }}
                  />

                  {typeof heading === "number" && !isNaN(heading) && (
                    <Polygon
                      positions={generateViewCone(currentPosition, heading)}
                      pathOptions={{ color: "#2563eb", fillOpacity: 0.3 }}
                    />
                  )}
                </>
              )}
            </MapContainer>

            {nearbyMessage && (
              <div
                style={{
                  position: "absolute",
                  top: "30px",
                  left: "55%",
                  transform: "translateX(-50%)",
                  width: "80vw",
                  height: "10vh",
                  minHeight: "48px",
                  fontSize: "1.5rem",
                  backgroundColor: "#003300",
                  color: "white",
                  padding: "0",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  fontWeight: "bold",
                  display: "flex",
                  maxWidth: "90%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {nearbyMessage}
              </div>
            )}
          </div>

          <ol className="space-y-4">
            {steps.map((step, idx) => (
              <li
                key={idx}
                className="p-4 border rounded-lg shadow-sm bg-white"
              >
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
