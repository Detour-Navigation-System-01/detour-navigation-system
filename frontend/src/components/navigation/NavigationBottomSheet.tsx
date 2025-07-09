/**
 * @fileoverview ナビゲーション用ボトムシートコンポーネント
 * @description ナビゲーション中の「終了」「写真を撮る」「ピンを立てる」ボタンを格納するボトムシート
 * @author GitHub Copilot
 * @created 2025-07-09
 * @updated 2025-07-09
 * @version 2.0.0
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface NavigationBottomSheetProps {
  onTakePhoto: () => void;
  onAddPin: () => void;
  onExit: () => void;
}

export default function NavigationBottomSheet({ 
  onTakePhoto, 
  onAddPin, 
  onExit 
}: NavigationBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  
  // タッチイベントハンドラ
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    if (!isExpanded && deltaY < 0) { // 上スワイプで展開
      setIsExpanded(true);
    } else if (isExpanded && deltaY > 70) { // 下スワイプで収納
      setIsExpanded(false);
    }
    
    if (sheetRef.current) {
      // 展開状態では上方向の動きを許容し、非展開状態では下方向の動きを許容しない
      if (isExpanded && deltaY > 0 || !isExpanded && deltaY < 0) {
        const newY = Math.min(Math.max(deltaY, -280), 0); // 移動範囲を制限
        sheetRef.current.style.transform = `translateY(${newY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    
    startY.current = null;
    currentY.current = null;
  };
  
  // ボタンのコンテナスタイル
  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    gap: '5px', // ギャップを小さくする
    paddingLeft: '20px', // 左右にパディングを追加して中央に配置
    paddingRight: '20px',
    paddingTop: '10px',
    boxSizing: 'border-box' as const,
  };

  // ボタンスタイル
  const buttonStyle = {
    backgroundColor: '#065f46',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 5px',
    fontSize: '12px',
    fontWeight: '600',
    flex: '1',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '70px', // 一定の高さ
    maxWidth: '32%', // 各ボタンの最大幅を制限
    minWidth: '60px', // 最小幅も設定
  };

  // 縮小時と展開時のシートの高さ
  const collapsedHeight = '65px'; // 下部が見切れるように調整
  const expandedHeight = '120px'; // ボタンの高さに合わせて調整
  
  return (
    <div
      ref={sheetRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: isExpanded ? expandedHeight : collapsedHeight,
        backgroundColor: 'black',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        transition: 'height 0.3s ease',
        zIndex: 999,
        padding: '8px 0 0 0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' // 収納状態では高さを超えたコンテンツが見切れるように
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ハンドル */}
      <div
        style={{
          width: '40px',
          height: '4px',
          backgroundColor: '#ccc',
          borderRadius: '2px',
          margin: '0 auto 5px', // マージンをさらに小さく
        }}
      />
      
      {/* アクションボタン */}
      <div style={{
        opacity: 1, // 常に完全表示
        transition: 'all 0.3s ease',
        height: 'auto',
        padding: '10px 10px 0',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        overflow: 'hidden', // 収納状態では自動的に下部分がクリップされる
      }}>
        <div style={buttonContainerStyle}>
          <button 
            style={{ ...buttonStyle, backgroundColor: '#ef4444' }} 
            onClick={onExit}
          >
            <Image 
              src="/icons/navigation/exit.svg" 
              alt="終了" 
              width={24} 
              height={24} 
              style={{ marginBottom: '5px' }}
            />
            <span style={{ fontSize: '12px' }}>終了</span>
          </button>
          <button style={buttonStyle} onClick={onTakePhoto}>
            <Image 
              src="/icons/navigation/camera.svg" 
              alt="写真" 
              width={24} 
              height={24} 
              style={{ marginBottom: '5px' }}
            />
            <span style={{ fontSize: '12px' }}>写真</span>
          </button>
          
          <button style={{ ...buttonStyle, backgroundColor: '#2cac6e' }} onClick={onAddPin}>
            <Image 
              src="/icons/navigation/pin.svg" 
              alt="ピン" 
              width={24} 
              height={24} 
              style={{ marginBottom: '5px' }}
            />
            <span style={{ fontSize: '12px' }}>ピン</span>
          </button>
          
          
        </div>
      </div>
    </div>
  );
}
