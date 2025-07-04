/**
 * @fileoverview 保存スポットギャラリー画面
 * @description APIから取得したスポットデータを月別にグループ化し、ギャラリー形式で表示。
 *              各スポットは画像付きで表示され、クリックで詳細ページに遷移する。
 * @author 赤津
 * @created 2025-06-10
 * @updated 2025-07-04
 * @version 2.1.2
 */
'use client';

import '../../../styles/preservation.css';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { fetcher } from '@/lib/api';
// スポットデータの型定義
type Spot = {
  id: number;
  name: string;
  description?: string;
  category?: string;
  address?: string;
  prefecture?: string;
  lat: number;
  lng: number;
  image_url?: string;
  created_at: string;
  userid?: number;
};
// APIレスポンスの型
type ApiResponse<T> = {
  status: 'success' | 'error';
  message: string;
  data: T;
  meta?: any;
};
// 月別グループの型
type GroupedSpots = {
  [month: string]: Spot[];
};
const galleryData = {
  '5月': [
    { id: 1, imageUrl: '/images/test1.jpg' },
    { id: 2, imageUrl: '/images/test2.jpg' },
  ],
  '4月': [{ id: 3, imageUrl: '/images/test3.jpg' }],
};
export default function PreservationGallery() {
  const router = useRouter();
  const { user } = useAuth();

  // 状態管理を追加
  const [groupedSpots, setGroupedSpots] = useState<GroupedSpots>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 月別グループ化関数
  const groupSpotsByMonth = (spots: Spot[]): GroupedSpots => {
    const grouped: GroupedSpots = {};

    spots.forEach((spot) => {
      try {
        const date = new Date(spot.created_at);
        const month = `${date.getFullYear()}年${date.getMonth() + 1}月`;

        if (!grouped[month]) {
          grouped[month] = [];
        }
        grouped[month].push(spot);
      } catch (err) {
        console.warn('⚠️ 日付解析エラー:', spot.created_at);
      }
    });

    return grouped;
  };

  const fetchSpots = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 API呼び出し開始');
      const response = await fetcher<ApiResponse<Spot[]>>('/api/places/public');

      console.log('📊 取得したデータ:', response);

      if (response.status === 'success' && response.data) {
        const spots: Spot[] = response.data;
        console.log('✅ スポット数:', spots.length);
        // 現在は取得しただけ（次のステップで表示を変更）
        const grouped = groupSpotsByMonth(spots);
        setGroupedSpots(grouped);
      }
    } catch (err) {
      console.error('❌ API呼び出しエラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 コンポーネントがマウントされました');
    fetchSpots();
  }, []);

  const handleClick = (id: number) => {
    router.push('/preservation/${id}');
  };
  return (
    <div className="gallery-container">
      <header className="gallery-header">保存スポット一覧</header>
      <main className="gallery-main">
        {/* ローディング表示を追加 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📡</div>
            <div>スポットを読み込み中...</div>
          </div>
        )}

        {/* エラー表示を追加 */}
        {error && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div
              style={{
                fontSize: '24px',
                marginBottom: '8px',
                color: '#e74c3c',
              }}
            >
              ⚠️
            </div>
            <div style={{ color: '#e74c3c', marginBottom: '12px' }}>
              エラー: {error}
            </div>
            <button
              onClick={fetchSpots}
              style={{
                padding: '8px 16px',
                backgroundColor: '#85b8a3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              再試行
            </button>
          </div>
        )}

        {Object.entries(groupedSpots).map(([month, spots]) => {
          const filled = [...spots];
          while (filled.length < 8) filled.push(null); // 4x2 = 8枠固定
          return (
            <section key={month} className="month-section">
              <h2 className="month-title">{month}</h2>
              <div className="image-grid">
                {filled.map((spot, i) =>
                  spot ? (
                    <div
                      key={spot.id}
                      className="spot-box"
                      onClick={() => handleClick(spot.id)}
                    >
                      {spot.image_url ? (
                        <img src={spot.image_url} alt={spot.name} />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                          }}
                        >
                          📷
                        </div>
                      )}
                    </div>
                  ) : (
                    <div key={`empty-${i}`} className="spot-box empty" />
                  )
                )}
              </div>
            </section>
          );
        })}
      </main>
      <nav className="bottom-tab">
        <a href="/">🗺 map</a>
        <a href="/preservation">📸 Preservation Spot</a>
        <a href="/profile">👤 my profile</a>
      </nav>
    </div>
  );
}
