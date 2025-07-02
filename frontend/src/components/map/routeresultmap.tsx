"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface Coordinate {
  lat: number;
  lon: number;
}

// 新しいデータベース形式のレスポンス
interface RouteResponse {
  success: boolean;
  message: string;
  data: {
    route: {
      id?: number;
      name: string;
      description: string;
      userId: number | null;
      origin_lat: number;
      origin_lng: number;
      destination_lat: number;
      destination_lng: number;
      distance: number;
      duration: number;
      profile: string;
      detourLevel: number;
      routeType: string;
      createdAt?: string;
      updatedAt?: string;
    };
    coordinates?: Array<{
      lat: number;
      lng: number;
    }>;
    steps?: Array<{
      sequence: number;
      instruction: string;
      distance: number;
      duration: number;
      start_lat: number;
      start_lng: number;
      end_lat: number | null;
      end_lng: number | null;
      maneuver: string;
    }>;
    geometry?: string;
    overview_polyline?: string;
  };
}

// バックエンドAPIのベースURL
const API_BASE_URL = "http://localhost:3001/api";

// アイコン作成用のヘルパー関数
const createStartIcon = () => L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const createEndIcon = () => L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function RouteResultMap() {
  const searchParams = useSearchParams();
  const [fromCoord, setFromCoord] = useState<Coordinate | null>(null);
  const [toCoord, setToCoord] = useState<Coordinate | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>("パラメータ解析中...");
  const [isClient, setIsClient] = useState<boolean>(false);
  const [leafletIcons, setLeafletIcons] = useState<{
    startIcon: L.Icon;
    endIcon: L.Icon;
  } | null>(null);
  const [routeSteps, setRouteSteps] = useState<Array<any>>([]);
  const [routeId, setRouteId] = useState<number | null>(null);

  // URLパラメータを取得
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const timeParam = searchParams.get('time');

  const router = useRouter();

  // アイコンを初期化する関数
  const initializeIcons = () => {
    if (typeof window !== "undefined") {
      try {
        const startIcon = createStartIcon();
        const endIcon = createEndIcon();
        
        setLeafletIcons({ startIcon, endIcon });
        
        console.log("✅ Leaflet初期化完了");
        return true;
      } catch (err) {
        console.error("Leaflet初期化エラー:", err);
        throw new Error("マップライブラリの初期化に失敗しました");
      }
    }
    return false;
  };

  // 現在地を取得する関数
  const getCurrentLocation = async (): Promise<Coordinate> => {
    console.log("📍 現在地取得開始");
    
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = "このブラウザでは位置情報が利用できません。";
        console.error("❌ " + errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coordinate = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          };
          console.log("✅ 現在地取得成功:", coordinate);
          resolve(coordinate);
        },
        (err) => {
          const errorMsg = "位置情報の取得に失敗しました: " + err.message;
          console.error("❌ " + errorMsg);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  // ジオコーディング関数（住所 → 座標）
  const geocodeAddress = async (address: string): Promise<Coordinate> => {
    console.log(`🔍 ジオコーディング開始: "${address}"`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=jp&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NavigationApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`ジオコーディングAPI エラー: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📍 ジオコーディング結果 (${address}):`, data);
      
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
        console.log(`✅ 座標変換成功 (${address}):`, result);
        return result;
      } else {
        throw new Error(`住所が見つかりませんでした: ${address}`);
      }
    } catch (err) {
      console.error(`❌ ジオコーディング失敗 (${address}):`, err);
      throw err;
    }
  };

  // 座標取得関数（現在地または住所に対応）
  const getCoordinate = async (location: string): Promise<Coordinate> => {
    if (location === "現在地") {
      return await getCurrentLocation();
    } else {
      return await geocodeAddress(location);
    }
  };

  // バックエンドAPIを使用したルート取得関数（新しいDB形式対応）
  const fetchRoute = async (from: Coordinate, to: Coordinate) => {
    console.log("🚗 ルート取得開始（バックエンドAPI使用）:", { from, to });
    
    try {
      const requestBody = {
        origin: {
          lat: from.lat,
          lng: from.lon
        },
        destination: {
          lat: to.lat,
          lng: to.lon
        },
        profile: "walking",
        includeSteps: true,
        requestedDuration: timeParam ? parseInt(timeParam) * 60 : null 
      };

      console.log("📤 API送信データ:", requestBody);

      const response = await fetch(`${API_BASE_URL}/routes/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API エラーレスポンス:", errorText);
        throw new Error(`バックエンドAPI エラー: ${response.status} ${response.statusText}`);
      }
      
      const data: RouteResponse = await response.json();
      console.log("📊 バックエンドAPI ルート取得結果:", data);
      
      if (data.success && data.data && data.data.route) {
        const route = data.data.route;
        
        // ルートIDを保存（後で保存機能で使用）
        if (route.id) {
          setRouteId(route.id);
        }
        
        // 座標データの処理
        let coords: [number, number][] = [];
        
        if (data.data.coordinates && data.data.coordinates.length > 0) {
          // coordinatesが存在する場合
          coords = data.data.coordinates.map(coord => [coord.lat, coord.lng] as [number, number]);
        } else {
          // coordinatesがない場合は始点と終点のみ表示
          coords = [
            [route.origin_lat, route.origin_lng],
            [route.destination_lat, route.destination_lng]
          ];
          console.log("⚠️ 詳細な座標情報がないため、始点と終点のみ表示します");
        }
        
        setRouteCoords(coords);
        setDistance((route.distance / 1000).toFixed(1));
        setDuration(Math.round(route.duration / 60)); // 秒から分に変換
        setRouteSteps(data.data.steps || []);
        
        console.log("✅ ルート設定完了:", {
          distance: (route.distance / 1000).toFixed(1) + "km",
          duration: Math.round(route.duration / 60) + "分",
          points: coords.length,
          steps: data.data.steps?.length || 0,
          routeId: route.id
        });
        
        return true;
      } else {
        throw new Error(data.message || "指定された地点間のルートが見つかりませんでした");
      }
    } catch (err) {
      console.error("❌ バックエンドAPI ルート取得エラー:", err);
      //エラーページに飛ぶ
      router.push("/error");
      return false;
      // // フォールバック: 直接OSRM APIを使用
      // console.log("🔄 フォールバック: 直接OSRM APIを使用");
      // return await fetchRouteOSRM(from, to);
    }
  };

  // // フォールバック用のOSRM API直接呼び出し
  // const fetchRouteOSRM = async (from: Coordinate, to: Coordinate) => {
  //   console.log("🚗 フォールバック ルート取得開始:", { from, to });
    
  //   try {
  //     await new Promise(resolve => setTimeout(resolve, 300));
      
  //     const response = await fetch(
  //       `https://router.project-osrm.org/route/v1/walking/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true`
  //     );
      
  //     if (!response.ok) {
  //       throw new Error(`OSRM API エラー: ${response.status} ${response.statusText}`);
  //     }
      
  //     const data = await response.json();
  //     console.log("📊 OSRM ルート取得結果:", data);
      
  //     if (data.routes && data.routes.length > 0) {
  //       const route = data.routes[0];
        
  //       if (!route.geometry || !route.geometry.coordinates) {
  //         throw new Error("ルートの詳細情報が取得できませんでした");
  //       }
        
  //       const coords = route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
        
  //       setRouteCoords(coords);
  //       setDistance((route.distance / 1000).toFixed(1));
  //       setDuration(Math.round(route.duration / 60)); // 秒から分に変換
        
  //       console.log("✅ フォールバック ルート設定完了");
  //       return true;
  //     } else {
  //       throw new Error("指定された地点間のルートが見つかりませんでした");
  //     }
  //   } catch (err) {
  //     console.error("❌ フォールバック ルート取得エラー:", err);
  //     throw err;
  //   }
  // };

  // 時間フォーマット関数
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}時間${remainingMinutes > 0 ? remainingMinutes + '分' : ''}`;
  };

  // 中心点とズームレベル計算
  const getMapSettings = () => {
    if (!fromCoord || !toCoord) {
      return { center: [35.681236, 139.767125] as [number, number], zoom: 13 };
    }
    
    const centerLat = (fromCoord.lat + toCoord.lat) / 2;
    const centerLon = (fromCoord.lon + toCoord.lon) / 2;
    
    const latDiff = Math.abs(fromCoord.lat - toCoord.lat);
    const lonDiff = Math.abs(fromCoord.lon - toCoord.lon);
    
    const maxDiff = Math.max(latDiff, lonDiff);
    let zoom = 15;
    
    if (maxDiff > 2) zoom = 7;
    else if (maxDiff > 1) zoom = 8;
    else if (maxDiff > 0.5) zoom = 9;
    else if (maxDiff > 0.2) zoom = 10;
    else if (maxDiff > 0.1) zoom = 11;
    else if (maxDiff > 0.05) zoom = 12;
    else if (maxDiff > 0.02) zoom = 13;
    else if (maxDiff > 0.01) zoom = 14;
    
    console.log(`🗺️ マップ設定: 中心点(${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}), ズーム: ${zoom}`);
    
    return { center: [centerLat, centerLon] as [number, number], zoom };
  };

  // ルートを保存する関数（新しいDB形式対応）
  const saveRoute = async () => {
    if (!fromCoord || !toCoord || !fromParam || !toParam) {
      alert("ルート情報が不完全です");
      return;
    }

    try {
      // 既にルートが保存されている場合は保存済みメッセージを表示
      if (routeId) {
        alert(`ルートは既に保存済みです (ID: ${routeId})`);
        return;
      }

      const saveData = {
        name: `${fromParam}から${toParam}へのルート`,
        description: `時間制限: ${timeParam ? timeParam + '分' : 'なし'}`,
        origin: {
          lat: fromCoord.lat,
          lng: fromCoord.lon
        },
        destination: {
          lat: toCoord.lat,
          lng: toCoord.lon
        },
        profile: "walking",
        detourLevel: 1,
        routeType: "normal"
      };

      console.log("💾 ルート保存データ:", saveData);

      const response = await fetch(`${API_BASE_URL}/routes/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        const result: RouteResponse = await response.json();
        console.log("✅ ルート保存成功:", result);
        
        if (result.success && result.data && result.data.route && result.data.route.id) {
          setRouteId(result.data.route.id);
          alert(`ルートが保存されました (ID: ${result.data.route.id})`);
        } else {
          alert("ルートが保存されました");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "ルート保存に失敗しました");
      }
    } catch (err) {
      console.error("❌ ルート保存エラー:", err);
      const errorMessage = err instanceof Error ? err.message : "ルート保存に失敗しました";
      alert(errorMessage);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializeNavigation = async () => {
      try {
        console.log("🚀 ナビゲーション初期化開始");
        console.log("📋 URLパラメータ:", { from: fromParam, to: toParam, time: timeParam });
        
        if (!fromParam || !toParam) {
          throw new Error("出発地または目的地が指定されていません");
        }
        
        if (typeof window === "undefined") {
          return;
        }
        
        if (!isMounted) return;
        setIsClient(true);
        
        // Leafletアイコンを初期化
        if (!isMounted) return;
        setStep("マップライブラリを初期化中...");
        initializeIcons();
        
        // 出発地の座標取得
        if (!isMounted) return;
        setStep(fromParam === "現在地" ? "現在地を取得中..." : "出発地の座標を取得中...");
        const fromCoords = await getCoordinate(fromParam);
        if (!isMounted) return;
        setFromCoord(fromCoords);
        
        // 目的地の座標取得
        if (!isMounted) return;
        setStep("目的地の座標を取得中...");
        const toCoords = await getCoordinate(toParam);
        if (!isMounted) return;
        setToCoord(toCoords);
        
        // ルート計算
        if (!isMounted) return;
        setStep("ルートを計算中...");
        await fetchRoute(fromCoords, toCoords);
        if (!isMounted) return;
        
        setStep("完了");
        setLoading(false);
        console.log("🎉 全ての初期化処理が完了しました");
        
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました";
        console.error("❌ ナビゲーション初期化エラー:", errorMessage);
        
        setError(errorMessage);
        setLoading(false);
      }
    };
    
    initializeNavigation();
    
    return () => {
      isMounted = false;
    };
  }, [fromParam, toParam, timeParam]);
  
  useEffect(() => {
    if (routeSteps.length > 0 && routeCoords.length > 0) {
      sessionStorage.setItem("routeSteps", JSON.stringify(routeSteps));
      sessionStorage.setItem("routeCoordinates", JSON.stringify(routeCoords));
      console.log("✅ routeSteps と routeCoordinates を sessionStorage に保存しました");
    }
  }, [routeSteps, routeCoords]);
  
  if (loading || !isClient || !leafletIcons) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{step}</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>出発地: {fromParam}</p>
            <p>目的地: {toParam}</p>
            {timeParam && <p>制限時間: {timeParam}分</p>}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">エラーが発生しました</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="mb-4 text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
            <p><strong>出発地:</strong> {fromParam}</p>
            <p><strong>目的地:</strong> {toParam}</p>
            {timeParam && <p><strong>制限時間:</strong> {timeParam}分</p>}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              再試行
            </button>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { center, zoom } = getMapSettings();

  return (
    <div className="h-screen w-screen relative" style={{ height: "100vh", width: "100vw" }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: "75%", width: "100%" }}
        className="z-0"
       >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* ルート表示 */}
        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords} 
            color="#2563eb" 
            weight={6}
            opacity={0.8}
            dashArray="0"
          />
        )}
        
        {/* 出発地マーカー */}
        {fromCoord && leafletIcons && (
          <Marker position={[fromCoord.lat, fromCoord.lon]} icon={leafletIcons.startIcon}>
            <Popup>
              <div className="text-center p-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <strong className="text-green-700">出発地</strong>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  {fromParam === "現在地" ? "現在地" : fromParam}
                </div>
                <div className="text-xs text-gray-500">
                  緯度: {fromCoord.lat.toFixed(6)}<br />
                  経度: {fromCoord.lon.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* 目的地マーカー */}
        {toCoord && leafletIcons && (
          <Marker position={[toCoord.lat, toCoord.lon]} icon={leafletIcons.endIcon}>
            <Popup>
              <div className="text-center p-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <strong className="text-red-700">目的地</strong>
                </div>
                <div className="text-sm text-gray-700 mb-2">{toParam}</div>
                <div className="text-xs text-gray-500">
                  緯度: {toCoord.lat.toFixed(6)}<br />
                  経度: {toCoord.lon.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* 上部情報パネル */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-md z-[1000] w-[90%] max-w-md px-4 py-3">
        {/* 上のバー */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />

        {/* 時間と距離 */}
        <div className="text-center mb-3">
          <div className="text-lg font-bold text-gray-800 mb-1">
            {duration ? formatDuration(duration) : '計算中...'} ({distance}km)
          </div>
          
          {timeParam && duration && (
            <div className={`text-sm font-medium ${
              duration <= parseInt(timeParam)
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {duration <= parseInt(timeParam)
                ? `制限時間内に到着可能`
                : `制限時間を${duration - parseInt(timeParam)}分超過`
              }
            </div>
          )}

          {routeSteps.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {routeSteps.length}つのステップ
            </div>
          )}

          {routeId && (
            <div className="text-xs text-blue-600 mt-1">
              ルートID: {routeId}
            </div>
          )}
        </div>

        {/* ボタンエリア */}
        <div className="flex justify-between gap-3">
          <button 
            onClick={() => window.history.back()}
            className="flex-1 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            入力に戻る
          </button>

          <button 
            onClick={saveRoute}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
              routeId 
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={!!routeId}
          >
            {routeId ? '保存済み' : '保存'}
          </button>

          <button 
            onClick={() => {
              if (routeSteps.length > 0) {
                sessionStorage.setItem("routeSteps", JSON.stringify(routeSteps));
              }
              router.push("/navigating");
            }}
            className="flex-1 py-2 rounded-full bg-green-800 text-white text-sm font-semibold flex items-center justify-center gap-1 hover:bg-green-700 transition-colors"
          >
            <span>🧭</span>
            開始
          </button>
        </div>
      </div>
    </div>
  );
}