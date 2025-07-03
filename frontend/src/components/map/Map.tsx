/**
 * @fileoverview マップ表示コンポーネント
 * @description 地図表示とナビゲーションボタンを重ねて表示するコンポーネント
 * @author 尾﨑諒
 * @created 2025/07/03
 * @updated 2025/07/03
 * @version 1.0.0
 */

"use client";

import MapView from "./MapView";
import NavigationButtons from "@/components/navigationButtons/NavigationButtons";

export default function Map() {
  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <NavigationButtons />
      <MapView />
    </div>
  );
}
