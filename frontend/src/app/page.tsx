<<<<<<< HEAD
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
=======
import Image from 'next/image';
import SimpleMap from '@/components/map/SimpleMap';

/*export default function Home() {
>>>>>>> 922afe54eb1c7f2a4390aaf789206f97c76ab417
  return (
    <main style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      <DynamicMapComponent />
    </main>
  );
}*/
export default function Home() {
  return (
    <main>
      <h1>遠回りナビゲーションシステム</h1>
      <SimpleMap />
    </main>
  );
}
