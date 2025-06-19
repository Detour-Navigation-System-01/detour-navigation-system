/**
 * @fileoverview ホームページコンポーネント
 * @description 地図表示機能を含むメインページコンポーネント
 * @author 作成者名
 * @created YYYY-MM-DD
 * @updated YYYY-MM-DD
 * @version 1.0.0
 */

"use client";

import dynamic from "next/dynamic";

const DynamicMapComponent = dynamic(() => import("../components/map/Map"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <main style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      <DynamicMapComponent />
    </main>
  );
}
