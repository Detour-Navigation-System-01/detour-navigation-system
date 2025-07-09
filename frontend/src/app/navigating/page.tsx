/**
 * @fileoverview ナビゲーション中ページコンポーネント
 * @description ナビゲーション中の地図表示とカメラ画面遷移ボタンを表示するページ
 * @author 尾﨑諒
 * @created 2025-06-24
 * @updated 2025-07-01
 * @version 1.0.2
 */

'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavigatingMap from '@/components/map/navigatingmap';
import NavigationBottomSheet from '@/components/navigation/NavigationBottomSheet';

// Loading コンポーネント
function NavigatingLoading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">ナビゲーション準備中...</p>
      </div>
    </div>
  );
}

export default function NavigatingPage() {
  const router = useRouter();

  // 写真撮影機能
  const handleTakePhoto = () => {
    router.push('/camera');
  };

  // ピンを立てる機能
  const handleAddPin = () => {
    // ピンを立てる処理
    // ここに位置情報をサーバーに送信するコードを追加
    alert('この位置にピンを立てました');
  };

  // ナビゲーション終了機能
  const handleExit = () => {
    router.push('/');
  };

  return (
    <Suspense fallback={<NavigatingLoading />}>
      <NavigatingMap />
      <NavigationBottomSheet
        onTakePhoto={handleTakePhoto}
        onAddPin={handleAddPin}
        onExit={handleExit}
      />
    </Suspense>
  );
}