"use client";

import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/api";
import { useEffect, useState } from "react";

export default function ToCamera() {
  const router = useRouter();
  const [position, setPosition] = useState<[number, number] | null>(null);
 
// 現在地取得をuseEffectで行う
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("⚠️ Geolocation APIはこのブラウザでサポートされていません。");
      setPosition([35.681236, 139.767125]); // 東京駅（デフォルト）
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        console.log("✅ 現在地取得成功:", coords);
        setPosition(coords);
      },
      (err) => {
        console.error("❌ 位置情報取得に失敗:", {
          code: err.code,
          message: err.message,
        });
        setPosition([35.681236, 139.767125]); // 失敗時は東京駅
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);


  return (
    <>
      <button
        style={{
          position: "absolute",
          top: "80vh",
          left: "24%",
          width: "34vw",
          height: "6vh",
          minHeight: "40px",
          fontSize: "1.0rem",
          fontWeight: 500,
          color: "white",
          backgroundColor: "#003300",
          borderTopLeftRadius: "50px",
          borderBottomLeftRadius: "50px",
          border: "none",
          transition: "transform 0.1s ease-in-out",
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.3em",
          paddingLeft: 0,
        }}
        onClick={() => router.push("/camera")}
        
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.3rem"
          viewBox="0 0 24 24"
          fill="white"
          style={{ marginLeft: "0.4em" }} // ← 横のスペース
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M20 5h-3.2l-1.8-2H9L7.2 5H4c-1.1 0-2 .9-2 2v12c0 
            1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 
            14H4V7h4.05l1.83-2h4.24l1.83 2H20v12zM12 
            8c-2.21 0-4 1.79-4 4s1.79 4 4 
            4 4-1.79 4-4-1.79-4-4-4zm0 
            6.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 
            9.5 12 9.5s2.5 1.12 2.5 
            2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        写真をとる
      </button>

      <button
        style={{
          position: "absolute",
          top: "80vh",
          left: "56%",
          width: "38vw",
          height: "6vh",
          minHeight: "40px",
          fontSize: "1.0rem",
          fontWeight: 600,
          color: "white",
          backgroundColor: "#7fc37f",
          borderTopRightRadius: "50px",
          borderBottomRightRadius: "50px",
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          transition: "transform 0.1s ease-in-out",
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.3em",
          paddingLeft: 0,
        }}
        onClick={async () => {
          const [lat, lng] = position;
          try {
            await fetcher("/api/places", {
              method: "POST",
              body: JSON.stringify({ lat, lng }),
            });
            alert("ピンを立てました！");
            console.log("ピン立て成功:", { lat, lng });
          } catch (err: any) {
            console.error("ピン立て失敗:", err);
            // alert(`失敗しました: ${err.message || "エラーが発生しました"}`);
            alert('ログインされていません。\nログインはProfileページからできます。');
          }
        }}
        
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2rem"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M12 2C8.13 2 5 5.13 5 
            9c0 5.25 7 13 7 13s7-7.75 
            7-13c0-3.87-3.13-7-7-7zm0 
            9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 
            6.5 12 6.5s2.5 1.12 2.5 
            2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        ピンを立てる
      </button>

      <button
        style={{
          position: "absolute",
          top: "80vh",
          left: "6%",
          width: "15vw",
          height: "6vh",
          minHeight: "40px",
          fontSize: "1.1rem",
          fontWeight: 600,
          color: "white",
          backgroundColor: "red",
          borderRadius: "50px",
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          transition: "transform 0.1s ease-in-out",
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => router.push("/")}
        
      >
        終了
      </button>
    </>
  );
}
