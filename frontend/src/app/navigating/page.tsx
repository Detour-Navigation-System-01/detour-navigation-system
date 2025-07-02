'use client';

import { Suspense } from 'react';
import NavigatingMap from '@/components/map/navigatingmap';
import ToCamera from '../../components/navigationButtons/ToCamera'; 

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
  return (
    <Suspense fallback={<NavigatingLoading />}>
      <NavigatingMap />
      <ToCamera />
    </Suspense>
  );
}