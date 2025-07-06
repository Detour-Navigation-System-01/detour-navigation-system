/**
 * @fileoverview カメラビュー
 * @description お気に入りスポットの保存用カメラ画面
 * @author 平野
 * @created 2025-06-17
 * @updated 2025-07-05
 * @version 1.4.0
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ✅ 追加
import { useAuth } from '@/lib/AuthContext';
import { fetcher, API_BASE } from '@/lib/api';

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
  const data = await res.json();
  return data.display_name || '不明な場所';
}

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();
  const router = useRouter(); // ✅ 追加

  useEffect(() => {
    if (!navigator.mediaDevices || !videoRef.current) return;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error('カメラ取得失敗:', err));
  }, []);

  const takePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotoDataUrl(dataUrl);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.error('位置情報取得失敗:', err);
      }
    );
  };

 const uploadPhoto = async () => {
  if (!photoDataUrl || !location || !user) return;

  try {
    const blob = await (await fetch(photoDataUrl)).blob();
    const formData = new FormData();
    formData.append('image', blob, 'photo.jpg');

    const token = localStorage.getItem('jwt_token');

    const uploadRes = await fetch(`${API_BASE}/api/places/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(errorText);
    }

    const { data } = await uploadRes.json();
    const imageUrl = data.imageUrl;

    // ✅ ここで住所を取得
    const address = await reverseGeocode(location.lat, location.lng);

    // ✅ サーバに投稿
    await fetcher('/api/places', {
      method: 'POST',
      body: JSON.stringify({
        name: `自動保存地点-${Date.now()}`,
        description: 'カメラで撮影されたスポット',
        category: 'spot',
        address, // ← ここで取得した住所を使う
        prefecture: '不明',
        lat: location.lat,
        lng: location.lng,
        image_url: imageUrl,
      }),
    });

    alert('保存に成功しました！');
    router.push('/navigating');
  } catch (err) {
    console.error('送信エラー:', err);
    alert('送信に失敗しました');
  }
};


  return (
    <div style={{ textAlign: 'center' }}>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button onClick={takePhoto} style={{ marginTop: '16px' }}>📸 写真を撮る</button>
      {photoDataUrl && (
        <>
          <img src={photoDataUrl} alt="撮影写真" style={{ width: '100%', marginTop: '16px' }} />
          <button onClick={uploadPhoto} style={{ marginTop: '12px' }}>⬆ サーバに送信</button>
        </>
      )}
    </div>
  );
}
