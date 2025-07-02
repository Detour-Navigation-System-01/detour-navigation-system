"use client";

import { useRouter } from "next/navigation";

export default function ToNavigating() {
  const router = useRouter();

  const backStyle = {
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

  const toNavigatingStyle = {
    position: "absolute" as const,
    top: "80vh",
    left: "80%",
    transform: "translateX(-50%)",
    width: "50vw",
    height: "10vh",
    minHeight: "48px",
    fontSize: "1.3rem", // ← bigger text
    fontWeight: 600,
    backgroundColor: "#0070f3",
    color: "#fff",
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
        style={toNavigatingStyle}
        onClick={() => router.push("/navigating")}
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
          fill="white"
          style={{ flexShrink: 0 }}
        >
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 
                   6.5 6.5 0 109.5 16c1.61 0 3.09-.59 
                   4.23-1.57l.27.28v.79l5 4.99L20.49 
                   19l-4.99-5zm-6 0C8.01 14 6 11.99 
                   6 9.5S8.01 5 10.5 5 15 7.01 15 
                   9.5 12.99 14 10.5 14z" />
        </svg>
        ナビゲーション開始
      </button>

      <button style={{ ...backStyle, top: "200px" }} onClick={() => router.push("/login")}>
        入力に戻る
      </button>
      
      
    </>
  );
}
