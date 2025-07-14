/**
 * @fileoverview ナビゲーション用地図表示コンポーネント
 * @description 10秒置きに現在地を取得し、ナビゲーション中の地図を表示します。
 * @author 尾﨑諒
 * @created 2025-06-24
 * @updated 2025-07-04
 * @version 4.0.3
 */

'use client';
import { useEffect, useState, useRef } from 'react';
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

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
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

// 点から線分への最短距離を計算する関数
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
    // 線分が点の場合
    return Math.sqrt((xP - x1) * (xP - x1) + (yP - y1) * (yP - y1));
  }
  
  // 点から線分への投影パラメータ
  const t = Math.max(0, Math.min(1, ((xP - x1) * dx + (yP - y1) * dy) / lengthSq));
  
  // 投影点
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  
  // 点から投影点への距離
  return Math.sqrt((xP - projX) * (xP - projX) + (yP - projY) * (yP - projY));
}

// 現在地が経路付近にいるかどうかを判定する関数
function isNearRoute(
  currentLat: number,
  currentLon: number,
  routeCoords: [number, number][],
  threshold: number = 50 // 50m以内
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

function generateViewCone(
  center: [number, number],
  heading: number,
  range: number = 50,
  angle: number = 60
): [number, number][] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat = center[0];
  const lon = center[1];
  const R = 6371000; // 地球半径[m]

  const points: [number, number][] = [center];

  for (let a = -angle / 2; a <= angle / 2; a += angle) {
    const θ = toRad(heading + a);
    const dx = range * Math.sin(θ);
    const dy = range * Math.cos(θ);

    const dLat = (dy / R) * (180 / Math.PI);
    const dLon = (dx / (R * Math.cos(toRad(lat)))) * (180 / Math.PI);

    points.push([lat + dLat, lon + dLon]);
  }
  return points;
}

