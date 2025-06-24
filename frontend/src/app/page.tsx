/**
 * @fileoverview ホームページコンポーネント
 * @description 地図表示機能を含むメインページコンポーネント
 */

'use client';

import dynamic from 'next/dynamic';

const DynamicMapComponent = dynamic(() => import('../components/map/Map'), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <h1>遠回りナビゲーションシステム</h1>
      <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0 }}>
        <DynamicMapComponent />
      </div>
    </main>
  );
}
