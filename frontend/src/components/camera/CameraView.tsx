'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { fetcher, API_BASE } from '@/lib/api';

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await res.json();
  return data.display_name || '不明な場所';
}

// 統一感のあるポップアップコンポーネント
interface PopupProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error';
}

const StylishPopup: React.FC<PopupProps> = ({
  isVisible,
  onClose,
  title,
  message,
  type = 'success',
}) => {
  useEffect(() => {
    if (isVisible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="popup-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="popup"
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e2e8f0',
          animation: 'slideIn 0.2s ease-out',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a202c',
            marginBottom: '8px',
            margin: '0 0 8px 0',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: '#4a5568',
            marginBottom: '20px',
            lineHeight: '1.5',
            margin: '0 0 20px 0',
          }}
        >
          {message}
        </p>

        <button
          onClick={onClose}
          style={{
            background: '#3182ce',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            minWidth: '60px',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#2c5aa0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#3182ce';
          }}
        >
          OK
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 480px) {
          .popup {
            margin: 20px !important;
            padding: 20px !important;
            min-width: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const { user } = useAuth();
  const router = useRouter();

  // ポップアップの状態管理
  const [popup, setPopup] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isVisible: false,
    title: '',
    message: '',
    type: 'success',
  });

  useEffect(() => {
    if (!navigator.mediaDevices || !videoRef.current) return;

    navigator.mediaDevices
      .getUserMedia({ video: true })
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

      // 成功時のポップアップを表示
      setPopup({
        isVisible: true,
        title: '保存完了！',
        message: '写真とスポット情報がサーバーに正常に保存されました。',
        type: 'success',
      });

      // 3秒後に自動的にナビゲーションページへ遷移
      setTimeout(() => {
        router.push('/navigating');
      }, 3000);
    } catch (err) {
      console.error('送信エラー:', err);

      // エラー時のポップアップを表示
      setPopup({
        isVisible: true,
        title: '送信失敗',
        message: '写真の送信に失敗しました。もう一度お試しください。',
        type: 'error',
      });
    }
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button onClick={takePhoto} style={{ marginTop: '16px' }}>
        📸 写真を撮る
      </button>
      {photoDataUrl && (
        <>
          <img
            src={photoDataUrl}
            alt="撮影写真"
            style={{ width: '100%', marginTop: '16px' }}
          />
          <button onClick={uploadPhoto} style={{ marginTop: '12px' }}>
            ⬆ サーバに送信
          </button>
        </>
      )}

      {/* おしゃれなポップアップ */}
      <StylishPopup
        isVisible={popup.isVisible}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        type={popup.type}
      />
    </div>
  );
}