export default function NavigatingPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [center, setCenter] = useState<[number, number]>([
    35.681236, 139.767125,
  ]); // 東京駅
  const [currentPosition, setCurrentPosition] = useState<
    [number, number] | null
  >(null);
  const [nearbyMessage, setNearbyMessage] = useState<string | null>(null);
  const [heading, setHeading] = useState<number | null>(null); // 初期値nullに変更
  const [toCoord, setToCoord] = useState<Coordinate | null>(null);
  const [toParam, setToParam] = useState<string>('');

  const watchIdRef = useRef<number | null>(null);
  const endIcon = createEndIcon();

  useEffect(() => {
    const storedSteps = sessionStorage.getItem('routeSteps');
    const storedCoords = sessionStorage.getItem('routeCoordinates');
    const storedParam = sessionStorage.getItem('toParam');
    const storedToCoord = sessionStorage.getItem('toCoord');

    // // デバッグ用ログ
    // console.log("=== SessionStorage Debug ===");
    // console.log("storedSteps:", storedSteps);
    // console.log("storedCoords:", storedCoords);
    // console.log("storedParam:", storedParam);
    // console.log("storedToCoord:", storedToCoord);

    // 全てのsessionStorageキーを確認
    console.log('All sessionStorage keys:', Object.keys(sessionStorage));
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      // console.log(`${key}: ${sessionStorage.getItem(key)}`);
    }

    if (storedSteps) {
      const parsedSteps: Step[] = JSON.parse(storedSteps);
      setSteps(parsedSteps);

      if (parsedSteps.length > 0) {
        setCenter([parsedSteps[0].start_lat, parsedSteps[0].start_lng]);
      }
    }

    if (storedCoords) {
      const parsedCoords: [number, number][] = JSON.parse(storedCoords);
      setRouteCoords(parsedCoords);

      if (parsedCoords.length > 0 && !storedSteps) {
        const avgLat =
          parsedCoords.reduce((sum, c) => sum + c[0], 0) / parsedCoords.length;
        const avgLng =
          parsedCoords.reduce((sum, c) => sum + c[1], 0) / parsedCoords.length;
        setCenter([avgLat, avgLng]);
      }

      // ルート座標の最終地点を目的地として設定（fallback）
      if (parsedCoords.length > 0 && !storedToCoord) {
        const lastCoord = parsedCoords[parsedCoords.length - 1];
        setToCoord({ lat: lastCoord[0], lon: lastCoord[1] });
        console.log('Using route end as destination:', {
          lat: lastCoord[0],
          lon: lastCoord[1],
        });
      }
    }

    if (storedParam) {
      setToParam(storedParam);
      console.log('toParam set to:', storedParam);
    }

    if (storedToCoord) {
      try {
        const parsedToCoord: Coordinate = JSON.parse(storedToCoord);
        setToCoord(parsedToCoord);
        console.log('toCoord set to:', parsedToCoord);
      } catch (e) {
        console.error('Error parsing toCoord:', e);
      }
    }
  }, []);

  // 端末の向き取得
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // alphaは0〜360度。北を基準に時計回り
        setHeading(event.alpha);
      }
    };

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      // iOS向け許可取得
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') {
            window.addEventListener(
              'deviceorientation',
              handleOrientation,
              true
            );
          }
        })
        .catch(() => {
          console.log('Device orientation permission denied or unsupported.');
        });
    } else if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      console.log(
        'DeviceOrientationEvent is not supported on this device/browser.'
      );
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // 現在地取得（10秒毎）
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('位置情報はこのブラウザでサポートされていません');
      return;
    }

    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setCurrentPosition(coords);
          console.log(
            `📍 現在地更新: lat=${coords[0].toFixed(
              6
            )}, lon=${coords[1].toFixed(
              6
            )} (${new Date().toLocaleTimeString()})`
          );

          // メッセージ表示ロジックの改良
          if (steps.length > 0) {
            const nextStep = steps[0];
            const distanceToNextStep = getDistanceMeters(
              coords[0],
              coords[1],
              nextStep.start_lat,
              nextStep.start_lng
            );

            // 次のステップ地点に近い場合（20m以内）
            if (distanceToNextStep < 20) {
              setNearbyMessage(`${nextStep.instruction}`);
              console.log('次のステップ案内表示');
            } else {
              // 経路付近にいるかチェック
              const nearRoute = isNearRoute(coords[0], coords[1], routeCoords);
              if (nearRoute) {
                setNearbyMessage('進んでください');
                console.log('経路案内表示');
              } else {
                setNearbyMessage(null);
                console.log('案内非表示');
              }
            }
          } else {
            setNearbyMessage(null);
          }
        },
        (err) => {
          console.error('位置情報の取得に失敗しました:', err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    };

    updatePosition();
    const intervalId = setInterval(updatePosition, 10000);

    return () => {
      clearInterval(intervalId);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [steps, routeCoords]); // routeCoordsを依存配列に追加

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {steps.length === 0 ? (
        <p>案内データが見つかりませんでした。</p>
      ) : (
        <>
          <div style={{ height: '92.2vh', width: '100%' }}>
            <MapContainer
              center={center}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false} // ズームコントロール（+/-ボタン）を非表示
              attributionControl={false} // コピーライト表示を非表示
            >
              <TileLayer
                attribution=''
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {routeCoords.length > 0 && (
                <Polyline
                  positions={routeCoords}
                  color="#2563eb"
                  weight={5}
                  opacity={0.7}
                />
              )}

              {currentPosition && (
                <>
                  <Marker position={currentPosition} icon={currentLocationIcon}>
                    <Popup>現在地</Popup>
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

                  {typeof heading === 'number' && !isNaN(heading) && (
                    <Polygon
                      positions={generateViewCone(currentPosition, heading)}
                      pathOptions={{ color: '#2563eb', fillOpacity: 0.3 }}
                    />
                  )}
                </>
              )}

              {/* 目的地マーカー */}
              {console.log('Rendering destination marker check:', {
                toCoord,
                toParam,
              })}
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

            {nearbyMessage && (
              <div
                style={{
                  position: 'absolute',
                  top: '30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80vw',
                  height: '10vh',
                  minHeight: '48px',
                  fontSize: '1.5rem',
                  backgroundColor: '#003300',
                  color: 'white',
                  padding: '0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  fontWeight: 'bold',
                  display: 'flex',
                  maxWidth: '90%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                {nearbyMessage}
              </div>
            )}
          </div>

          {/* <ol className="space-y-4">
            {steps.map((step, idx) => (
              <li
                key={idx}
                className="p-4 border rounded-lg shadow-sm bg-white"
              >
                <p className="font-semibold text-gray-800">
                  {step.sequence}. {step.instruction}
                </p>
                <p className="text-sm text-gray-600">
                  {step.distance.toFixed(1)}m / {Math.round(step.duration)}秒
                </p>
                <p className="text-xs text-gray-400">
                  緯度: {step.start_lat}, 経度: {step.start_lng}
                </p>
              </li>
            ))}
          </ol> */}
        </>
      )}
    </div>
  );
}