/**
<<<<<<< HEAD
 * @fileoverview 保存スポットギャラリー画面
 * @description APIから取得したスポットデータを月別にグループ化し、ギャラリー形式で表示。
 *              各スポットは画像付きで表示され、クリックで詳細ページに遷移する。
 *              ログインユーザーの保存スポットのみを表示。
 * @author 赤津
 * @created 2025-06-10
 * @updated 2025-07-04
 * @version 2.2.0
 */
'use client';
import '@/styles/preservation.css';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
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

export default function PreservationGallery() {
=======

export default function PreservationRedirectPage() {
  const { user, loading } = useAuth();
>>>>>>> d6408986d9e6db28a2179946214104f693cb92e7
  const router = useRouter();
  const { user, loading } = useAuth();

  // 状態管理
  const [groupedSpots, setGroupedSpots] = useState<GroupedSpots>({});
  const [dataLoading, setDataLoading] = useState(false);
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
    setDataLoading(true);
    setError(null);

    try {
      console.log('🔍 ユーザー専用スポットを取得中:', user?.id);

      const response = await fetcher<ApiResponse<Spot[]>>(
        '/api/places/me/places'
      );

      console.log('📊 取得したデータ:', response);

      if (response.status === 'success' && response.data) {
        const spots: Spot[] = response.data;
        console.log('✅ 自分のスポット数:', spots.length);

        const grouped = groupSpotsByMonth(spots);
        setGroupedSpots(grouped);
      }
    } catch (err) {
      console.error('❌ API呼び出しエラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 認証状態:', { loading, user: !!user });

    // 認証確認中は何もしない
    if (loading) {
      return;
    }

    // 認証完了後、ログインしていない場合はリダイレクト
    if (!user) {
      console.log('❌ ログインしていません - ログインページにリダイレクト');
      router.push('/login');
      return;
    }

    // ログイン済みの場合はデータ取得
    console.log('✅ ログインユーザー:', user.id);
    fetchSpots();
  }, [loading, user]);

  const handleClick = (spot: Spot) => {
    console.log('📍 スポットをクリック:', spot.name);

    if (!spot.userid) {
      console.error('❌ userid が見つかりません');
      return;
    }

    const queryParams = new URLSearchParams({
      data: JSON.stringify({
        id: spot.id,
        name: spot.name,
        description: spot.description || '',
        category: spot.category || '',
        address: spot.address || '',
        prefecture: spot.prefecture || '',
        lat: spot.lat,
        lng: spot.lng,
        image_url: spot.image_url || '',
        created_at: spot.created_at,
      }),
    });

    router.push(`/preservation/${spot.userid}?${queryParams.toString()}`);
  };

  // AuthContextのloadingを使用
  if (loading) {
    return (
      <div className="gallery-container">
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <div>認証状態を確認中...</div>
        </div>
      </div>
    );
  }

  // 認証完了後、ユーザーがいない場合（リダイレクト処理中）
  if (!user) {
    return (
      <div className="gallery-container">
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
          <div>ログインページに移動中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <header className="gallery-header">保存スポット一覧</header>
      <main className="gallery-main">
        {/* ローディング表示 */}
        {dataLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📡</div>
            <div>スポットを読み込み中...</div>
          </div>
        )}

        {/* エラー表示 */}
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

        {/* スポットが0件の場合の表示 */}
        {!dataLoading && !error && Object.keys(groupedSpots).length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
            <div>まだ保存されたスポットがありません</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              マップでスポットを追加してみましょう！
            </div>
          </div>
        )}

        {/* 月別スポット表示 */}
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
                      onClick={() => handleClick(spot)}
                      title={`${spot.name}${
                        spot.description ? ' - ' + spot.description : ''
                      }`}
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