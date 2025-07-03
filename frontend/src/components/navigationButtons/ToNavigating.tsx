/**
 * @fileoverview ナビゲーション開始画面のボタンコンポーネント
 * @description
 * - 「ナビゲーション開始」ボタン（/navigating ページへ遷移）
 * - 「入力に戻る」ボタン（ブラウザ履歴で前の画面に戻る）
 * - タッチ時の拡大縮小アニメーション対応
 * 
 * @author 尾﨑諒
 * @created 2025/07/03
 * @updated 2025/07/03
 * @version 1.0.0
 */

"use client";

import { useRouter } from "next/navigation";

export default function ToNavigating() {
  const router = useRouter();

  const backStyle = {
    position: "absolute" as const,
    top: "82vh",
    left: "22%",
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
    left: "70%",
    transform: "translateX(-50%)",
    width: "50vw",
    height: "8vh",
    minHeight: "48px",
    fontSize: "1.3rem", // ← bigger text
    fontWeight: 600,
    backgroundColor: "#003300",
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

  
  return (
    <>
      
      <button
        style={toNavigatingStyle}
        onClick={() => {
          router.push("/navigating");
        }}
        onTouchStart={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%) scale(0.95)")
        }
        onTouchEnd={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%)")
        }
      >
        ナビゲーション開始
      </button>


      <button style={backStyle} onClick={() => window.history.back()}>
        入力に戻る
      </button>
      
      
    </>
  );
}
