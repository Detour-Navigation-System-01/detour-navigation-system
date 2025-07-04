/**
 * @fileoverview ログインプロンプト表示コンポーネント
 * @description 未ログイン状態のユーザーに対して、ログインを促すUIを提供。
 *              プロフィール画像とメッセージを表示し、「ログイン」ボタンでログインページに遷移可能。
 *              主に保存スポット機能の利用を促進する目的で使用される。
 * @author 赤津
 * @created 2025-06-12
 * @updated 2025-07-04
 * @version 2.1.1
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LoginPrompt() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <div style={{ background: '#72a89d', height: '120px' }} />

      <div style={{ marginTop: '-50px' }}>
        <Image
          src="/icons/profile-default.png"
          alt="default user icon"
          width={100}
          height={100}
          style={{ borderRadius: '50%', background: '#eee' }}
        />
      </div>

      <p style={{ marginTop: '2rem', fontWeight: 'bold', color: '#285943' }}>
        スポットを保存して思い出を作りましょう！
      </p>
      <p style={{ color: '#285943', fontSize: '0.9rem' }}>
        ログインすると、お気に入りのスポットを保存できます。
      </p>

      <Link href="/login">
        <button
          style={{
            backgroundColor: '#72a89d',
            color: '#fff',
            padding: '0.5rem 2rem',
            borderRadius: '12px',
            marginTop: '1rem',
            fontSize: '1.2rem',
            border: 'none',
          }}
        >
          ログイン
        </button>
      </Link>
    </div>
  );
}
