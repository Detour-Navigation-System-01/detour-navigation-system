/**
 * @fileoverview 経路表示ページコンポーネント
 * @description 旅行情報のナビゲーション結果とナビゲーション開始ボタンを表示するページ
 * @author 尾﨑諒
 * @created 2025-06-24
 * @updated 2025-07-01
 * @version 1.0.1
 */

"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigatePage from '../../components/map/routeresultmap';
import RouteResultMap from '../../components/map/routeresultmap';
import NavigationBottomSheet from '@/components/navigation/NavigationBottomSheet';

// Loading コンポーネント
function NavigateLoading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}

interface NavigatePageProps {
  onComplete?: () => void;
}


export default function Navigate() {
  const [showButtons, setShowButtons] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [timeParam, setTimeParam] = useState<string | null>(null);
  const [isNearStart, setIsNearStart] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    console.log("Navigate page rendered");

    // スクロール禁止
    document.body.style.overflow = 'hidden';
    
    // ページロード時に現在地と出発地の距離をチェック
    const checkLocationOnLoad = () => {
      const fromCoordStr = sessionStorage.getItem("fromCoord");
      if (fromCoordStr) {
        try {
          navigator.geolocation.getCurrentPosition((position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            
            const fromCoord = JSON.parse(fromCoordStr);
            const distance = getDistanceMeters(
              currentLat,
              currentLng,
              fromCoord.lat,
              fromCoord.lon
            );
            
            console.log(`初期ロード時: 現在地と出発地点の距離: ${distance}m`);
            setDistance(distance);
            
            // 許容距離（200m）以内なら移動可能
            if (distance <= 200) {
              setIsNearStart(true);
              console.log("出発地の近くにいます");
            } else {
              setIsNearStart(false);
              console.log("出発地から離れています");
            }
          }, (error) => {
            console.error("位置情報の取得に失敗しました:", error);
            // エラー時はデフォルトでtrueに設定
            setIsNearStart(true);
          });
        } catch (err) {
          console.error("出発地点情報の解析エラー:", err);
          setIsNearStart(true);
        }
      } else {
        // 出発地情報がない場合はtrueに設定
        setIsNearStart(true);
      }
    };
    
    // 位置情報チェックを実行
    checkLocationOnLoad();
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  const handleNavigateComplete = () => {
    console.log("handleNavigateComplete called");
    setShowButtons(true);
    
    // 保存された経路情報を取得
    const distanceStr = sessionStorage.getItem("distance");
    const durationStr = sessionStorage.getItem("duration");
    const timeLimitParam = sessionStorage.getItem("timeParam") || new URLSearchParams(window.location.search).get("time");
    
    if (distanceStr) setDistance(parseFloat(distanceStr));
    if (durationStr) setDuration(parseInt(durationStr));
    if (timeLimitParam) setTimeParam(timeLimitParam);
  }
  
  const handleNavigateStart = () => {
    // 現在地と出発地の距離をチェック
    setLoading(true); // ローディング状態を有効にして、ボタンの状態を変更
    console.log("Navigate: handleNavigateStartが呼び出されました");
    
    // 最悪の場合でも5秒後にはナビゲーションを開始する
    const navigationTimeout = setTimeout(() => {
      console.log("位置情報取得のタイムアウト - ナビゲーションを強制開始します");
      window.location.href = '/navigating';
    }, 5000);
    
    // fromCoord（出発地点）の取得
    const fromCoordStr = sessionStorage.getItem("fromCoord");
    if (fromCoordStr) {
      try {
        // 現在地を取得
        navigator.geolocation.getCurrentPosition((position) => {
          clearTimeout(navigationTimeout); // タイムアウトをクリア
          
          const currentLat = position.coords.latitude;
          const currentLng = position.coords.longitude;
          
          const fromCoord = JSON.parse(fromCoordStr);
          const distance = getDistanceMeters(
            currentLat,
            currentLng,
            fromCoord.lat,
            fromCoord.lon
          );
          
          // setDistanceを呼び出さないことで、ボトムシートの表示が変わらないようにする
          // 代わりに一時変数に保存して使用する
          const currentDistance = distance;
          console.log(`現在地と出発地点の距離: ${currentDistance}m`);
          
          // 出発地との距離を保存
          sessionStorage.setItem("startDistance", currentDistance.toString());
          
          // 許容距離（200m）以内なら移動可能
          const isNear = distance <= 200;
          if (isNear) {
            console.log("出発地の近くにいます - ナビゲーションを開始します");
            
            // 両方の手法で確実に遷移する
            router.push('/navigating');
            setTimeout(() => {
              window.location.href = '/navigating';
            }, 200);
          } else {
            console.log("出発地から離れています - モーダルを表示します");
            // モーダル表示のためだけにsetIsNearStartを更新する
            setIsNearStart(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("位置情報の取得に失敗しました:", error);
          // エラーの場合もナビゲーションは開始する
          clearTimeout(navigationTimeout);
          router.push('/navigating');
          setLoading(false);
        }, {
          timeout: 4000, // 4秒でタイムアウト
          maximumAge: 0,  // キャッシュを使用しない
          enableHighAccuracy: false // 高精度モードは必要なし（バッテリー節約）
        });
      } catch (err) {
        console.error("出発地点情報の解析エラー:", err);
        clearTimeout(navigationTimeout);
        router.push('/navigating');
        setLoading(false); // エラー発生時もローディングを解除
      }
    } else {
      // 出発地情報がない場合はとりあえずナビゲーションを開始
      console.log("出発地情報がありません - 無条件でナビゲーションを開始します");
      clearTimeout(navigationTimeout);
      router.push('/navigating');
      setLoading(false);
    }
  }
  
  const handleBack = () => {
    window.history.back();
  }
  
  // 2点間の距離をメートル単位で計算する関数
  function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // 地球の半径（メートル）
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
  
  return (
    <Suspense fallback={<NavigateLoading />}>
      <RouteResultMap onComplete={handleNavigateComplete} />
      {showButtons && (
        <NavigationBottomSheet
          mode="navigate"
          onNavigateStart={handleNavigateStart}
          onBack={handleBack}
          distance={distance}
          duration={duration}
          timeParam={timeParam}
          isNearStart={isNearStart}
          loading={loading}
        />
      )}
    </Suspense>
  );
}