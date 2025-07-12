'use client';

/**
 * @fileoverview 保存スポット詳細画面（地図背景付き・削除機能付き）
 * @description 背景に地図を表示し、その上に写真と詳細情報を重ねて表示する詳細ビュー。
 * @author 赤津
 * @created 2025-06-10
 * @updated 2025-07-10
 * @version 4.0.0
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetcher } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

// スポットデータの型定義
interface SpotData {
  id: number;
  name: string;
  description: string;
  category: string;
  address: string;
  prefecture: string;
  lat: number | string; // 数値または文字列の可能性
  lng: number | string; // 数値または文字列の可能性
  image_url: string;
  created_at: string;
}

// 確認モーダルのProps
interface ConfirmModalProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  spotName: string;
  showSpotName?: boolean; // スポット名を表示するかどうかのフラグ
}

// 確認モーダルコンポーネント
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isVisible,
  onConfirm,
  onCancel,
  spotName,
  showSpotName = true,
}) => {
  if (!isVisible) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div
          style={{ fontSize: '48px', marginBottom: '16px', color: '#ef4444' }}
        >
          🗑️
        </div>
        <h3
          style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}
        >
          スポットを削除しますか？
        </h3>
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.4',
          }}
        >
          {showSpotName
            ? `「${spotName}」を削除します。`
            : 'このスポットを削除します。'}
          <br />
          この操作は取り消せません。
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={cancelButtonStyle}>
            キャンセル
          </button>
          <button onClick={onConfirm} style={deleteButtonStyle}>
            削除する
          </button>
        </div>
      </div>
    </div>
  );
};

// 結果モーダルのProps
interface ResultModalProps {
  isVisible: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

// 結果モーダルコンポーネント
const ResultModal: React.FC<ResultModalProps> = ({
  isVisible,
  type,
  message,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: type === 'success' ? '#22c55e' : '#ef4444',
          }}
        >
          {type === 'success' ? '✅' : '❌'}
        </div>
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: type === 'success' ? '#22c55e' : '#ef4444',
          }}
        >
          {type === 'success' ? '削除完了' : 'エラー'}
        </h3>
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.4',
          }}
        >
          {message}
        </p>
        <button
          onClick={onClose}
          style={{
            ...deleteButtonStyle,
            backgroundColor: type === 'success' ? '#22c55e' : '#ef4444',
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
};

// 地図の動きを監視するコンポーネント
const MapController = ({
  originalCoords,
  onMapMove,
}: {
  originalCoords: [number, number];
  onMapMove: (offset: { x: number; y: number }) => void;
}) => {
  const map = useMapEvents({
    move: () => {
      // 元の撮影地点のピクセル座標を取得
      const originalPoint = map.latLngToContainerPoint(originalCoords);

      // 地図コンテナの中心点を取得
      const mapSize = map.getSize();
      const center = { x: mapSize.x / 2, y: mapSize.y / 2 };

      // オフセットを計算（撮影地点 - 画面中央）
      const offset = {
        x: originalPoint.x - center.x,
        y: originalPoint.y - center.y,
      };

      console.log('Map moved:', { originalPoint, center, offset }); // デバッグ用
      onMapMove(offset);
    },
    zoom: () => {
      // ズーム時も同様に位置を再計算
      const originalPoint = map.latLngToContainerPoint(originalCoords);
      const mapSize = map.getSize();
      const center = { x: mapSize.x / 2, y: mapSize.y / 2 };

      const offset = {
        x: originalPoint.x - center.x,
        y: originalPoint.y - center.y,
      };

      console.log('Map zoomed:', { originalPoint, center, offset }); // デバッグ用
      onMapMove(offset);
    },
    moveend: () => {
      // 移動終了時にも再計算
      const originalPoint = map.latLngToContainerPoint(originalCoords);
      const mapSize = map.getSize();
      const center = { x: mapSize.x / 2, y: mapSize.y / 2 };

      const offset = {
        x: originalPoint.x - center.x,
        y: originalPoint.y - center.y,
      };

      console.log('Move ended:', { originalPoint, center, offset }); // デバッグ用
      onMapMove(offset);
    },
  });

  return null;
};

export default function PreservationDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const userId = params?.userId;
  const [spotData, setSpotData] = useState<SpotData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState<'success' | 'error'>('success');
  const [resultMessage, setResultMessage] = useState('');
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });

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

  const handleDeleteClick = () => {
    setShowConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!spotData || !user) return;

    setIsDeleting(true);
    setShowConfirmModal(false);

    try {
      console.log('🗑️ スポット削除開始:', spotData.id);

      // APIを呼び出してスポットを削除
      await fetcher(`/api/places/${spotData.id}`, {
        method: 'DELETE',
      });

      console.log('✅ スポット削除成功');

      // 削除成功後、すぐにギャラリーページに遷移
      router.push('/preservation');
    } catch (err: any) {
      console.error('❌ スポット削除失敗:', err);
      setResultType('error');
      setResultMessage(err.message || 'スポットの削除に失敗しました。');
      setShowResultModal(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirmModal(false);
  };

  const handleResultClose = () => {
    setShowResultModal(false);
  };

  // 地図の動きに応じて写真カードの位置を更新
  const handleMapMove = (offset: { x: number; y: number }) => {
    console.log('Updating map offset:', offset); // デバッグ用
    setMapOffset(offset);
  };

  // 初期状態のオフセットを設定
  useEffect(() => {
    const coordinates = getCoordinates();
    if (coordinates) {
      // 初期状態では撮影地点が画面中央にあるのでオフセットは0
      setMapOffset({ x: 0, y: 0 });
    }
  }, [spotData]);

  // 座標を数値に変換
  const getCoordinates = (): [number, number] | null => {
    if (!spotData) return null;
    const lat = parseFloat(String(spotData.lat));
    const lng = parseFloat(String(spotData.lng));
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
  };

  // ローディング中の表示
  if (isDeleting) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingContentStyle}>
          <div style={spinnerStyle}></div>
          <p style={{ margin: '16px 0 0 0', fontSize: '16px', color: '#666' }}>
            削除しています...
          </p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h1>エラー</h1>
          <p>{error}</p>
          <button onClick={handleBack} style={backButtonStyle}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  // データがない場合
  if (!spotData) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  // 他のユーザーのスポットかどうかをチェック
  const isOwnSpot = user && spotData && String(userId) === String(user.id);
  const coordinates = getCoordinates();

  return (
    <>
      <div style={containerStyle}>
        {/* 背景地図 */}
        {coordinates && (
          <div style={mapBackgroundStyle}>
            <MapContainer
              center={coordinates}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
              dragging={true}
              scrollWheelZoom={true}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController
                originalCoords={coordinates}
                onMapMove={handleMapMove}
              />
            </MapContainer>
          </div>
        )}

        {/* ヘッダー */}
        <div style={headerStyle}>
          <button onClick={handleBack} style={backButtonStyle}>
            <span>←</span>
            <span>戻る</span>
          </button>
        </div>

        {/* 写真ポップアップカード（地図の動きに連動） */}
        {spotData.image_url && coordinates && (
          <div
            style={{
              ...photoPopupStyle,
              left: `calc(50% + ${mapOffset.x}px)`,
              top: `calc(40% + ${mapOffset.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div style={photoCardStyle}>
              <img
                src={spotData.image_url}
                alt={spotData.name}
                style={photoStyle}
              />
            </div>
            {/* 撮影地点を指すポインター - 写真カードの一部として配置 */}
            <div style={pointerStyle}>
              <div style={pointerTriangleStyle}></div>
            </div>
          </div>
        )}

        {/* 情報カード - 画面下部に配置 */}
        <div style={infoCardStyle}>
          {/* 自動生成されたタイトルは表示しない */}
          {spotData.name && !spotData.name.startsWith('自動保存地点-') && (
            <h1 style={titleStyle}>{spotData.name}</h1>
          )}

          {/* 住所を大きく表示 */}
          <div style={addressContainerStyle}>
            <span style={addressTextStyle}>{spotData.address}</span>
          </div>

          {/* 作成日を表示 */}
          <div style={dateContainerStyle}>
            <span style={dateTextStyle}>
              保存日：
              {new Date(spotData.created_at).toLocaleDateString('ja-JP')}
            </span>
          </div>

          {/* 自分のスポットの場合のみ削除ボタンを表示 */}
          {isOwnSpot && (
            <div style={actionButtonContainerStyle}>
              <button
                onClick={handleDeleteClick}
                style={fullWidthDeleteButtonStyle}
              >
                🗑️ 保存スポットを削除する
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 確認モーダル */}
      <ConfirmModal
        isVisible={showConfirmModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        spotName={spotData?.name || ''}
        showSpotName={
          spotData?.name ? !spotData.name.startsWith('自動保存地点-') : false
        }
      />

      {/* 結果モーダル */}
      <ResultModal
        isVisible={showResultModal}
        type={resultType}
        message={resultMessage}
        onClose={handleResultClose}
      />

      {/* アニメーション用CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}</style>
    </>
  );
}

// スタイル定義
const containerStyle: React.CSSProperties = {
  position: 'relative',
  minHeight: '100vh',
  backgroundColor: '#f9fafb',
  overflow: 'hidden',
  paddingBottom: '60px', // 下部に十分な余白を追加
};

const mapBackgroundStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 1,
};

const headerStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 10,
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  padding: '16px 20px',
  backgroundColor: 'transparent',
};

const backButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: 'rgba(133, 184, 163, 0.95)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const photoPopupStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 15,
  width: '320px',
  maxWidth: '85%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const photoCardStyle: React.CSSProperties = {
  width: '100%',
  height: '240px',
  overflow: 'hidden',
  backgroundColor: 'white',
  borderRadius: '20px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
  border: '3px solid white',
  position: 'relative',
  zIndex: 18, // 三角形より上に表示
};

const photoStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const pointerStyle: React.CSSProperties = {
  position: 'relative',
  width: '40px',
  height: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  zIndex: 19,
  marginTop: '0px', // 写真カードと隙間なく接続
};

const pointerTriangleStyle: React.CSSProperties = {
  width: '0',
  height: '0',
  borderLeft: '20px solid transparent',
  borderRight: '20px solid transparent',
  borderTop: '20px solid white',
  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
  position: 'relative',
  zIndex: 20,
};

const infoCardStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '60px',
  left: '20px',
  right: '20px',
  zIndex: 10,
  margin: '0',
  padding: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '16px',
  backdropFilter: 'blur(15px)',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
  border: '2px solid rgba(255, 255, 255, 0.8)',
  maxHeight: '180px',
  overflow: 'visible',
};

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0 0 12px 0',
  textAlign: 'left',
};

const addressContainerStyle: React.CSSProperties = {
  marginBottom: '8px',
};

const addressTextStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: '1.4',
  fontWeight: '500',
};

const dateContainerStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const dateTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
};

const actionButtonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '20px',
};

const deleteActionButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  flex: '1',
  minWidth: '100px',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#6b7280',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  flex: '1',
  minWidth: '100px',
};

const fullWidthDeleteButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  width: '100%',
  maxWidth: '300px',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.2s ease-out',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '400px',
  width: '90%',
  textAlign: 'center',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#6b7280',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
};

const loadingContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const loadingContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #ef4444',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};
