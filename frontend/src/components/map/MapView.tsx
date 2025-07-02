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
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// カスタムアイコンの定義（public フォルダの画像を明示的に指定）
const customIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapView() {
  const [position, setPosition] = useState<[number, number] | null>(null);

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

  if (!position) {
    return <p className="p-4">現在地を取得中...</p>;
  }

  return (
    <MapContainer center={position} zoom={16} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={customIcon}>
        <Popup>現在地</Popup>
      </Marker>
    </MapContainer>
  );
}
