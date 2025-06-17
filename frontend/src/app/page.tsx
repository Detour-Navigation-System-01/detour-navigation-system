"use client";

import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("../components/Map/Map"), { ssr: false });

export default function Page() {
  return (
    <main style={{ height: "100vh", width: "100vw" }}>
      <h1>ホーム画面</h1>
      <DynamicMap />
    </main>
  );
}
