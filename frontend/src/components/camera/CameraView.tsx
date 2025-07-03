/**
 * @fileoverview カメラビューコンポーネント
 * @description カメラ機能を提供し、写真撮影・保存機能を実装
 * @author 尾﨑諒
 * @created 2025/07/03
 * @updated 2025/07/03
 * @version 1.0.1
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CameraView() {
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null); // ← 追加
  const routerInstance = useRouter();
  const [capturedPhotoDataUrl, setCapturedPhotoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!videoElementRef.current) return;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((currentMediaStream) => {
        mediaStreamRef.current = currentMediaStream; // ← refに保存
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = currentMediaStream;
          videoElementRef.current.play().catch(console.error);
        }
      })
      .catch((cameraError) => {
        console.error("カメラ起動失敗:", cameraError);
        alert("カメラの使用が許可されていません。");
      });

    // ページ離脱時にカメラ停止
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoElementRef.current || !canvasElementRef.current) return;

    const video = videoElementRef.current;
    const canvas = canvasElementRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    setCapturedPhotoDataUrl(dataUrl);
  };

  const downloadCapturedPhoto = () => {
    if (!capturedPhotoDataUrl) return;

    const link = document.createElement("a");
    link.href = capturedPhotoDataUrl;
    link.download = `photo_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGoBack = () => {
    routerInstance.back();
  };

  return (
    <div style={{ position: "relative", height: "100vh", backgroundColor: "#000" }}>
      {!capturedPhotoDataUrl && (
        <video
          ref={videoElementRef}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          autoPlay
          playsInline
          muted
        />
      )}

      {capturedPhotoDataUrl && (
        <img
          src={capturedPhotoDataUrl}
          alt="撮影画像"
          style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" }}
        />
      )}

      <canvas ref={canvasElementRef} style={{ display: "none" }} />

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

        {!capturedPhotoDataUrl && (
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
              userSelect: "none",
              width: "60px",
              height: "60px",
            }}
            aria-label="撮影"
          />
        )}

        {capturedPhotoDataUrl && (
          <button
            onClick={downloadCapturedPhoto}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#28a745",
              color: "#fff",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            保存
          </button>
        )}
      </div>
    </div>
  );
}
