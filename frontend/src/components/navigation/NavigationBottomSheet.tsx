/**
 * @fileoverview ナビゲーション用ボトムシートコンポーネント
 * @description ナビゲーション中の「終了」「写真を撮る」「ピンを立てる」ボタンを格納するボトムシート
 * @author GitHub Copilot
 * @created 2025-07-09
 * @updated 2025-07-09
 * @version 2.0.0
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    boxSizing: 'border-box' as const,
  };

  // ボタンスタイル
  const buttonStyle = {
    backgroundColor: '#065f46',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 5px',
    fontSize: '12px', // フォントサイズを小さく
    fontWeight: '600',
    flex: '1',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '70px', // 高さを小さく
    maxWidth: '32%', // 各ボタンの最大幅を制限
    minWidth: '60px', // 最小幅も設定
  };

  // 縮小時と展開時のシートの高さ
  const collapsedHeight = '65px'; // 少し小さくして見た目を調整
  const expandedHeight = '130px'; // ボタンの高さに合わせて調整
  
  return (
    <div
      ref={sheetRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: isExpanded ? expandedHeight : collapsedHeight,
        backgroundColor: 'white',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        transition: 'height 0.3s ease',
        zIndex: 999,
        padding: '10px 0', // 左右のパディングを0に変更
        boxSizing: 'border-box', // ボックスサイズの計算方法を変更
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
          margin: '5px auto 10px', // 上部のマージンを調整
        }}
      />
      
      {/* アクションボタン */}
      <div style={{
        opacity: isExpanded ? 1 : 0,
        transition: 'opacity 0.3s ease',
        height: isExpanded ? 'auto' : '0',
        overflow: 'hidden',
        marginTop: '10px',
        marginBottom: '5px',
      }}>
        <div style={buttonContainerStyle}>
          <button style={buttonStyle} onClick={onTakePhoto}>
            <span style={{ fontSize: '22px', marginBottom: '5px' }}>📸</span>
            写真
          </button>
          
          <button style={buttonStyle} onClick={onAddPin}>
            <span style={{ fontSize: '22px', marginBottom: '5px' }}>📍</span>
            ピン
          </button>
          
          <button 
            style={{ ...buttonStyle, backgroundColor: '#ef4444' }} 
            onClick={onExit}
          >
            <span style={{ fontSize: '22px', marginBottom: '5px' }}>✕</span>
            終了
          </button>
        </div>
      </div>
    </div>
  );
}
