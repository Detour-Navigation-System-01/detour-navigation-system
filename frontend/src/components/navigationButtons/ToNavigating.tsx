/**
 * @fileoverview 経路表示画面のナビ開始ボタンコンポーネント
 * @description ナビゲーション画面への遷移ボタンと戻るボタン、現在地とルートの出発地の距離を確認する機能を含む
 * @author 尾﨑諒
 * @created 2025-06-24
 * @updated 2025-07-08
 * @version 3.2.0
 */

"use client";

// アニメーションのためのグローバルスタイル
const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

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

export default function ToNavigating() {
  const router = useRouter();
  const [isNearStart, setIsNearStart] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  
  // 許容距離（メートル） - この距離より遠いとナビゲーション開始ができない
  const MAX_ALLOWED_DISTANCE = 200; 

  useEffect(() => {
    const checkLocationProximity = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        
        // fromCoord（出発地点）の取得を試みる
        let startLat: number;
        let startLng: number;
        
        // 保存された出発地点情報を優先して取得
        const fromCoordStr = sessionStorage.getItem("fromCoord");
        if (fromCoordStr) {
          try {
            const fromCoord = JSON.parse(fromCoordStr);
            console.log("出発地点情報を取得:", fromCoord);
            startLat = fromCoord.lat;
            startLng = fromCoord.lon;
          } catch (err) {
            console.error("出発地点情報の解析エラー:", err);
            // エラー時はルート座標から取得を試みる
            const routeCoordinates = sessionStorage.getItem("routeCoordinates");
            if (!routeCoordinates) {
              console.error("ルート情報が見つかりません");
              setErrorMessage("ルート情報が見つかりません");
              setIsNearStart(false);
              return;
            }
            
            const parsedCoords: [number, number][] = JSON.parse(routeCoordinates);
            if (parsedCoords.length === 0) {
              console.error("ルート座標が空です");
              setErrorMessage("ルート情報が不完全です");
              setIsNearStart(false);
              return;
            }
            
            // ルートの出発地点（最初の座標）を取得
            startLat = parsedCoords[0][0];
            startLng = parsedCoords[0][1];
          }
        } else {
          // 出発地点情報がない場合はルート座標から取得
          const routeCoordinates = sessionStorage.getItem("routeCoordinates");
          if (!routeCoordinates) {
            console.error("ルート情報が見つかりません");
            setErrorMessage("ルート情報が見つかりません");
            setIsNearStart(false);
            return;
          }
          
          const parsedCoords: [number, number][] = JSON.parse(routeCoordinates);
          if (parsedCoords.length === 0) {
            console.error("ルート座標が空です");
            setErrorMessage("ルート情報が不完全です");
            setIsNearStart(false);
            return;
          }
          
          // ルートの出発地点（最初の座標）を取得
          startLat = parsedCoords[0][0];
          startLng = parsedCoords[0][1];
        }
        
        console.log(`出発地点: 緯度=${startLat}, 経度=${startLng}`);
        
        // 現在地を取得
        await getCurrentLocation(startLat, startLng);
      } catch (err) {
        console.error("位置確認エラー:", err);
        setErrorMessage("位置情報の取得に失敗しました");
        setIsNearStart(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkLocationProximity();
  }, []);
  
  // 現在位置を取得して出発地点との距離を計算
  const getCurrentLocation = async (startLat: number, startLng: number) => {
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("このブラウザでは位置情報が利用できません");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const currentLat = pos.coords.latitude;
          const currentLng = pos.coords.longitude;
          
          // 現在地と出発地点の距離を計算
          const calculatedDistance = getDistanceMeters(
            currentLat, 
            currentLng, 
            startLat, 
            startLng
          );
          
          console.log(`現在地と出発地点の距離: ${calculatedDistance.toFixed(0)}m`);
          setDistance(calculatedDistance);
          
          // 距離が許容範囲内かどうかを設定
          setIsNearStart(calculatedDistance <= MAX_ALLOWED_DISTANCE);
          resolve();
        },
        (err) => {
          console.error("位置情報の取得に失敗:", err.message);
          reject(`位置情報の取得に失敗: ${err.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  const backStyle = {
    position: "absolute" as const,
    top: "82vh",
    left: "20%",
    transform: "translateX(-50%)",
    width: "30vw",
    height: "8vh",
    minHeight: "48px",
    fontSize: "1.3rem", // ← bigger text
    fontWeight: 600,
    backgroundColor: "#7fc37f",
    color: "white",
    border: "none",
    borderRadius: "50px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "transform 0.1s ease-in-out",
    zIndex: 1001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: "0",
    gap: "0.8em",
  };

  const toNavigatingStyle = {
    position: "absolute" as const,
    top: "82vh",
    left: "67%",
    transform: "translateX(-50%)",
    width: "55vw",
    height: "8vh",
    minHeight: "48px",
    fontSize: "1.3rem", // ← bigger text
    fontWeight: 600,
    backgroundColor: isNearStart ? "#003300" : "#777777", // 出発地から遠い場合はグレーに
    color: "white",
    border: "none",
    borderRadius: "50px",
    boxShadow: isNearStart ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.15)",
    transition: "transform 0.1s ease-in-out, background-color 0.2s ease",
    zIndex: 1001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: "0",
    gap: "0.8em",
    opacity: isNearStart ? 1 : 0.85, // 出発地から遠い場合は少し透明に
    cursor: loading ? "default" : "pointer", // ローディング中のみカーソルを変更
  };

  // エラーメッセージ用スタイル
  const errorStyle = {
    position: "absolute" as const,
    top: "75vh",
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    padding: "8px",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    color: "#cc0000",
    border: "1px solid #cc0000",
    borderRadius: "4px",
    fontSize: "0.9rem",
    textAlign: "center" as const,
    zIndex: 1000,
  };
  
  // モーダルオーバーレイ用スタイル
  const overlayStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    backdropFilter: "blur(2px)",
    animation: "fadeIn 0.2s ease-out",
  };
  
  // モーダルコンテンツ用スタイル
  const modalStyle = {
    backgroundColor: "white",
    padding: "30px 20px",
    borderRadius: "15px",
    width: "85%",
    maxWidth: "350px",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.4)",
    textAlign: "center" as const,
    position: "relative" as const,
    zIndex: 2001,
    animation: "fadeIn 0.3s ease-out"
  };
  
  // 場所ピン用SVGスタイル
  const pinStyle = {
    color: "#cc0000",
    fontSize: "60px",
    marginBottom: "15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
  
  // モーダル表示状態管理
  const [showModal, setShowModal] = useState<boolean>(false);
  
  const handleNavigateClick = () => {
    if (isNearStart) {
      // ナビゲーション開始時にセッションストレージにルート情報が存在することを確認
      const hasRouteData = sessionStorage.getItem("routeCoordinates") && sessionStorage.getItem("routeSteps");
      
      if (hasRouteData) {
        console.log("✅ セッションストレージにルートデータが存在。ナビゲーションを開始します");
        router.push("/navigating");
      } else {
        console.error("❌ セッションストレージにルートデータがありません");
        sessionStorage.setItem("errorMessage", "ルート情報が見つかりません。もう一度ルート検索をお試しください。");
        router.push("/error");
      }
    } else {
      // 出発地から離れている場合はモーダルを表示
      setShowModal(true);
    }
  };
  
  // グローバルスタイルを注入するコンポーネント
  const GlobalStyle = () => (
    <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
  );

  return (
    <>
      <GlobalStyle />
      {/* エラーメッセージ */}
      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}
      
      {/* 位置情報取得中のインジケーター */}
      {loading && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "15px 25px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 1000,
          textAlign: "center" as const,
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          gap: "10px"
        }}>
          <div style={{
            width: "30px",
            height: "30px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #003300",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <p style={{ margin: 0, fontSize: "1rem", color: "#333" }}>
            現在位置を確認中...
          </p>
        </div>
      )}
      
      {/* 距離エラー用モーダル */}
      {showModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={pinStyle}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="60px" height="60px">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h3 style={{ margin: "0 0 15px", color: "#cc0000", fontWeight: "bold", fontSize: "1.5rem" }}>出発地点から離れすぎています</h3>
            <p style={{ margin: "0 0 25px", fontSize: "1.1rem", lineHeight: "1.6" }}>
              出発地点から約 <strong style={{ fontSize: "1.3rem", color: "#cc0000" }}>{distance ? Math.round(distance) : "??"}</strong> m離れています。<br />
              <span style={{ color: "#555", marginTop: "10px", display: "block" }}>ナビゲーションを開始するには<br />出発地点の近くに移動してください。</span>
            </p>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                backgroundColor: "#003300",
                color: "white",
                border: "none",
                borderRadius: "25px",
                padding: "12px 30px",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = "#004400";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.3)";
              }}
              onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = "#003300";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      
      <button
        style={toNavigatingStyle}
        onClick={handleNavigateClick}
        disabled={loading} // ローディング中のみ無効化し、距離が遠い場合でも押せるようにする
        onTouchStart={(e: React.TouchEvent<HTMLButtonElement>) => {
          // スケールエフェクトは常に適用（isNearStartの判定を削除）
          e.currentTarget.style.transform = "translateX(-50%) scale(0.95)";
        }}
        onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => {
          // スケールエフェクトは常に適用（isNearStartの判定を削除）
          e.currentTarget.style.transform = "translateX(-50%)";
        }}
      >
      <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.4em"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
        {loading ? "位置確認中..." : "ナビ開始"}
      </button>

      <button style={backStyle} onClick={() => window.history.back()}>
        戻る
      </button>
    </>
  );
}
