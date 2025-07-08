/**
 * @fileoverview カメラビュー
 * @description お気に入りスポットの保存用カメラ画面
 * @author 平野
 * @created 2025-06-17
 * @updated 2025-07-07
 * @version 1.6.0
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { fetcher, API_BASE } from '@/lib/api';

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await res.json();
  return data.display_name || '不明な場所';
}

interface PopupProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error';
}

const StylishPopup: React.FC<PopupProps> = ({ isVisible, onClose, title, message, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="popup" style={{ background: 'white', borderRadius: '8px', padding: '24px', minWidth: '320px', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>{title}</h2>
        <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '20px', lineHeight: '1.5' }}>{message}</p>
        <button onClick={onClose} style={{ background: type === 'success' ? '#22c55e' : '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>OK</button>
      </div>
    </div>
  );
};

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const { user } = useAuth();
  const router = useRouter();

  const [popup, setPopup] = useState({
    isVisible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('📵 カメラ取得失敗:', err);
      setPopup({
        isVisible: true,
        title: 'カメラアクセスエラー',
        message: 'カメラの利用が許可されていません。ナビ画面に戻ります。',
        type: 'error',
      });

      router.push('/navigating');

    }
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

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
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error('位置情報取得失敗:', err)
    );
    stopCamera(); // カメラ停止
  };

  const discardPhoto = () => {
    setPhotoDataUrl(null);
    startCamera(); // カメラ再起動
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

      const address = await reverseGeocode(location.lat, location.lng);

      await fetcher('/api/places', {
        method: 'POST',
        body: JSON.stringify({
          name: `自動保存地点-${Date.now()}`,
          description: 'カメラで撮影されたスポット',
          category: 'spot',
          address,
          prefecture: '不明',
          lat: location.lat,
          lng: location.lng,
          image_url: imageUrl,
        }),
      });

      setPopup({
        isVisible: true,
        title: '保存完了！',
        message: '写真とスポット情報が正常に保存されました。',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/navigating');
      }, 3000);
    } catch (err) {
      console.error('送信エラー:', err);
      setPopup({
        isVisible: true,
        title: '送信失敗',
        message: '写真の送信に失敗しました。もう一度お試しください。',
        type: 'error',
      });
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
    {/* カメラ起動中（撮影前）の表示 */}
    {!photoDataUrl && (
      <>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* 撮影 & 戻るボタンを横並びにする */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => router.push('/navigating')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ccc',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ← 戻る
          </button>

          <button
            onClick={takePhoto}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007b5f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            📸 写真を撮る
          </button>

          <button
            onClick={() =>
              setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
            }
            style={{
              padding: '10px 20px',
              backgroundColor: '#888',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            🔄 カメラ切替
          </button>
        </div>
      </>
    )}


      {photoDataUrl && (
        <>
          <img src={photoDataUrl} alt="撮影写真" style={{ width: '100%', marginTop: '16px' }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
            <button onClick={uploadPhoto}>⬆ サーバに送信</button>
            <button onClick={discardPhoto}>🗑 撮り直す</button>
          </div>
        </>
      )}

      <StylishPopup
        isVisible={popup.isVisible}
        onClose={() => setPopup((prev) => ({ ...prev, isVisible: false }))}
        title={popup.title}
        message={popup.message}
        type={popup.type}
      />
    </div>
  );
}
