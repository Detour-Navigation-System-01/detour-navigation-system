// 出発地点と到着地点が入った地図とその経路
// かかる時間(分)と距離(km)を表示する
// 入力画面戻るボタンとナビゲーション開始ボタン
// components/input/TripInputForm.tsxで得られた場所(座標をもらって)行う
"use client";

import { Suspense } from 'react';
import NavigatePage from '../../components/map/routeresultmap';

// Loading コンポーネント
function NavigateLoading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}

export default function Navigate() {
  return (
    <Suspense fallback={<NavigateLoading />}>
      <NavigatePage />
    </Suspense>
  );
}