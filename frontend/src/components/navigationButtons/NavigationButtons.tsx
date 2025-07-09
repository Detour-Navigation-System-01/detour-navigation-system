/**
 * @fileoverview 入力画面のためのボタンコンポーネント
 * @description 入力画面への遷移ボタン（虫眼鏡アイコン付き）
 * @author 尾﨑諒
 * @created 2025-06-17
 * @updated 2025-07-09
 * @version 1.0.6
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
    left: "50%", // 中央に配置
    transform: "translateX(-50%)",
    width: "90%", // 画面幅の90%に設定
    maxWidth: "600px", // 最大幅を設定して大きな画面でも適切なサイズに
    height: "10vh",
    minHeight: "48px",
    maxHeight: "60px", // 高さも最大値を設定
    fontSize: "1.3rem",
    fontWeight: 600,
    backgroundColor: "white", // スペルミスを修正
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
        onClick={() => {
          // 明示的にフラグを削除して、入力データが復元されないようにする
          sessionStorage.removeItem("fromInputForm");
          router.push("/input?focus=from");
        }}
        onTouchStart={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%) scale(0.95)")
        }
        onTouchEnd={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%)")
        }
      >
        {/* 虫眼鏡アイコン */}
        <img
          src="/icons/musimegane.svg"
          alt="検索"
          width={24}
          height={24}
          style={{ 
            flexShrink: 0,
            filter: 'brightness(0)'  // SVGを黒色に変換
          }}
        />
        <span style={{ color: "#666", fontWeight: 400 }}>行き先を入力...</span>
        
      </button>

      
    </>
  );
}
