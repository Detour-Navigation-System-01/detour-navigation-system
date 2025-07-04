"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const router = useRouter();
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      })
      .catch((err) => {
        console.error("カメラ起動失敗:", err);
        alert("カメラの使用が許可されていません。");
      });

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // PNG形式のままBase64文字列を取得（不可逆圧縮なし）
    const dataUrl = canvas.toDataURL("image/png");
    setPhotoDataUrl(dataUrl);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const payload = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          image_url: dataUrl,
        };

        fetch("http://localhost:3001/api/photos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
          .then((res) => {
            if (!res.ok) throw new Error("アップロード失敗");
            console.log("✅ 画像と位置情報を送信しました");
          })
          .catch((err) => {
            console.error("送信エラー:", err);
            alert("写真の保存に失敗しました。");
          });
      },
      (error) => {
        console.error("位置情報取得失敗:", error);
        alert("位置情報の取得に失敗しました。");
      }
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div style={{ position: "relative", height: "100vh", backgroundColor: "#000" }}>
      {!photoDataUrl ? (
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          autoPlay
          playsInline
          muted
        />
      ) : (
        <img
          src={photoDataUrl}
          alt="撮影画像"
          style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" }}
        />
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div
        style={{
          position: "absolute",
          bottom: "30px",
          width: "100%",
          display: "flex",
          justifyContent: "space-around",
          padding: "0 20px",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={handleGoBack}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#666",
            color: "#fff",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          戻る
        </button>

        {!photoDataUrl && (
          <button
            onClick={capturePhoto}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#0070f3",
              color: "#fff",
              cursor: "pointer",
              width: "60px",
              height: "60px",
            }}
            aria-label="撮影"
          />
        )}
      </div>
    </div>
  );
}
