/**
 * @fileoverview ホームページコンポーネント
 * @description 地図表示機能とタイトルを含むメインページコンポーネント
 * @author 作成者名
 * @created 2025-06-22
 * @updated 2025-06-22
 * @version 1.0.1
 */

"use client";

import dynamic from "next/dynamic";

const DynamicMapComponent = dynamic(() => import("../components/map/Map"), {
  ssr: false,
});

export default function Home() {
  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <DynamicMapComponent />
    </main>
  );
}
