/**
 * @fileoverview ナビゲーション画面のためのボタンコンポーネント
 * @description
 * - 入力画面への遷移ボタン（虫眼鏡アイコン付き）
 * - プロフィール画面への遷移ボタン
 * - カメラ画面への遷移ボタン
 * - タッチ時の簡易アニメーション効果付き
 * 
 * @author 尾﨑諒
 * @created 2025/07/03
 * @updated 2025/07/03
 * @version 1.0.0
 */

"use client";

import { useRouter } from "next/navigation";

export default function NavigationButtons() {
  const router = useRouter();

  const sharedButtonStyle = {
    position: "absolute" as const,
    right: "20px",
    zIndex: 1000,
    padding: "8px 12px",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  };

  const inputButtonStyle = {
    position: "absolute" as const,
    top: "5vh",
    left: "50%",
    transform: "translateX(-50%)",
    width: "60vw",
    height: "10vh",
    minHeight: "48px",
    fontSize: "1.3rem", // ← bigger text
    fontWeight: 600,
    backgroundColor: "while",
    color: "black",
    border: "none",
    borderRadius: "50px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "transform 0.1s ease-in-out",
    zIndex: 1001,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: "1.4em",
    gap: "0.8em",
  };

  
  return (
    <>
      <button
        style={inputButtonStyle}
        onClick={() => router.push("/input")}
        onTouchStart={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%) scale(0.95)")
        }
        onTouchEnd={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%)")
        }
      >
        {/* 拡大された虫眼鏡アイコン */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.6em"
          viewBox="0 0 24 24"
          fill="black"
          style={{ flexShrink: 0 }}
        >
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 
                   6.5 6.5 0 109.5 16c1.61 0 3.09-.59 
                   4.23-1.57l.27.28v.79l5 4.99L20.49 
                   19l-4.99-5zm-6 0C8.01 14 6 11.99 
                   6 9.5S8.01 5 10.5 5 15 7.01 15 
                   9.5 12.99 14 10.5 14z" />
        </svg>
        
      </button>

      
    </>
  );
}
