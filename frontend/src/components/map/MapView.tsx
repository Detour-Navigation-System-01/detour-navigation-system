/**
 * @fileoverview メイン画面の地図表示コンポーネント
 * @description Leafletを使用して現在地を中心にマップを表示し、お気に入りスポットを設置するコンポーネント
 * @author 尾﨑諒
 * @created 2025-06-17
 * @updated 2025-07-10
 * @version 5.0.4
 */

'use client';


import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetcher } from "@/lib/api";
import { User } from "@/types/user";

type Props = {
  user: User;
}


interface Place {
  id: string;
  usrid: string; 
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  category: string;
  image_url: string;
  created_at: string;
}

interface ApiResponse {
  places: Place[];
}

//現在地アイコン
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

//場所ピンアイコン（画像あり）
const placeWithImageIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#22c55e" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="white" stroke-width="1"/>
        <rect x="8" y="7" width="8" height="6" rx="1" fill="white" stroke="#22c55e" stroke-width="0.5"/>
        <rect x="6" y="8" width="2" height="1" rx="0.5" fill="white" stroke="#22c55e" stroke-width="0.3"/>
        <circle cx="12" cy="10" r="1.5" fill="#22c55e"/>
        <circle cx="12" cy="10" r="1" fill="white"/>
      </svg>
    `),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

//場所ピンアイコン（画像なし）
const placeWithoutImageIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ef4444" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="white" stroke-width="1"/>
      </svg>
    `),
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

// 扇形（視野コーン）を計算する関数
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

// 同じ座標の場所から最新のものだけを取得する関数
function getLatestPlacesByLocation(places: Place[]): Place[] {
  const locationMap = new Map<string, Place>();
  
  places.forEach(place => {
    // 座標をキーとして使用（小数点以下6桁で丸める）
    const locationKey = `${parseFloat(place.lat).toFixed(6)}-${parseFloat(place.lng).toFixed(6)}`;
    const existingPlace = locationMap.get(locationKey);
    
    if (!existingPlace) {
      // 新しい場所の場合はそのまま追加
      locationMap.set(locationKey, place);
    } else {
      // 既存の場所がある場合は作成日時を比較
      const existingDate = new Date(existingPlace.created_at);
      const currentDate = new Date(place.created_at);
      
      // より新しい場合は置き換え
      if (currentDate > existingDate) {
        locationMap.set(locationKey, place);
      }
    }
  });
  
  return Array.from(locationMap.values());
}

// 画像URLが有効かどうかを判定する関数
function hasValidImage(imageUrl: string | null | undefined): boolean {
  return !!(imageUrl && imageUrl.trim() !== '');
}

export default function MapView({ user }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  
  // 現在地取得
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
        setPosition([35.681236, 139.767125]);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // バックエンドから場所データを取得
  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);
      setAuthError(null);

      try {

        const data: ApiResponse = await fetcher("/api/places/public", {
          method: "GET",
        });
        
        console.log("✅ 場所データ取得成功:", data);
        // console.log('👀 user.public_settings 更新確認:', user.public_settings);

        // data.data を使用（data.places ではなく）
        if (data.data && data.data.length > 0) {
          data.data.forEach((place, index) => {
            console.log(`${index + 1}:`, {
              id: place.id,
              latitude: place.lat,      // lat プロパティ
              longitude: place.lng,     // lng プロパティ
              image_url: place.image_url,           // 写真のURL
              hasImage: hasValidImage(place.image_url), // 画像有無の判定
            });
          });
        } else {
          console.log('取得した場所データが空です');
        }

        // data.data を state に設定
        setPlaces(data.data || []);
      } catch (err: any) {
        console.error('❌ 場所データ取得に失敗:', err);

        // if (
        //   err.message?.includes('認証') ||
        //   err.message?.includes('ログイン')
        // ) {
        //   setAuthError(
        //     'ログインされていません。Profileページからログインしてください。'
        //   );
        // } else {
        //   setError(err.message || '場所データの取得に失敗しました');
        // }
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  // デバイス向き取得
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setHeading(event.alpha); // alphaは0~360度（北基準時計回り）
      }
    };

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
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

  if (!position) {
    return <p className="p-4">現在地を取得中...</p>;
  }

  return (
    <MapContainer
      center={position}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={currentLocationIcon}>
        <Popup>現在地</Popup>
      </Marker>

      {/* headingが有効なら扇形表示 */}
      {typeof heading === 'number' && !isNaN(heading) && (
        <Polygon
          positions={generateViewCone(position, heading)}
          pathOptions={{ color: '#2563eb', fillOpacity: 0.3 }}
        />
      )}

      {/* 場所ピンの表示 */}
      {places &&
        places.length > 0 &&
        places
          .filter((place) => place.lat && place.lng) // 有効な座標のみフィルタリング
          .map((place) => (
            // <Marker
            //   key={place.id}
            //   position={[parseFloat(place.lat), parseFloat(place.lng)]} // lat, lng を使用
            //   icon={hasValidImage(place.image_url) ? placeWithImageIcon : placeWithoutImageIcon}
            // >

            
            //   <Popup>
            //     <div style={{ 
            //       minWidth: '200px', 
            //       maxWidth: '300px',
            //       fontSize: '14px'
            //     }}>
            //       <h3 style={{ 
            //         margin: '0 0 8px 0', 
            //         fontSize: '16px',
            //         fontWeight: 'bold'
            //       }}>
            //         {/* {place.name || '名前未設定'} */}
            //       </h3>
                  
            //       {/* 画像の表示 */}
            //       {hasValidImage(place.image_url) && (
            //         <div style={{ marginBottom: '8px' }}>
            //           <img 
            //             src={place.image_url} 
            //             // alt={place.name || '場所の写真'}
            //             style={{
            //               width: '100%',
            //               height: '150px',
            //               objectFit: 'cover',
            //               borderRadius: '4px',
            //               border: '1px solid #ddd'
            //             }}
            //             onError={(e) => {
            //               // 画像読み込みエラー時の処理
            //               e.currentTarget.style.display = 'none';
            //             }}
            //           />
            //         </div>
            //       )}
                  
            //       {/* 画像がない場合のメッセージ */}
            //       {/* {!hasValidImage(place.image_url) && (
            //         <div style={{ 
            //           marginBottom: '8px',
            //           padding: '8px',
            //           backgroundColor: '#f3f4f6',
            //           borderRadius: '4px',
            //           textAlign: 'center',
            //           color: '#6b7280'
            //         }}>
            //           📷 画像なし
            //         </div>
            //       )}
                  
            //       <h3>{place.name || '名前未設定'}</h3>
            //       <p>{place.address || '住所未設定'}</p>
            //       <p>{place.description || '説明なし'}</p>
            //       <p>
            //         作成日: {new Date(place.created_at).toLocaleString()}
            //       </p> */}
            //     </div>
            //   </Popup>
            // </Marker>
            <Marker
              key={place.id}
              position={[parseFloat(place.lat), parseFloat(place.lng)]}
              icon={hasValidImage(place.image_url) ? placeWithImageIcon : placeWithoutImageIcon}
            >
              {hasValidImage(place.image_url) && (
                <Popup>
                  <div style={{ 
                    minWidth: '200px', 
                    maxWidth: '300px',
                    fontSize: '14px'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      {/* {place.name || '名前未設定'} */}
                    </h3>

                    <div style={{ marginBottom: '8px' }}>
                      <img 
                        src={place.image_url} 
                        alt={place.name || '場所の写真'}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>


          ))}

      {/* エラーメッセージの表示 */}
    </MapContainer>
  );
}