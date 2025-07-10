/**
 * @fileoverview 経路エラーページコンポーネント
 * @description 経路が見つからなかった場合に表示されるエラーメッセージと入力画面への遷移ボタンを表示するページ
 * @author 尾﨑諒
 * @created 2025-07-03
 * @updated 2025-07-10
 * @version 1.1.0
 */

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RouteError() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("経路が見つかりませんでした");

  useEffect(() => {
    const storedMessage = sessionStorage.getItem("errorMessage");
    if (storedMessage) {
      setErrorMessage(storedMessage);
    }
  }, []);

  const handleBackToInput = () => {
    router.push("/input");
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
      <div
        style={{
          position: "absolute",
          bottom: "40%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "white",
          padding: "1rem",
          borderRadius: "1rem",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          width: "90%",
          maxWidth: "400px",
          zIndex: 1000,
          textAlign: "center",
        }}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {errorMessage}
        </h2>
        <button
          onClick={handleBackToInput}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          入力画面に戻る
        </button>
      </div>
    </div>
  );
}
