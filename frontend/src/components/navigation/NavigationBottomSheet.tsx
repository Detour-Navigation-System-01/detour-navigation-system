/**
 * @fileoverview ナビゲーション用ボトムシートコンポーネント
 * @description ナビゲーション中の「終了」「写真を撮る」「ピンを立てる」ボタンを格納するボトムシート
 * @author GitHub Copilot
 * @created 2025-07-09
 * @version 1.0.0
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
  const [isOpen, setIsOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  
  // シートを開閉する関数
  const toggleSheet = () => {
    setIsOpen(!isOpen);
  };

  // タッチイベントハンドラ
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 0) { // 下方向へのスワイプ
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (startY.current === null || currentY.current === null) return;
    
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 70) { // 70px以上のスワイプで閉じる
      setIsOpen(false);
    }
    
    // 位置をリセット
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    
    startY.current = null;
    currentY.current = null;
  };

  // ボタンスタイル
  const buttonStyle = {
    backgroundColor: '#065f46',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: '600',
    width: '100%',
    cursor: 'pointer',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  return (
    <>
      {/* ボトムシート開閉ボタン */}
      <button 
        onClick={toggleSheet}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#065f46',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: 'none',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.3)',
          fontSize: '24px',
          zIndex: 998,
        }}
      >
        {isOpen ? '×' : '＋'}
      </button>

      {/* ボトムシート */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={sheetRef}
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '20px',
              transition: 'transform 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* ハンドル */}
            <div
              style={{
                width: '40px',
                height: '5px',
                backgroundColor: '#ccc',
                borderRadius: '2.5px',
                margin: '0 auto 20px',
              }}
            />
            
            {/* アクションボタン */}
            <button style={buttonStyle} onClick={onTakePhoto}>
              <span style={{ fontSize: '20px' }}>📸</span> 写真を撮る
            </button>
            
            <button style={buttonStyle} onClick={onAddPin}>
              <span style={{ fontSize: '20px' }}>📍</span> ピンを立てる
            </button>
            
            <button 
              style={{ ...buttonStyle, backgroundColor: '#ef4444' }} 
              onClick={onExit}
            >
              <span style={{ fontSize: '20px' }}>✕</span> ナビゲーション終了
            </button>
          </div>
        </div>
      )}
    </>
  );
}
