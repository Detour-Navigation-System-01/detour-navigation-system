"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface Coordinate {
  lat: number;
  lon: number;
}

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

  // URLパラメータを取得
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const timeParam = searchParams.get('time');

  // アイコンを初期化する関数
  const initializeIcons = () => {
    if (typeof window !== "undefined") {
      try {
        // カスタムアイコンの作成
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

  // ジオコーディング関数（住所 → 座標）
  const geocodeAddress = async (address: string): Promise<Coordinate> => {
    console.log(`🔍 ジオコーディング開始: "${address}"`);
    
    try {
      // 少し待機を入れてAPIレート制限を回避
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Nominatim API（OpenStreetMapのジオコーディングサービス）を使用
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=jp&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NavigationApp/1.0' // User-Agentを追加
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

  // ルート取得関数
  const fetchRoute = async (from: Coordinate, to: Coordinate) => {
    console.log("🚗 ルート取得開始:", { from, to });
    
    try {
      // 少し待機を入れてAPIレート制限を回避
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true`
      );
      
      if (!response.ok) {
        throw new Error(`OSRM API エラー: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("📊 ルート取得結果:", data);
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // geometryが存在することを確認
        if (!route.geometry || !route.geometry.coordinates) {
          throw new Error("ルートの詳細情報が取得できませんでした");
        }
        
        const coords = route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
        
        setRouteCoords(coords);
        setDistance((route.distance / 1000).toFixed(1));
        setDuration(Math.round(route.duration / 60));
        
        console.log("✅ ルート設定完了:", {
          distance: (route.distance / 1000).toFixed(1) + "km",
          duration: Math.round(route.duration / 60) + "分",
          points: coords.length
        });
        
        return true;
      } else {
        throw new Error("指定された地点間のルートが見つかりませんでした");
      }
    } catch (err) {
      console.error("❌ ルート取得エラー:", err);
      throw err;
    }
  };

  // 時間フォーマット
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}時間${remainingMinutes > 0 ? remainingMinutes + '分' : ''}`;
  };

  // 中心点とズームレベル計算（改善版）
  const getMapSettings = () => {
    if (!fromCoord || !toCoord) {
      return { center: [35.681236, 139.767125] as [number, number], zoom: 13 };
    }
    
    // 中点を計算
    const centerLat = (fromCoord.lat + toCoord.lat) / 2;
    const centerLon = (fromCoord.lon + toCoord.lon) / 2;
    
    // 2点間の距離を計算してズームレベルを決定
    const latDiff = Math.abs(fromCoord.lat - toCoord.lat);
    const lonDiff = Math.abs(fromCoord.lon - toCoord.lon);
    
    // より適切なズームレベル計算
    const maxDiff = Math.max(latDiff, lonDiff);
    let zoom = 15;
    
    if (maxDiff > 2) zoom = 7;        // 200km以上
    else if (maxDiff > 1) zoom = 8;   // 100km程度
    else if (maxDiff > 0.5) zoom = 9; // 50km程度
    else if (maxDiff > 0.2) zoom = 10; // 20km程度
    else if (maxDiff > 0.1) zoom = 11; // 10km程度
    else if (maxDiff > 0.05) zoom = 12; // 5km程度
    else if (maxDiff > 0.02) zoom = 13; // 2km程度
    else if (maxDiff > 0.01) zoom = 14; // 1km程度
    
    console.log(`🗺️ マップ設定: 中心点(${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}), ズーム: ${zoom}, 距離差: ${maxDiff.toFixed(4)}`);
    
    return { center: [centerLat, centerLon] as [number, number], zoom };
  };

  useEffect(() => {
    let isMounted = true; // コンポーネントがマウントされているかのフラグ
    
    const initializeNavigation = async () => {
      try {
        console.log("🚀 ナビゲーション初期化開始");
        console.log("📋 URLパラメータ:", { from: fromParam, to: toParam, time: timeParam });
        
        // 早期リターンでパラメータチェック
        if (!fromParam || !toParam) {
          throw new Error("出発地または目的地が指定されていません");
        }
        
        // クライアントサイド確認
        if (typeof window === "undefined") {
          return;
        }
        
        if (!isMounted) return;
        setIsClient(true);
        
        // ステップ1: Leafletアイコンを初期化
        if (!isMounted) return;
        setStep("マップライブラリを初期化中...");
        console.log("📦 Leaflet初期化開始");
        initializeIcons();
        console.log("✅ Leaflet初期化完了");
        
        // ステップ2: 出発地の座標取得
        if (!isMounted) return;
        setStep("出発地の座標を取得中...");
        console.log("🏠 出発地ジオコーディング開始");
        const fromCoords = await geocodeAddress(fromParam);
        if (!isMounted) return;
        setFromCoord(fromCoords);
        console.log("✅ 出発地座標設定完了");
        
        // ステップ3: 目的地の座標取得
        if (!isMounted) return;
        setStep("目的地の座標を取得中...");
        console.log("🎯 目的地ジオコーディング開始");
        const toCoords = await geocodeAddress(toParam);
        if (!isMounted) return;
        setToCoord(toCoords);
        console.log("✅ 目的地座標設定完了");
        
        // ステップ4: ルート計算
        if (!isMounted) return;
        setStep("ルートを計算中...");
        console.log("🛣️ ルート計算開始");
        await fetchRoute(fromCoords, toCoords);
        if (!isMounted) return;
        console.log("✅ ルート計算完了");
        
        // 完了
        if (!isMounted) return;
        setStep("完了");
        setLoading(false);
        console.log("🎉 全ての初期化処理が完了しました");
        
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました";
        console.error("❌ ナビゲーション初期化エラー:", errorMessage);
        console.error("エラーの詳細:", err);
        
        setError(errorMessage);
        setLoading(false);
      }
    };
    
    // 初期化実行
    initializeNavigation();
    
    // クリーンアップ関数
    return () => {
      isMounted = false;
      console.log("🧹 useEffectクリーンアップ実行");
    };
  }, [fromParam, toParam, timeParam]); // 依存配列を明確化

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
    <div className="h-screen w-screen relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: "500px", width: "100%" }}
        className="z-0"
  //       center={[35.681236, 139.767125]} 
  // zoom={13} 
  // style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* ルート表示（マーカーより下に表示されるよう先に配置） */}
        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords} 
            color="#2563eb" 
            weight={6}
            opacity={0.8}
            dashArray="0"
          />
        )}
        
        {/* 出発地マーカー（緑色） */}
        {fromCoord && leafletIcons && (
          <Marker position={[fromCoord.lat, fromCoord.lon]} icon={leafletIcons.startIcon}>
            <Popup>
              <div className="text-center p-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <strong className="text-green-700">出発地</strong>
                </div>
                <div className="text-sm text-gray-700 mb-2">{fromParam}</div>
                <div className="text-xs text-gray-500">
                  緯度: {fromCoord.lat.toFixed(6)}<br />
                  経度: {fromCoord.lon.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* 目的地マーカー（赤色） */}
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

      {/* 情報表示パネル */}
      <div className="absolute top-4 left-4 bg-white p-6 rounded-xl shadow-lg z-[1000] min-w-[320px] max-w-[400px]">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
            🧭 ナビゲーション情報
          </h3>
          
          <div className="space-y-3 text-sm mb-4">
            <div className="flex items-start gap-3">
              <span className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></span>
              <div>
                <div className="font-medium text-gray-700">出発地</div>
                <div className="text-gray-600">{fromParam}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></span>
              <div>
                <div className="font-medium text-gray-700">目的地</div>
                <div className="text-gray-600">{toParam}</div>
              </div>
            </div>
            
            {timeParam && (
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mt-1 flex-shrink-0"></span>
                <div>
                  <div className="font-medium text-gray-700">制限時間</div>
                  <div className="text-gray-600">{timeParam}分</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">距離:</span>
              <span className="text-lg font-semibold text-blue-600">{distance} km</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">予想時間:</span>
              <span className="text-lg font-semibold text-blue-600">
                {duration ? formatDuration(duration) : '計算中...'}
              </span>
            </div>
            
            {timeParam && duration && (
              <div className={`text-sm p-3 rounded-lg font-medium ${
                duration <= parseInt(timeParam) 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {duration <= parseInt(timeParam) 
                  ? `✅ 制限時間内に到着可能です` 
                  : `⚠️ 制限時間を${duration - parseInt(timeParam)}分超過します`
                }
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors flex-1"
          >
            戻る
          </button>
          
          <button 
            onClick={() => {
              console.log("🧭 ナビゲーション開始");
              alert("ナビゲーション開始！");
            }}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex-1"
          >
            ナビ開始
          </button>
        </div>
      </div>
    </div>
  );
}