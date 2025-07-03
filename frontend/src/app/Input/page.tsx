/**
 * @fileoverview 入力ページコンポーネント
 * @description 旅行情報入力フォームを表示するページコンポーネント
 * @author 尾﨑諒
 * @created 2025/07/03
 * @updated 2025/07/03
 * @version 1.0.0
 */

import React from "react";
import TripInputForm from "@/components/input/TripInputForm";

export default function InputPage() {
  return (
    <div className="p-6">
      <TripInputForm />
    </div>
  );
}