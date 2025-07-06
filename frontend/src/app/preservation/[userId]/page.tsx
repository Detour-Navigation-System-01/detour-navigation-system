/**
 * @fileoverview 保存スポット詳細画面（[userId]構造対応版）
 * @description クエリパラメータから受け取ったスポットデータを表示し、
 *              実際の画像と地図でスポット位置を表示する詳細ビュー。
 * @author 赤津
 * @created 2025-06-10
 * @updated 2025-07-04
 * @version 3.0.0
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// スポットデータの型定義
interface SpotData {
  id: number;
  name: string;
  description: string;
  category: string;
  address: string;
  prefecture: string;
  lat: number;
  lng: number;
  image_url: string;
  created_at: string;
}

interface Position {
  lat: number;
  lng: number;
}

export default function PreservationDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = params?.userId;
  const [spotData, setSpotData] = useState<SpotData | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Position>({
    lat: 35.6812,
    lng: 139.7671,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');

    if (dataParam) {
      try {
        const parsedData = JSON.parse(dataParam);
        setSpotData(parsedData);
      } catch (err) {
        setError('スポットデータの取得に失敗しました');
      }
    } else {
      setError('スポットデータが見つかりません');
    }
  }, [searchParams]);

  const handleBack = () => {
    router.back();
  };

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>エラー</h1>
        <p>{error}</p>
        <button onClick={handleBack}>戻る</button>
      </div>
    );
  }

  if (!spotData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={handleBack}
        style={{
          padding: '10px 16px',
          backgroundColor: '#85b8a3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        ← 戻る
      </button>

      {spotData.image_url && (
        <img
          src={spotData.image_url}
          alt={spotData.name}
          style={{ width: '100%', maxHeight: '100%', objectFit: 'cover' }}
        />
      )}

      <p>📍 {spotData.address}</p>
    </div>
  );
}
