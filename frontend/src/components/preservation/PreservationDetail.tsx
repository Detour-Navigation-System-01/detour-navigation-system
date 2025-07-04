/**
 * @fileoverview 保存スポット詳細表示画面
 * @description パラメータで指定されたスポットIDに基づき、対応する画像と説明を表示する詳細ビュー。
 *              IDに一致する画像データが存在しない場合は、エラーメッセージを表示する。
 * @author 赤津
 * @created 2025-06-12
 * @updated 2025-07-04
 * @version 2.1.3
 */
'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';

const imageData = [
  {
    id: 1,
    src: '/images/test1.jpg',
    title: '保存スポット1',
    description: 'これは保存スポット1の説明です。',
  },
  {
    id: 2,
    src: '/images/test2.jpg',
    title: '保存スポット2',
    description: 'これは保存スポット2の説明です。',
  },
  {
    id: 3,
    src: '/images/test3.jpg',
    title: '保存スポット3',
    description: 'これは保存スポット3の説明です。',
  },
];

export default function PreservationDetail() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const image = imageData.find((img) => img.id === id);

  if (!image) {
    return <p>保存スポットが見つかりません。</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: '16px',
          backgroundColor: '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
        }}
      >
        戻る
      </button>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>{image.title}</h1>
      <Image src={image.src} alt={image.title} width={600} height={400} />
      <p style={{ marginTop: '12px' }}>{image.description}</p>
    </div>
  );
}
