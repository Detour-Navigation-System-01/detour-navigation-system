/**
 * @fileoverview 入力ページコンポーネント
 * @description 旅行情報入力フォームを表示するページコンポーネント
 * @author 作成者名
 * @created YYYY-MM-DD
 * @updated YYYY-MM-DD
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