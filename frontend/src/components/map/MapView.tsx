/**
 * @fileoverview 地図表示コンポーネント
 * @description Leafletを使用して現在地を中心にマップを表示し、カスタムアイコンのマーカーを設置するコンポーネント
 * @author 尾﨑諒
 * @created 2025/07/03
 * @updated 2025/07/03
 * @version 1.0.0
 */

"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

// 扇形（視野コーン）を計算する関数
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

export default function MapView() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("⚠️ Geolocation APIはこのブラウザでサポートされていません。");
      setPosition([35.681236, 139.767125]); // 東京駅（デフォルト）
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        console.log("✅ 現在地取得成功:", coords);
        setPosition(coords);
      },
      (err) => {
        console.error("❌ 位置情報取得に失敗:", {
          code: err.code,
          message: err.message,
        });
        setPosition([35.681236, 139.767125]);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // デバイス向き取得
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setHeading(event.alpha); // alphaは0~360度（北基準時計回り）
      }
    };

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
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

  if (!position) {
    return <p className="p-4">現在地を取得中...</p>;
  }

  return (
    <MapContainer center={position} zoom={16} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={currentLocationIcon}>
        <Popup>現在地</Popup>
      </Marker>

      {/* headingが有効なら扇形表示 */}
      {typeof heading === "number" && !isNaN(heading) && (
        <Polygon
          positions={generateViewCone(position, heading)}
          pathOptions={{ color: "#2563eb", fillOpacity: 0.3 }}
        />
      )}
    </MapContainer>
  );
}
