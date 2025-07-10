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

      setTimeout(() => {
        router.push('/navigating');
      }, 2000);

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
    <div style={{ textAlign: 'center', position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!photoDataUrl && (
        <>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'calc(100% - 64px)', objectFit: 'cover' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '16px',
          backgroundColor: 'rgb(0, 0, 0)',
          height: '64px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: '220px' // ← 横幅を広げた
          }}>
            {/* ← 🆕 戻るボタン */}
            <button 
              onClick={() => router.push('/navigating')}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                position: 'absolute',
                left: '-20px',
                bottom: '10px',
                zIndex: 3
              }}
            >
              <img src="/back.svg" alt="戻る" width={20} height={20} style={{ filter: 'invert(100%)' }} />
            </button>

            {/* 撮影ボタン */}
            <button 
              onClick={takePhoto} 
              style={{ 
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: '4px solid white',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxSizing: 'border-box',
                minWidth: '70px',
                minHeight: '70px',
                maxWidth: '70px',
                maxHeight: '70px',
                padding: 0
              }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                border: '2px solid #222',
                backgroundColor: 'transparent',
                boxSizing: 'border-box',
              }}/>
            </button>

            {/* カメラ切替ボタン */}
            <button 
              onClick={() => setFacingMode((prev) => prev === 'user' ? 'environment' : 'user')}
              style={{ 
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                position: 'absolute',
                right: '-20px',
                bottom: '10px',
                zIndex: 3
              }}
            >
              <img src="/repeat.svg" alt="カメラ切替" width={24} height={24} style={{ filter: 'invert(100%)' }} />
            </button>
          </div>
        </div>

        </>
      )}

      {photoDataUrl && (
        <>
          <img src={photoDataUrl} alt="撮影写真" style={{ width: '100%', height: 'calc(100% - 64px)', objectFit: 'cover' }} />
          <div style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            padding: '16px',
            backgroundColor: 'rgb(0, 0, 0)',
            backdropFilter: 'blur(5px)',
            height: '64px'
          }}>
            <button 
              onClick={discardPhoto}
              style={{ 
                padding: '12px 24px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: '#6b7280',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgb(0, 0, 0)'
              }}
            >
              🗑 撮り直す
            </button>
            <button 
              onClick={uploadPhoto}
              style={{ 
                padding: '12px 24px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: '#10b981',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgb(0, 0, 0)'
              }}
            >
              ⬆ 保存する
            </button>
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
