/**
 * @fileoverview ナビゲーション用地図表示コンポーネント（改善版）
 * @description リアルタイム位置追跡と詳細な案内メッセージを提供
 * @version 5.0.0 - 大幅改善版
 */

'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  CircleMarker,
  Polygon,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// =============================================================================
// 型定義（既存と同じ）
// =============================================================================
interface Step {
  sequence: number;
  instruction: string;
  distance: number;
  duration: number;
  start_lat: number;
  start_lng: number;
  maneuver: string;
}

interface Coordinate {
  lat: number;
  lon: number;
}

// =============================================================================
// アイコン定義（既存と同じ）
// =============================================================================
const currentLocationIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#2563eb" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" stroke="white" stroke-width="2" fill="#2563eb" />
      </svg>
    `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const createEndIcon = () =>
  L.icon({
    iconUrl:
      'data:image/svg+xml;base64,' +
      btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5 2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

// =============================================================================
// 🔧 改善1: 距離計算関数（高精度版）
// =============================================================================
function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // 地球半径（メートル）
  const toRad = (x: number) => (x * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// =============================================================================
// 🔧 改善2: 新しい関数 - 現在地に最適なステップを見つける
// =============================================================================
function findCurrentStep(
  currentLat: number,
  currentLon: number,
  steps: Step[]
): { currentStepIndex: number; nextStep: Step | null; distanceToNext: number } {
  
  if (steps.length === 0) {
    return { currentStepIndex: -1, nextStep: null, distanceToNext: Infinity };
  }

  let closestIndex = 0;
  let minDistance = Infinity;

  // 🎯 全てのステップとの距離を計算して最も近いものを見つける
  for (let i = 0; i < steps.length; i++) {
    const distance = getDistanceMeters(
      currentLat,
      currentLon,
      steps[i].start_lat,
      steps[i].start_lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  // 📍 次のステップを決定
  let nextStepIndex = closestIndex;
  
  // 現在のステップに十分近い場合（20m以内）は次のステップへ
  if (minDistance < 20 && closestIndex < steps.length - 1) {
    nextStepIndex = closestIndex + 1;
  }

  const nextStep = nextStepIndex < steps.length ? steps[nextStepIndex] : null;
  
  const distanceToNext = nextStep ? getDistanceMeters(
    currentLat,
    currentLon,
    nextStep.start_lat,
    nextStep.start_lng
  ) : Infinity;

  console.log(`📍 ステップ判定: 現在=${closestIndex}, 次=${nextStepIndex}, 距離=${Math.round(distanceToNext)}m`);

  return { 
    currentStepIndex: closestIndex, 
    nextStep, 
    distanceToNext 
  };
}

// =============================================================================
// 🔧 改善3: 点から線分への距離計算（改良版）
// =============================================================================
function getDistanceToLineSegment(
  pointLat: number,
  pointLon: number,
  line1Lat: number,
  line1Lon: number,
  line2Lat: number,
  line2Lon: number
): number {
  const R = 6371000; // 地球半径[m]
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  // 緯度経度をメートル単位の座標に変換（簡易投影）
  const lat1 = toRad(line1Lat);
  const lon1 = toRad(line1Lon);
  const lat2 = toRad(line2Lat);
  const lon2 = toRad(line2Lon);
  const latP = toRad(pointLat);
  const lonP = toRad(pointLon);
  
  // 線分の両端点をメートル単位で計算
  const x1 = R * Math.cos(lat1) * lon1;
  const y1 = R * lat1;
  const x2 = R * Math.cos(lat2) * lon2;
  const y2 = R * lat2;
  const xP = R * Math.cos(latP) * lonP;
  const yP = R * latP;
  
  // 線分のベクトル
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // 線分の長さの2乗
  const lengthSq = dx * dx + dy * dy;
  
  if (lengthSq === 0) {
    return Math.sqrt((xP - x1) * (xP - x1) + (yP - y1) * (yP - y1));
  }
  
  // 点から線分への投影パラメータ
  const t = Math.max(0, Math.min(1, ((xP - x1) * dx + (yP - y1) * dy) / lengthSq));
  
  // 投影点
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  
  return Math.sqrt((xP - projX) * (xP - projX) + (yP - projY) * (yP - projY));
}

// =============================================================================
// 🔧 改善4: 経路付近判定（閾値調整）
// =============================================================================
function isNearRoute(
  currentLat: number,
  currentLon: number,
  routeCoords: [number, number][],
  threshold: number = 30 // 30m以内に調整（より敏感に）
): boolean {
  if (routeCoords.length < 2) return false;
  
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const distance = getDistanceToLineSegment(
      currentLat,
      currentLon,
      routeCoords[i][0],
      routeCoords[i][1],
      routeCoords[i + 1][0],
      routeCoords[i + 1][1]
    );
    
    if (distance <= threshold) {
      return true;
    }
  }
  
  return false;
}

// =============================================================================
// 🔧 改善5: 向き表示用の視野コーン生成（改良版）
// =============================================================================
function generateViewCone(
  center: [number, number],
  heading: number,
  range: number = 50,
  angle: number = 60
): [number, number][] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat = center[0];
  const lon = center[1];
  const R = 6371000;

  const points: [number, number][] = [center];

  // 📐 より滑らかな扇形を作成（角度を細かく分割）
  for (let a = -angle / 2; a <= angle / 2; a += 5) { // 5度刻みで滑らか
    const θ = toRad(heading + a);
    const dx = range * Math.sin(θ);
    const dy = range * Math.cos(θ);

    const dLat = (dy / R) * (180 / Math.PI);
    const dLon = (dx / (R * Math.cos(toRad(lat)))) * (180 / Math.PI);

    points.push([lat + dLat, lon + dLon]);
  }
  return points;
}

// =============================================================================
// 🚀 メインコンポーネント
// =============================================================================
export default function NavigatingPage() {
  // State定義
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [center, setCenter] = useState<[number, number]>([35.681236, 139.767125]);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [nearbyMessage, setNearbyMessage] = useState<string | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [toCoord, setToCoord] = useState<Coordinate | null>(null);
  const [toParam, setToParam] = useState<string>('');
  
  // 🔧 改善6: デバッグ用state追加
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // 到着モーダル用のstate
  const [showArrivalModal, setShowArrivalModal] = useState<boolean>(false);
  // 到着モーダルが一度表示されたことを記録するstate
  const [arrivalModalShown, setArrivalModalShown] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const endIcon = createEndIcon();

  // =============================================================================
  // 🔧 改善7: 初期化処理（既存とほぼ同じ、ログ強化）
  // =============================================================================
  useEffect(() => {
    const storedSteps = sessionStorage.getItem('routeSteps');
    const storedCoords = sessionStorage.getItem('routeCoordinates');
    const storedParam = sessionStorage.getItem('toParam');
    const storedToCoord = sessionStorage.getItem('toCoord');

    console.log('=== 初期化開始 ===');
    console.log('利用可能なsessionStorageキー:', Object.keys(sessionStorage));

    // ルートデータの存在チェック
    if (!storedSteps || !storedCoords) {
      console.error('❌ セッションストレージにルートデータがありません', {
        hasSteps: !!storedSteps,
        hasCoords: !!storedCoords
      });
      // エラーページにリダイレクト
      sessionStorage.setItem("errorMessage", "ナビゲーション情報が見つかりません。もう一度ルート検索をお試しください。");
      // ここでリダイレクトは不要（useEffectの初期化中で行うと問題を起こす可能性があるため）
      return;
    }

    if (storedSteps) {
      try {
        const parsedSteps: Step[] = JSON.parse(storedSteps);
        setSteps(parsedSteps);
        console.log(`✅ ステップ読み込み完了: ${parsedSteps.length}個`);

        if (parsedSteps.length > 0) {
          setCenter([parsedSteps[0].start_lat, parsedSteps[0].start_lng]);
        }
      } catch (error) {
        console.error('❌ ステップデータの解析に失敗:', error);
      }
    }

    if (storedCoords) {
      try {
        const parsedCoords: [number, number][] = JSON.parse(storedCoords);
        setRouteCoords(parsedCoords);
        console.log(`✅ 経路座標読み込み完了: ${parsedCoords.length}点`);

        if (parsedCoords.length > 0 && !storedSteps) {
          const avgLat = parsedCoords.reduce((sum, c) => sum + c[0], 0) / parsedCoords.length;
          const avgLng = parsedCoords.reduce((sum, c) => sum + c[1], 0) / parsedCoords.length;
          setCenter([avgLat, avgLng]);
        }

        if (parsedCoords.length > 0 && !storedToCoord) {
          const lastCoord = parsedCoords[parsedCoords.length - 1];
          setToCoord({ lat: lastCoord[0], lon: lastCoord[1] });
          console.log('📍 経路終点を目的地に設定:', { lat: lastCoord[0], lon: lastCoord[1] });
        }
      } catch (error) {
        console.error('❌ 経路座標の解析に失敗:', error);
      }
    }

    if (storedParam) {
      setToParam(storedParam);
      console.log('🏷️ 目的地名設定:', storedParam);
    }

    if (storedToCoord) {
      try {
        const parsedToCoord: Coordinate = JSON.parse(storedToCoord);
        setToCoord(parsedToCoord);
        console.log('🎯 目的地座標設定:', parsedToCoord);
      } catch (e) {
        console.error('❌ 目的地座標解析エラー:', e);
      }
    }
  }, []);

  // =============================================================================
  // 🔧 改善8: 向き検出処理（フォールバック機能強化）
  // =============================================================================
  useEffect(() => {
    let orientationAvailable = false;
    let orientationTimeout: NodeJS.Timeout;
    
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        orientationAvailable = true;
        
        // 🧭 デバイス別の向き補正
        let correctedHeading = event.alpha;
        
        // Android端末の場合の補正
        if (navigator.userAgent.includes('Android')) {
          correctedHeading = (360 - event.alpha) % 360;
        }
        
        setHeading(correctedHeading);
        console.log(`🧭 向き更新: ${Math.round(correctedHeading)}度`);
      }
    };

    // iOS端末の許可取得
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      console.log('📱 iOS端末: 向き情報の許可を要求');
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
            console.log('✅ iOS向き情報許可取得');
          } else {
            console.log('❌ iOS向き情報許可拒否');
          }
        })
        .catch(() => {
          console.log('❌ iOS向き情報許可エラー');
        });
    } 
    // その他のデバイス
    else if ('DeviceOrientationEvent' in window) {
      console.log('📱 向き情報イベント登録');
      window.addEventListener('deviceorientation', handleOrientation, true);
      
      // 📱 3秒後のフォールバックチェック
      orientationTimeout = setTimeout(() => {
        if (!orientationAvailable) {
          console.log('⚠️ 向き情報が利用できません - 表示なしで継続');
          setDebugInfo('向き情報: 利用不可');
        } else {
          setDebugInfo('向き情報: 利用可能');
        }
      }, 3000);
    } else {
      console.log('❌ このデバイスは向き検出をサポートしていません');
      setDebugInfo('向き情報: 非対応');
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (orientationTimeout) {
        clearTimeout(orientationTimeout);
      }
    };
  }, []);

  // =============================================================================
  // 🔧 改善9: GPS位置追跡処理（高頻度化＋詳細案内）
  // =============================================================================
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('❌ 位置情報はこのブラウザでサポートされていません');
      setNearbyMessage('位置情報が利用できません');
      return;
    }

    // 🎯 改良された位置更新処理
    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setCurrentPosition(coords);
          
          const timestamp = new Date().toLocaleTimeString();
          console.log(`📍 位置更新 ${timestamp}: ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);

          // 🚀 新しい案内メッセージロジック
          if (steps.length > 0) {
            const { currentStepIndex, nextStep, distanceToNext } = findCurrentStep(
              coords[0],
              coords[1],
              steps
            );

            // 📢 段階的な案内メッセージ
            if (nextStep) {
              if (distanceToNext < 10) {
                // 10m以内：緊急案内
                setNearbyMessage(`まもなく${nextStep.instruction}`);
                setDebugInfo(`次ステップまで${Math.round(distanceToNext)}m`);
              } else if (distanceToNext < 50) {
                // 50m以内：予告案内
                setNearbyMessage(`${Math.round(distanceToNext)}m先で${nextStep.instruction}`);
                setDebugInfo(`ステップ${nextStep.sequence}: ${Math.round(distanceToNext)}m`);
              } else if (distanceToNext < 100) {
                // 100m以内：準備案内
                setNearbyMessage(`${Math.round(distanceToNext)}m先で${nextStep.instruction}`);
                setDebugInfo(`準備: ${Math.round(distanceToNext)}m`);
              } else if (isNearRoute(coords[0], coords[1], routeCoords)) {
                // 経路上：継続案内
                setNearbyMessage('経路に沿って進んでください');
                setDebugInfo(`経路上: 次まで${Math.round(distanceToNext)}m`);
              } else {
                // 経路外：復帰案内
                setNearbyMessage('⚠️ 経路に戻ってください');
                setDebugInfo(`経路外: ${Math.round(distanceToNext)}m`);
              }
            } else {
              // 🏁 最終地点付近の処理
              if (toCoord) {
                const distanceToDestination = getDistanceMeters(
                  coords[0], coords[1], toCoord.lat, toCoord.lon
                );
                
                if (distanceToDestination < 20) {
                  setNearbyMessage('🎉 目的地に到着しました！');
                  setDebugInfo('到着完了');
                  // 到着モーダルを表示（一度も表示していない場合のみ）
                  if (!arrivalModalShown) {
                    setShowArrivalModal(true);
                    setArrivalModalShown(true); // 表示したことを記録
                  }
                } else if (distanceToDestination < 100) {
                  setNearbyMessage(`目的地まで${Math.round(distanceToDestination)}m`);
                  setDebugInfo(`残り${Math.round(distanceToDestination)}m`);
                } else {
                  setNearbyMessage('目的地まで直進してください');
                  setDebugInfo(`目的地まで${Math.round(distanceToDestination)}m`);
                }
              } else {
                setNearbyMessage('ℹ案内を完了しました');
                setDebugInfo('案内完了');
              }
            }
          } else {
            setNearbyMessage('📍 経路データを読み込み中...');
            setDebugInfo('データ読み込み中');
          }
        },
        (err) => {
          console.error('❌ 位置情報取得エラー:', err.message);
          setNearbyMessage('📡 位置情報を取得中...');
          setDebugInfo(`エラー: ${err.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,        // 🔧 5秒でタイムアウト
          maximumAge: 1000,     // 🔧 1秒以内のキャッシュを使用
        }
      );
    };

    // 🔧 改善: 初回は即座に実行、その後1秒間隔
    updatePosition();
    const intervalId = setInterval(updatePosition, 1000); // 10000 → 1000に短縮

    console.log('🚀 GPS追跡開始: 1秒間隔');

    return () => {
      clearInterval(intervalId);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      console.log('🛑 GPS追跡停止');
    };
  }, [steps, routeCoords, toCoord]); // 依存配列に toCoord 追加

  // =============================================================================
  // 🎨 レンダリング
  // =============================================================================
  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {steps.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-lg">📍 案内データを読み込み中...</p>
          <p className="text-sm text-gray-500 mt-2">{debugInfo}</p>
        </div>
      ) : (
        <>
          <div style={{ height: '92.2vh', width: '100%' }}>
            <MapContainer
              center={center}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                attribution=""
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* 経路表示 */}
              {routeCoords.length > 0 && (
                <Polyline
                  positions={routeCoords}
                  color="#2563eb"
                  weight={5}
                  opacity={0.7}
                />
              )}

              {/* 現在地表示 */}
              {currentPosition && (
                <>
                  <Marker position={currentPosition} icon={currentLocationIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>現在地</strong>
                        <br />
                        緯度: {currentPosition[0].toFixed(6)}
                        <br />
                        経度: {currentPosition[1].toFixed(6)}
                        {heading && (
                          <>
                            <br />
                            方角: {Math.round(heading)}°
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>

                  <CircleMarker
                    center={currentPosition}
                    radius={8}
                    pathOptions={{
                      color: '#2563eb',
                      fillColor: '#2563eb',
                      fillOpacity: 1,
                    }}
                  />

                  {/* 🔧 改善: 向き表示（利用可能な場合のみ） */}
                  {typeof heading === 'number' && !isNaN(heading) && (
                    <Polygon
                      positions={generateViewCone(currentPosition, heading)}
                      pathOptions={{ 
                        color: '#2563eb', 
                        fillOpacity: 0.2,
                        weight: 2 
                      }}
                    />
                  )}
                </>
              )}

              {/* 目的地マーカー */}
              {toCoord && (
                <Marker position={[toCoord.lat, toCoord.lon]} icon={endIcon}>
                  <Popup>
                    <div className="text-center p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <strong className="text-red-700">目的地</strong>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        {toParam}
                      </div>
                      <div className="text-xs text-gray-500">
                        緯度: {toCoord.lat.toFixed(6)}
                        <br />
                        経度: {toCoord.lon.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* 🔧 改善: より詳細な案内メッセージ表示 */}
            {nearbyMessage && (
              <div
                style={{
                  position: 'absolute',
                  top: '30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '85vw',
                  minHeight: '60px',
                  fontSize: '1.3rem',
                  backgroundColor: nearbyMessage.includes('到着') 
                    ? '#FFD700' 
                    : nearbyMessage.includes('⚠️') 
                    ? '#FF6B6B' 
                    : '#2D5A4A',
                  color: nearbyMessage.includes('到着') || nearbyMessage.includes('⚠️')
                    ? '#000000' 
                    : 'white',
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 1000,
                  fontWeight: 'bold',
                  display: 'flex',
                  maxWidth: '90%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              >
                {nearbyMessage}
              </div>
            )}

            {/* 🔧 デバッグ情報表示は非表示に変更 */}
            
            {/* 到着モーダル */}
            {showArrivalModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2000,
                }}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    width: '85%',
                    maxWidth: '400px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                    }}
                  >
                    🎉
                  </div>
                  <h3
                    style={{
                      margin: '0 0 16px 0',
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#10B981',
                    }}
                  >
                    目的地に到着しました
                  </h3>
                  <p
                    style={{
                      margin: '0 0 24px 0',
                      color: '#4B5563',
                      fontSize: '16px',
                      lineHeight: '1.5',
                    }}
                  >
                    {toParam ? `${toParam}に到着しました。` : '目的地に到着しました。'}
                    <br />
                    ナビゲーションを終了しますか？
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'center',
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowArrivalModal(false); // モーダルを閉じる
                        setArrivalModalShown(true); // 再表示防止のフラグを設定
                        router.push('/'); // ホーム画面に戻る
                      }}
                      style={{
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      ナビを終える
                    </button>
                    <button
                      onClick={() => {
                        setShowArrivalModal(false); // モーダルを閉じる
                        
                        // 5秒後に再度モーダルを表示できるようにする
                        setTimeout(() => {
                          setArrivalModalShown(false);
                        }, 10000);
                      }}
                      style={{
                        backgroundColor: '#F3F4F6',
                        color: '#4B5563',
                        border: '1px solid #D1D5DB',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      ナビを続ける
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}