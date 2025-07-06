/**
 * @fileoverview 入力ページコンポーネント
 * @description 旅行情報入力フォームを表示するページコンポーネント
 * @author 尾﨑諒
 * @created 2025-06-17
 * @updated 2025-07-06
 * @version 2.0.1
 */

'use client';


import React, {useEffect} from "react";
import TripInputForm from "@/components/input/TripInputForm";

export default function InputPage() {
  useEffect(() => {
    // スクロール禁止
    document.body.style.overflow = "hidden";

    // クリーンアップ時に元に戻す
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="p-6">
      <TripInputForm />
    </div>
  );
}