'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React from 'react';

interface ImageData {
  id: number;
  src: string;
  alt: string;
}

const sampleImages: ImageData[] = [
  { id: 1, src: '/images/test1.jpg', alt: '保存スポット1' },
  { id: 2, src: '/images/test2.jpg', alt: '保存スポット2' },
  { id: 3, src: '/images/test3.jpg', alt: '保存スポット3' },
];

export default function PreservationGallery() {
  const router = useRouter();

  const handleClick = (id: number) => {
    router.push(`/preservation/${id}`);
  };

  const handleDelete = (id: number) => {
    alert(`保存スポットID ${id} を削除します（仮動作）`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
        保存スポット一覧
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
        }}
      >
        {sampleImages.map((img) => (
          <div
            key={img.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
              backgroundColor: '#fafafa',
              cursor: 'pointer',
            }}
            onClick={() => handleClick(img.id)}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={150}
              height={100}
              style={{ borderRadius: '4px' }}
            />
            <p style={{ marginTop: '8px' }}>{img.alt}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(img.id);
              }}
              style={{
                marginTop: '8px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
