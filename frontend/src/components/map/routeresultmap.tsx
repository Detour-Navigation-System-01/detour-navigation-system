/**
 * @fileoverview 経路検索結果の提示をするための地図表示コンポーネント
 * @description 出発地、目的地、制限時間を取得し、ジオコーディングを行いバックエンドで生成されたルートを表示します。
 * @author 尾﨑諒
 * @created 2025-06-24
 * @updated 2025-07-09
 * @version 5.0.6
 */

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

interface RouteResultMapProps {
  onComplete?: () => void;
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

export default function RouteResultMap({ onComplete }: RouteResultMapProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State variables
  const [fromCoord, setFromCoord] = useState<Coordinate | null>(null);
  const [toCoord, setToCoord] = useState<Coordinate | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>("パラメータ解析中...");
  const [isClient, setIsClient] = useState<boolean>(false);
  const [routeSteps, setRouteSteps] = useState<Array<any>>([]);
  const [routeId, setRouteId] = useState<number | null>(null);
  const [leafletIcons, setLeafletIcons] = useState<{
    startIcon: L.Icon;
    endIcon: L.Icon;
  } | null>(null);

  // URLパラメータを取得
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const timeParam = searchParams.get('time');

  // ブラウザ環境かどうかをチェックする関数
  const isBrowser = () => typeof window !== "undefined";

  // アイコンを初期化する関数
  const initializeIcons = () => {
    if (isBrowser()) {
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
      if (!isBrowser() || !navigator.geolocation) {
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
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

  // バックエンドAPIを使用したルート取得関数
  // const fetchRoute = async (from: Coordinate, to: Coordinate) => {
  //   console.log("🚗 ルート取得開始（バックエンドAPI使用）:", { from, to });
    
  //   try {
  //     const requestBody = {
  //       origin: {
  //         lat: from.lat,
  //         lng: from.lon
  //       },
  //       destination: {
  //         lat: to.lat,
  //         lng: to.lon
  //       },
  //       profile: "walking",
  //       includeSteps: true,
  //       requestedDuration: timeParam ? parseInt(timeParam) * 60 : null 
  //     };

  //     console.log("📤 API送信データ:", requestBody);

  //     const response = await fetch(`${API_BASE_URL}/routes/calculate`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Accept': 'application/json'
  //       },
  //       body: JSON.stringify(requestBody)
  //     });
      
  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error("❌ API エラーレスポンス:", errorText);
  //       throw new Error(`バックエンドAPI エラー: ${response.status} ${response.statusText}`);
  //     }
      
  //     const data: RouteResponse = await response.json();
  //     console.log("📊 バックエンドAPI ルート取得結果:", data);
      
  //     if (data.success && data.data && data.data.route) {
  //       const route = data.data.route;
        
  //       // ルートIDを保存
  //       if (route.id) {
  //         setRouteId(route.id);
  //       }
        
  //       // 座標データの処理
  //       let coords: [number, number][] = [];
        
  //       if (data.data.coordinates && data.data.coordinates.length > 0) {
  //         coords = data.data.coordinates.map(coord => [coord.lat, coord.lng] as [number, number]);
  //       } else {
  //         coords = [
  //           [route.origin_lat, route.origin_lng],
  //           [route.destination_lat, route.destination_lng]
  //         ];
  //         console.log("⚠️ 詳細な座標情報がないため、始点と終点のみ表示します");
  //       }
        
  //       setRouteCoords(coords);
  //       setDistance((route.distance / 1000).toFixed(1));
  //       setDuration(Math.round(route.duration / 60));
  //       setRouteSteps(data.data.steps || []);
        
  //       console.log("✅ ルート設定完了:", {
  //         distance: (route.distance / 1000).toFixed(1) + "km",
  //         duration: Math.round(route.duration / 60) + "分",
  //         points: coords.length,
  //         steps: data.data.steps?.length || 0,
  //         routeId: route.id
  //       });
        
  //       return true;
  //     } else {
  //       throw new Error(data.message || "指定された地点間のルートが見つかりませんでした");
  //     }
  //   } catch (err) {
  //     console.error("❌ バックエンドAPI ルート取得エラー:", err);
  //     sessionStorage.setItem("errorMessage", data.message);
  //     router.push("/error");
  //     return false;
  //   }
  // };

  // const fetchRoute = async (from: Coordinate, to: Coordinate) => {
  //   console.log("🚗 ルート取得開始（バックエンドAPI使用）:", { from, to });

  //   try {
  //     const requestBody = {
  //       origin: {
  //         lat: from.lat,
  //         lng: from.lon
  //       },
  //       destination: {
  //         lat: to.lat,
  //         lng: to.lon
  //       },
  //       profile: "walking",
  //       includeSteps: true,
  //       requestedDuration: timeParam ? parseInt(timeParam) * 60 : null
  //     };

  //     console.log("📤 API送信データ:", requestBody);

  //     const response = await fetch(`${API_BASE_URL}/routes/calculate`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Accept': 'application/json'
  //       },
  //       body: JSON.stringify(requestBody)
  //     });

  //     const responseText = await response.text();

  //     if (!response.ok) {
  //       console.error("❌ API エラーレスポンス:", responseText);

  //       try {
  //         const errorData = JSON.parse(responseText);
  //         if (errorData?.message) {
  //           sessionStorage.setItem("errorMessage", errorData.message);
  //         } else {
  //           sessionStorage.setItem("errorMessage", "ルート計算中に不明なエラーが発生しました。");
  //         }
  //       } catch (parseErr) {
  //         console.warn("⚠️ JSONパース失敗:", parseErr);
  //         sessionStorage.setItem("errorMessage", "ルート計算中に予期しないエラーが発生しました。");
  //       }
  //       sessionStorage.getItem("errorMessage");
  //       if (errorMessage) {
  //         console.log("保存されたエラーメッセージ:", errorMessage);
  //       }
  //       router.push("/error");
  //       return false;
  //     }

  //     const data: RouteResponse = JSON.parse(responseText);
  //     console.log("📊 バックエンドAPI ルート取得結果:", data);

  //     if (data.success && data.data && data.data.route) {
  //       const route = data.data.route;

  //       if (route.id) {
  //         setRouteId(route.id);
  //       }

  //       let coords: [number, number][] = [];

  //       if (data.data.coordinates && data.data.coordinates.length > 0) {
  //         coords = data.data.coordinates.map(coord => [coord.lat, coord.lng] as [number, number]);
  //       } else {
  //         coords = [
  //           [route.origin_lat, route.origin_lng],
  //           [route.destination_lat, route.destination_lng]
  //         ];
  //         console.log("⚠️ 詳細な座標情報がないため、始点と終点のみ表示します");
  //       }

  //       setRouteCoords(coords);
  //       setDistance((route.distance / 1000).toFixed(1));
  //       setDuration(Math.round(route.duration / 60));
  //       setRouteSteps(data.data.steps || []);

  //       console.log("✅ ルート設定完了:", {
  //         distance: (route.distance / 1000).toFixed(1) + "km",
  //         duration: Math.round(route.duration / 60) + "分",
  //         points: coords.length,
  //         steps: data.data.steps?.length || 0,
  //         routeId: route.id
  //       });

  //       return true;
  //     } else {
  //       const fallbackMessage = data.message || "指定された地点間のルートが見つかりませんでした";
  //       sessionStorage.setItem("errorMessage", fallbackMessage);
  //       router.push("/error");
  //       return false;
  //     }
  //   } catch (err) {
  //     console.error("❌ バックエンドAPI ルート取得エラー:", err);
  //     sessionStorage.setItem("errorMessage", "ルート取得中にエラーが発生しました。");
  //     const errorMessage = sessionStorage.getItem("errorMessage");
  //     if (errorMessage) {
  //       console.log("保存されたエラーメッセージ:", errorMessage);
  //     }
  //     router.push("/error");
  //     return false;
  //   }
  // };

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

      const responseText = await response.text();

      // HTTPステータスエラー時
      if (!response.ok) {
        console.error("❌ API エラーレスポンス:", responseText);

        try {
          const errorData = JSON.parse(responseText);
          const message = errorData?.message || "ルート計算中に不明なエラーが発生しました。";
          sessionStorage.setItem("errorMessage", message);
          console.log("💾 保存されたエラーメッセージ:", message);
        } catch (parseErr) {
          console.warn("⚠️ JSONパース失敗:", parseErr);
          sessionStorage.setItem("errorMessage", "ルート計算中に予期しないエラーが発生しました。");
        }

        router.push("/error");
        return false;
      }

      // HTTPは成功 → JSONに変換
      const data: RouteResponse = JSON.parse(responseText);
      console.log("📊 バックエンドAPI ルート取得結果:", data);

      // ルート取得成功時の処理
      if (data.success && data.data && data.data.route) {
        const route = data.data.route;

        if (route.id) {
          setRouteId(route.id);
        }

        const coords: [number, number][] =
          data.data.coordinates?.length > 0
            ? data.data.coordinates.map(coord => [coord.lat, coord.lng] as [number, number])
            : [
                [route.origin_lat, route.origin_lng],
                [route.destination_lat, route.destination_lng]
              ];

        if (!data.data.coordinates?.length) {
          console.log("⚠️ 詳細な座標情報がないため、始点と終点のみ表示します");
        }

        setRouteCoords(coords);
        setDistance((route.distance / 1000).toFixed(1));
        setDuration(Math.round(route.duration / 60));
        setRouteSteps(data.data.steps || []);

        console.log("✅ ルート設定完了:", {
          distance: (route.distance / 1000).toFixed(1) + "km",
          duration: Math.round(route.duration / 60) + "分",
          points: coords.length,
          steps: data.data.steps?.length || 0,
          routeId: route.id
        });

        return true;
      }

      // success: false の場合
      const fallbackMessage = data.message || "指定された地点間のルートが見つかりませんでした";
      sessionStorage.setItem("errorMessage", fallbackMessage);
      console.error("⚠️ API結果エラー:", fallbackMessage);
      router.push("/error");
      return false;
    } catch (err) {
      console.error("❌ バックエンドAPI ルート取得エラー:", err);
      const defaultError = "ルート取得中にエラーが発生しました。";
      sessionStorage.setItem("errorMessage", defaultError);
      console.log("💾 保存されたエラーメッセージ:", defaultError);
      router.push("/error");
      return false;
    }
  };

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

  // 地図読み込み完了時の処理
  const handleMapReady = () => {
    console.log("🗺️ 地図読み込み完了");
    // onComplete コールバックを呼び出す
    if (onComplete) {
      console.log("📞 onComplete コールバック呼び出し");
      onComplete();
    }
  };

  // ページリロード処理（ブラウザ環境チェック付き）
  const handleReload = () => {
    if (isBrowser()) {
      window.location.reload();
    } else {
      // フォールバック: Next.jsルーターでリフレッシュ
      router.refresh();
    }
  };

  // 前のページに戻る処理（ブラウザ環境チェック付き）
  const handleGoBack = () => {
    if (isBrowser() && window.history.length > 1) {
      window.history.back();
    } else {
      // フォールバック: Next.jsルーターで戻る
      router.back();
    }
  };

  // 初期化処理
  useEffect(() => {
    let isMounted = true;
    
    const initializeNavigation = async () => {
      try {
        console.log("🚀 ナビゲーション初期化開始");
        console.log("📋 URLパラメータ:", { from: fromParam, to: toParam, time: timeParam });
        
        if (!fromParam || !toParam) {
          throw new Error("出発地または目的地が指定されていません");
        }
        
        if (!isBrowser()) {
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
        const success = await fetchRoute(fromCoords, toCoords);
        if (!isMounted) return;
        
        if (success) {
          setStep("完了");
          setLoading(false);
          console.log("🎉 全ての初期化処理が完了しました");
        }
        
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
  }, [fromParam, toParam, timeParam, onComplete]);
  
  // routeSteps、routeCoords、目的地パラメータ、出発地点の座標をsessionStorageに保存
  useEffect(() => {
    if (routeSteps.length > 0 && routeCoords.length > 0 && isBrowser()) {
      sessionStorage.setItem("routeSteps", JSON.stringify(routeSteps));
      sessionStorage.setItem("routeCoordinates", JSON.stringify(routeCoords));
      
      // 目的地パラメータを保存
      if (toParam) {
        sessionStorage.setItem("toParam", toParam);
      }
      
      // 出発地の座標を保存
      if (fromCoord) {
        sessionStorage.setItem("fromCoord", JSON.stringify(fromCoord));
      }
      
      // 目的地の座標を保存
      if (toCoord) {
        sessionStorage.setItem("toCoord", JSON.stringify(toCoord));
      }
      
      // 距離と所要時間も保存
      if (distance) {
        sessionStorage.setItem("distance", distance);
      }
      
      if (duration) {
        sessionStorage.setItem("duration", duration.toString());
      }
      
      // 制限時間も保存
      if (timeParam) {
        sessionStorage.setItem("timeParam", timeParam);
      }
      
      console.log("✅ ナビゲーション情報を sessionStorage に保存しました", {
        stepsCount: routeSteps.length,
        coordsCount: routeCoords.length,
        fromCoord,
        toCoord,
        distance,
        duration,
        toParam
      });
    }
  }, [routeSteps, routeCoords, fromCoord, toCoord, toParam, distance, duration, timeParam]);
  
  // Loading状態
  if (loading || !isClient || !leafletIcons) {
    return (
        <div 
          className="fixed top-0 left-0 w-full h-full z-50"
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            padding: '1rem',
            background: `url('/map.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: 'rgba(255,255,255,0.2)',
            transition: 'backdrop-filter 0.3s ease-in-out'
          }}
        >
          <div 
            style={{
              backgroundColor: 'rgba(255,255,255,0.85)',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15), 0 2px 5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              Width: '350px',
              maxWidth: '80%',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              animation: 'fadeIn 0.5s ease-out'
            }}
          >
            {/* 地図&コンパスをイメージしたアニメーション SVG */}
            <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              {/* 外側の円 - コンパスベース */}
              <circle
                cx="32"
                cy="32"
                r="30"
                stroke="#e0e0e0"
                strokeWidth="2"
                fill="none"
              />
              
              {/* コンパス針 - 回転するパーツ */}
              <g style={{
                transformOrigin: 'center',
                animation: 'compassSpin 2s ease-in-out infinite'
              }}>
                <path 
                  d="M32,8 L28,32 L32,56 L36,32 Z" 
                  fill="#3498db" 
                  stroke="#2980b9"
                  strokeWidth="1"
                />
                <circle cx="32" cy="32" r="4" fill="white" stroke="#3498db" strokeWidth="2" />
                <circle cx="32" cy="32" r="1" fill="#3498db" />
              </g>
              
              {/* 方位記号 */}
              <text x="32" y="14" textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">N</text>
              <text x="32" y="54" textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">S</text>
              <text x="54" y="34" textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">E</text>
              <text x="10" y="34" textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">W</text>
              
              {/* パルスエフェクト - ルート検索中をイメージ */}
              <circle 
                cx="32" 
                cy="32" 
                r="20" 
                stroke="#3498db" 
                strokeWidth="1.5" 
                fill="none"
                strokeDasharray="6,3"
                style={{
                  transformOrigin: 'center',
                  animation: 'pulse 3s ease-in-out infinite'
                }}
              />
            </svg>
            <style jsx>{`
              @keyframes compassSpin {
                0% { transform: rotate(0deg); }
                25% { transform: rotate(90deg); }
                50% { transform: rotate(180deg); }
                75% { transform: rotate(270deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes pulse {
                0% { r: 20; opacity: 0.8; }
                50% { r: 24; opacity: 0.4; }
                100% { r: 20; opacity: 0.8; }
              }
              @keyframes fadeIn {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            <p className="text-blue-700 font-medium mt-4 mb-2" style={{fontSize: '1.1rem'}}>
              ルートを計算中...
            </p>

            <div className="space-y-2 mt-3 p-3 bg-blue-50 rounded-md border border-blue-100" style={{width: '100%'}}>
              <p style={{fontWeight: '500', color: '#334155', fontSize: '0.95rem'}}>
                <span style={{display: 'inline-block', width: '4.5em', color: '#64748b'}}>出発地:</span> 
                {fromParam}
              </p>
              <p style={{fontWeight: '500', color: '#334155', fontSize: '0.95rem'}}>
                <span style={{display: 'inline-block', width: '4.5em', color: '#64748b'}}>目的地:</span> 
                {toParam}
              </p>
              {timeParam && (
                <p style={{fontWeight: '500', color: '#334155', fontSize: '0.95rem'}}>
                  <span style={{display: 'inline-block', width: '4.5em', color: '#64748b'}}>制限時間:</span> 
                  {timeParam}分
                </p>
              )}
            </div>
          </div>
        </div>
    );
  }

  // Error状態
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
              onClick={handleReload}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              再試行
            </button>
            <button 
              onClick={handleGoBack}
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
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        whenReady={handleMapReady} // ✅ 地図読み込み完了時にコールバックを呼び出す
        zoomControl={false} // ズームコントロール（+/-ボタン）を非表示
        attributionControl={false} // コピーライト表示を非表示
      >
        <TileLayer
          attribution=''
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
    </div>
  );
}