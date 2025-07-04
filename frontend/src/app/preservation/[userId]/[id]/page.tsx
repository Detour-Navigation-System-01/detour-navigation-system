/**
 * @fileoverview 保存スポット詳細画面（画像 + 地図表示）
 * @description URLパラメータから保存スポットのIDを取得し、対応する画像を表示。
 *              また、ブラウザの位置情報APIを使用して現在地を取得し、Leafletを用いた地図にマーカー表示。
 * @author 赤津
 * @created 2025-06-10
 * @updated 2025-07-04
 * @version 2.2.3
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Position {
  lat: number;
  lng: number;
}

export default function PreservationDetail() {
  const params = useParams();
  const id = Number(params?.id);
  const [position, setPosition] = useState<Position>({
    lat: 35.6812, // 東京駅を仮の現在地として使用
    lng: 139.7671,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.log('位置情報の取得に失敗しました:', err);
        }
      );
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '12px' }}>
        保存スポット詳細（ID: {id}）
      </h1>

      <Image
        src={`/images/test${id}.jpg`}
        alt={`保存スポット${id}`}
        width={300}
        height={300}
        style={{
          objectFit: 'cover',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      />

      <div style={{ height: '300px', width: '100%' }}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[position.lat, position.lng]}>
            <Popup>現在地</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
