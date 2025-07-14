/**
 * @fileoverview ナビゲーション用ボトムシートコンポーネント
 * @description ナビゲーション関連の各種ボタンを格納するボトムシート
 * @author GitHub Copilot
 * @created 2025-07-09
 * @updated 2025-07-10
 * @version 3.0.0
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type BottomSheetMode = 'navigating' | 'navigate' | 'custom';

interface NavigationBottomSheetProps {
  mode?: BottomSheetMode;
  onTakePhoto?: () => void;
  onAddPin?: () => void;
  onExit?: () => void;
  onNavigateStart?: () => void;
  onBack?: () => void;
  distance?: number | null;
  duration?: number | null;
  timeParam?: string | null;
  isNearStart?: boolean;
  loading?: boolean;
  customButtons?: React.ReactNode;
}

export default function NavigationBottomSheet({ 
  mode = 'navigating',
  onTakePhoto, 
  onAddPin, 
  onExit,
  onNavigateStart,
  onBack,
  distance,
  duration,
  timeParam,
  isNearStart = true,
  loading = false,
  customButtons
}: NavigationBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  const router = useRouter();
  
  // モードに応じてシートの高さを調整
  useEffect(() => {
    if (mode === 'navigate') {
      // navigate モードでの初期表示は展開表示
      setIsExpanded(true);
    }
  }, [mode]);
  
  // タッチイベントハンドラ
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    // navigateモードでも縮小を可能にする（mode !== 'navigate'の条件を削除）
    if (!isExpanded && deltaY < -50) { // 上スワイプで展開 (少し強めのスワイプが必要)
      setIsExpanded(true);
    } else if (isExpanded && deltaY > 50) { // 下スワイプで収納 (適度なスワイプで縮小)
      // navigateモードでも縮小可能に
      setIsExpanded(false);
    }
    
    if (sheetRef.current) {
      // すべてのモードで上下のスワイプを許容
      if ((isExpanded && deltaY > 0) || (!isExpanded && deltaY < 0)) {
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
  
  // 戻るボタンのハンドラ
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };
  
  // ボタンのコンテナスタイル
  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    gap: '15px', // ギャップを広げる（5px→15px）
    paddingLeft: '20px', // 左右にパディングを追加して中央に配置
    paddingRight: '20px',
    paddingTop: '15px', // 上部の余白を増やす（5px→15px）
    boxSizing: 'border-box' as const,
  };

  // ボタンスタイル
  const buttonStyle = {
    backgroundColor: '#065f46',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 5px', // パディングを少し増やす（8px→10px）
    fontSize: '12px',
    fontWeight: '600',
    flex: '1',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '75px', // 少し高さを増やす（70px→75px）
    maxWidth: '30%', // 各ボタンの最大幅をわずかに減らし、間隔を確保（32%→30%）
    minWidth: '60px', // 最小幅はそのまま
  };

  // 縮小時と展開時のシートの高さ
  const collapsedHeight = mode === 'navigate' ? '110px' : '65px'; // navigateモードでも縮小時は小さく
  const expandedHeight = mode === 'navigate' ? '220px' : '120px'; // モードによって高さ調整
  
  // グローバルスタイル（アニメーション用）
  const globalStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  // モーダルコンテナ用スタイル
  const overlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(2px)',
    animation: 'fadeIn 0.2s ease-out',
  };
  
  // モーダルコンテンツ用スタイル
  const modalStyle = {
    backgroundColor: 'white',
    padding: '30px 20px',
    borderRadius: '15px',
    width: '85%',
    maxWidth: '350px',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
    textAlign: 'center' as const,
    position: 'relative' as const,
    zIndex: 2001,
    animation: 'fadeIn 0.3s ease-out'
  };
  
  // ナビ開始ボタン用スタイル
  const navigateButtonStyle = {
    backgroundColor: '#003300',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '15px 0',
    borderRadius: '30px',
    border: 'none',
    width: '90%',
    maxWidth: '500px',
    position: 'fixed' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease',
    zIndex: 900,
  };
  
  // 戻るボタン用スタイル
  const backButtonStyle = {
    position: 'fixed' as const,
    bottom: '90px', // ナビ開始ボタンの上に配置
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffffff',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: '20px',
    padding: '8px 30px',
    fontSize: '14px',
    fontWeight: 'normal',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    zIndex: 900,
  };
  
  // モーダル表示状態管理
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // ナビ開始ボタンクリック時の処理
  const handleNavigateClick = () => {
    console.log('ナビ開始ボタンがクリックされました', { isNearStart, onNavigateStart });
    
    // 出発地との距離をチェック
    if (isNearStart) {
      try {
        // 出発地に近い場合はナビゲーションを開始
        if (onNavigateStart) {
          console.log('onNavigateStart関数を実行します');
          onNavigateStart();
        } else {
          // onNavigateStartがない場合は直接遷移
          console.log('直接遷移を実行します');
          // Next.jsのルーターを使って遷移を試みる（非同期）
          router.push('/navigating');
          
          // 遷移が確実に行われるように、短い遅延後にwindow.locationも使用
          setTimeout(() => {
            console.log('/navigatingへ強制遷移します (setTimeout)');
            window.location.href = '/navigating';
          }, 200);
        }
      } catch (error) {
        // エラーが発生した場合のフォールバック
        console.error('ナビゲーション遷移中にエラーが発生しました:', error);
        window.location.href = '/navigating';
      }
    } else {
      // 出発地から離れている場合はモーダルを表示
      console.log('出発地から離れているため、モーダルを表示します');
      setShowModal(true);
    }
  };
  
  // グローバルスタイルを注入するコンポーネント
  const GlobalStyle = () => (
    <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
  );
  
  // モードに応じたコンテンツを表示
  const renderContent = () => {
    switch (mode) {
      case 'navigating':
        return (
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
              <span style={{ fontSize: '12px', color: 'white' }}>終了</span>
            </button>
            <button style={{ ...buttonStyle, backgroundColor: '#065f46' }} onClick={onTakePhoto}>
              <Image 
                src="/icons/navigation/camera.svg" 
                alt="写真" 
                width={24} 
                height={24} 
                style={{ marginBottom: '5px' }}
              />
              <span style={{ fontSize: '12px', color: 'white' }}>写真</span>
            </button>
            <button style={{ ...buttonStyle, backgroundColor: '#2cac6e' }} onClick={onAddPin}>
              <Image 
                src="/icons/navigation/pin.svg" 
                alt="ピン" 
                width={24} 
                height={24} 
                style={{ marginBottom: '5px' }}
              />
              <span style={{ fontSize: '12px', color: 'white' }}>ピン</span>
            </button>
          </div>
        );
      case 'navigate':
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            padding: '10px 0',
            gap: '10px',
            height: '100%', // 高さを100%に
          }}>
            {/* 経路情報 */}
            <div style={{
              width: '90%',
              maxWidth: '600px',
              padding: '3px 0',
              marginBottom: '2px',
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#111827',
                textAlign: 'center',
                marginBottom: '2px',
              }}>
                {duration ? `${duration}分 (${distance && !loading ? distance.toFixed(1) : '---'}km)` : '計算中...'}
              </div>
              
              {timeParam && duration && isExpanded && (
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: duration <= parseInt(timeParam) ? '#047857' : '#dc2626',
                  textAlign: 'center',
                  padding: '2px 0',
                }}>
                  {duration <= parseInt(timeParam)
                    ? `制限時間内に到着可能`
                    : `制限時間を${duration - parseInt(timeParam)}分超過`
                  }
                </div>
              )}
            </div>
            
            {/* ボタンコンテナ - 展開時のみ表示 */}
            {isExpanded && (
              <div style={{
                display: 'flex',
                width: '95%', // 幅を広げる
                maxWidth: '600px',
                justifyContent: 'space-between',
                gap: '12px', // ギャップを大きく
              }}>
                <button 
                  onClick={handleBackClick}
                  style={{
                    flex: '1',
                    padding: '12px 0', // パディングを大きく
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600', // フォントウェイトを太く
                    color: '#111827',
                  }}
                >
                  戻る
                </button>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault(); // イベント伝播を止める
                    e.stopPropagation(); // 親要素へのイベントの伝播も止める
                    console.log('ナビ開始ボタンがクリックされました - 直接関数呼び出し', { isNearStart });
                    
                    // isNearStartの値をもう一度チェック
                    if (!isNearStart) {
                      console.log('出発地から離れているためモーダル表示します（ボタンクリック時）');
                      setShowModal(true);
                      return;
                    }
                    
                    // クリックイベントの処理を優先する
                    setTimeout(() => {
                      handleNavigateClick();
                    }, 0);
                  }}
                  disabled={loading}
                  style={{
                    flex: '2',
                    padding: '12px 0', // パディングを大きく
                    backgroundColor: !isNearStart ? '#9ca3af' : '#065f46', // 出発地から離れている場合は灰色
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px', // フォントサイズを大きく
                    fontWeight: 'bold',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: loading || !isNearStart ? 'default' : 'pointer', // ローディング中または出発地から離れている場合はカーソルを変更
                    opacity: !isNearStart ? 0.7 : 1, // 出発地から離れている場合は少し透明に
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="1.2em"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  {loading 
                    ? "位置確認中..." 
                    : !isNearStart 
                      ? "出発地に近づいてください" 
                      : "ナビ開始"}
                </button>
              </div>
            )}
          </div>
        );
      case 'custom':
        return customButtons;
      default:
        return null;
    }
  };
  
  return (
    <>
      <GlobalStyle />
      
      {/* 距離エラー用モーダル */}
      {showModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ 
              color: "#cc0000", 
              fontSize: "60px", 
              marginBottom: "15px",
              display: "flex",
              justifyContent: "center",
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="60px" height="60px">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h3 style={{ margin: "0 0 15px", color: "#cc0000", fontWeight: "bold", fontSize: "1.5rem" }}>出発地点から離れすぎています</h3>
            <p style={{ margin: "0 0 25px", fontSize: "1.1rem", lineHeight: "1.6" }}>
              出発地点から約 <strong style={{ fontSize: "1.3rem", color: "#cc0000" }}>200</strong> m以上離れています。<br />
              <span style={{ color: "#555", marginTop: "10px", display: "block" }}>ナビゲーションを開始するには<br />出発地点の近くに移動してください。</span>
            </p>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                backgroundColor: "#003300",
                color: "white",
                border: "none",
                borderRadius: "25px",
                padding: "12px 30px",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                width: "100%",
                maxWidth: "200px",
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      
      {/* ボトムシート本体 */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: isExpanded ? expandedHeight : collapsedHeight,
          backgroundColor: mode === 'navigating' ? 'black' : 'white', // モードによって背景色を変更
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          transition: 'height 0.3s ease',
          zIndex: 999,
          padding: '4px 0 0 0', // パディングを小さくして余白を削減
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
            backgroundColor: mode === 'navigating' ? '#aaa' : '#ccc', // モードによって色を変更 (黒背景に対してより明るい色)
            borderRadius: '2px',
            margin: '0 auto 2px', // マージンをさらに小さく
          }}
        />
        
        {/* アクションボタン */}
        <div style={{
          opacity: 1, // 常に完全表示
          transition: 'all 0.3s ease',
          height: 'auto',
          padding: '15px 10px 0', // 上部のパディングを増加（10px→15px）
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          overflow: 'hidden', // 収納状態では自動的に下部分がクリップされる
          backgroundColor: mode === 'navigating' ? 'black' : 'white', // モードによって背景色を変更
        }}>
          {renderContent()}
        </div>
      </div>
    </>
  );
}
