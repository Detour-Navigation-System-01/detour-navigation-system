/**
 * @fileoverview ナビゲーション中ページコンポーネント
 * @description ナビゲーション中の地図表示とカメラ画面遷移ボタンを表示するページ
 * @author 尾﨑諒
 * @created 2025-06-24
 * @updated 2025-07-10
 * @version 1.0.3
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigatingMap from '@/components/map/navigatingmap';
import NavigationBottomSheet from '@/components/navigation/NavigationBottomSheet';
import { fetcher } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

// ポップアップの種類
type PopupType = 'success' | 'error' | null;

interface PopupState {
  type: PopupType;
  message: string;
  isVisible: boolean;
}

// Loading コンポーネント
function NavigatingLoading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">ナビゲーション準備中...</p>
      </div>
    </div>
  );
}

export default function NavigatingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [popup, setPopup] = useState<PopupState>({
    type: null,
    message: '',
    isVisible: false,
  });

  // ナビゲーション画面ではpaddingを0にする
  useEffect(() => {
    document.body.style.paddingBottom = '0';
    return () => {
      // コンポーネントのアンマウント時にデフォルト値に戻す
      document.body.style.paddingBottom = '';
    };
  }, []);

  // 現在地取得をuseEffectで行う
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn(
        '⚠️ Geolocation APIはこのブラウザでサポートされていません。'
      );

      setPosition([35.681236, 139.767125]); // 東京駅（デフォルト）
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        console.log('✅ 現在地取得成功:', coords);
        setPosition(coords);
      },
      (err) => {
        console.error('❌ 位置情報取得に失敗:', {
          code: err.code,
          message: err.message,
        });
        setPosition([35.681236, 139.767125]); // 失敗時は東京駅
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // ポップアップを表示する関数
  const showPopup = (type: PopupType, message: string) => {
    setPopup({ type, message, isVisible: true });

    // 3秒後に自動で非表示
    setTimeout(() => {
      setPopup((prev) => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // ポップアップを閉じる関数
  const closePopup = () => {
    setPopup((prev) => ({ ...prev, isVisible: false }));
  };

  // 写真撮影機能
  const handleTakePhoto = () => {
    router.push('/camera');
  };

  // ピンを立てる機能
  const handleAddPin = async () => {
    // ログインチェック - 未ログインの場合は自動でログイン画面に遷移
    if (!user) {
      router.push('/login?redirect=/navigating');
      return;
    }

    if (!position) {
      showPopup(
        'error',
        '位置情報を取得中です。しばらくお待ちください。'
      );
      return;
    }

    const [lat, lng] = position;

    try {
      await fetcher('/api/places', {
        method: 'POST',
        body: JSON.stringify({ lat, lng }),
      });

      showPopup(
        'success',
        '現在地にピンを立てました！\n保存スポット一覧で確認できます。'
      );
      console.log('ピン立て成功:', { lat, lng });
    } catch (err: any) {
      console.error('ピン立て失敗:', err);
      showPopup(
        'error',
        'ピンの作成に失敗しました。もう一度お試しください。'
      );
    }
  };

  // ナビゲーション終了機能
  const handleExit = () => {
    router.push('/');
  };

  return (
    <>
      {/* ポップアップ */}
      {popup.isVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={closePopup}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '320px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              animation: 'popupFadeIn 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* アイコン */}
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}
            >
              {popup.type === 'success' ? '✅' : '❌'}
            </div>

            {/* メッセージ */}
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: popup.type === 'success' ? '#22c55e' : '#ef4444',
              }}
            >
              {popup.type === 'success'
                ? 'ピンを立てました！'
                : 'エラーが発生しました'}
            </h3>

            <p
              style={{
                margin: '0 0 20px 0',
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.4',
              }}
            >
              {popup.message}
            </p>

            {/* 閉じるボタン */}
            <button
              onClick={closePopup}
              style={{
                backgroundColor:
                  popup.type === 'success' ? '#22c55e' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={<NavigatingLoading />}>
        <NavigatingMap />
        <NavigationBottomSheet
          onTakePhoto={handleTakePhoto}
          onAddPin={handleAddPin}
          onExit={handleExit}
        />
      </Suspense>

      {/* CSS アニメーション */}
      <style jsx>{`
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}