/**
 * @fileoverview 経路表示ページコンポーネント
 * @description 旅行情報のナビゲーション結果とナビゲーション開始ボタンを表示するページ
 * @author 尾﨑諒
 * @created 2025-06-24
 * @updated 2025-07-01
 * @version 1.0.1
 */

"use client";

import { Suspense, useState, useEffect } from 'react';
import NavigatePage from '../../components/map/routeresultmap';
import ToNavigating from '../../components/navigationButtons/ToNavigating'; 
import RouteResultMap from '../../components/map/routeresultmap';

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

interface NavigatePageProps {
  onComplete?: () => void;
}


export default function Navigate() {
  const [showButtons, setShowButtons] = useState(false);

  
  const handleNavigateComplete = () => {
    console.log("handleNavigateComplete called");
    setShowButtons(true);
  }
  
  useEffect(() => {
    console.log("Navigate page rendered");
  });
  return (
    <Suspense fallback={<NavigateLoading />}>
      <RouteResultMap onComplete={handleNavigateComplete} />
      {showButtons && <ToNavigating />}
    </Suspense>
  );
}