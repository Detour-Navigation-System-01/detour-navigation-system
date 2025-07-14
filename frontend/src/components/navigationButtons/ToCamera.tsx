
/**
 * @fileoverview カメラ画面に遷移するため、お気に入り保存するためのボタンコンポーネント
 * @description カメラ画面の遷移や現在地の取得、お気に入りスポットをバックエンドに送信する機能を提供します。
 * @author 尾﨑諒
 * @created 2025-06-28
 * @updated 2025-07-04
 * @version 4.0.3
 */
"use client";


import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/api';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/AuthContext'; // 追加

// ポップアップの種類
type PopupType = 'success' | 'error' | null;

interface PopupState {
  type: PopupType;
  message: string;
  isVisible: boolean;
}

export default function ToCamera() {
  const router = useRouter();
  const { user } = useAuth(); // 追加
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [popup, setPopup] = useState<PopupState>({
    type: null,
    message: '',
    isVisible: false,
  });

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

      {/* カメラボタン */}
      <button
        style={{
          position: 'absolute',
          top: '80vh',
          left: '24%',
          width: '34vw',
          height: '6vh',
          minHeight: '40px',
          fontSize: '1.0rem',
          fontWeight: 500,
          color: 'white',
          backgroundColor: '#003300',
          borderTopLeftRadius: '50px',
          borderBottomLeftRadius: '50px',
          border: 'none',
          transition: 'transform 0.1s ease-in-out',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.3em',
          paddingLeft: 0,
        }}
        onClick={() => router.push('/camera')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.3rem"
          viewBox="0 0 24 24"
          fill="white"
          style={{ marginLeft: '0.4em' }}
        >

          <path d="M0 0h24v24H0z" fill="none" />
          <path
            d="M20 5h-3.2l-1.8-2H9L7.2 5H4c-1.1 0-2 .9-2 2v12c0 
            1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 
            14H4V7h4.05l1.83-2h4.24l1.83 2H20v12zM12 
            8c-2.21 0-4 1.79-4 4s1.79 4 4 
            4 4-1.79 4-4-1.79-4-4-4zm0 
            6.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 
            9.5 12 9.5s2.5 1.12 2.5 
            2.5-1.12 2.5-2.5 2.5z"
          />
        </svg>
        写真をとる
      </button>


      {/* ピンを立てるボタン */}
      <button
        style={{
          position: 'absolute',
          top: '80vh',
          left: '56%',
          width: '38vw',
          height: '6vh',
          minHeight: '40px',
          fontSize: '1.0rem',
          fontWeight: 600,
          color: 'white',
          backgroundColor: '#7fc37f',
          borderTopRightRadius: '50px',
          borderBottomRightRadius: '50px',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'transform 0.1s ease-in-out',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.3em',
          paddingLeft: 0,
        }}
        onClick={async () => {
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
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="1.2rem" viewBox="0 0 24 24" fill="white">
          <path d="M0 0h24v24H0z" fill="none" />
          <path
            d="M12 2C8.13 2 5 5.13 5 
            9c0 5.25 7 13 7 13s7-7.75 
            7-13c0-3.87-3.13-7-7-7zm0 
            9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 
            6.5 12 6.5s2.5 1.12 2.5 
            2.5-1.12 2.5-2.5 2.5z"
          />
        </svg>
        ピンを立てる
      </button>


      {/* 終了ボタン */}
      <button
        style={{
          position: 'absolute',
          top: '80vh',
          left: '6%',
          width: '15vw',
          height: '6vh',
          minHeight: '40px',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'white',
          backgroundColor: 'red',
          borderRadius: '50px',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'transform 0.1s ease-in-out',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}

        onClick={() => router.push('/')}
      >
        終了
      </button>

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
