'use client';

import '../../../styles/preservation.css';
import { useRouter } from 'next/navigation';

const galleryData = {
  '5月': [
    { id: 1, imageUrl: '/images/test1.jpg' },
    { id: 2, imageUrl: '/images/test2.jpg' },
  ],
  '4月': [{ id: 3, imageUrl: '/images/test3.jpg' }],
};

export default function PreservationGallery() {
  const router = useRouter();

  const handleClick = (id: number) => {
    router.push(`/preservation/${id}`);
  };

  return (
    <div className="gallery-container">
      <header className="gallery-header">保存スポット一覧</header>
      <main className="gallery-main">
        {Object.entries(galleryData).map(([month, spots]) => {
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
                      <img src={spot.imageUrl} alt={`スポット${spot.id}`} />
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
