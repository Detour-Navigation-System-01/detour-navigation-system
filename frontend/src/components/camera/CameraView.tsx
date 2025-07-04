"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // カメラ起動
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error("カメラ起動失敗:", err);
        alert("カメラの使用が許可されていません。");
      });

    return () => {
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 写真を撮る
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setPhotoDataUrl(dataUrl);
  };

  console.log(photoDataUrl);

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
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{
        position: "absolute",
        bottom: "30px",
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            backgroundColor: "#555",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          戻る
        </button>

        <button
          onClick={capturePhoto}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#0070f3",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="写真を撮る"
        />
      </div>
    </div>
  );
}
