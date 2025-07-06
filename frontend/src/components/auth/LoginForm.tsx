/**
 * @fileoverview ログインフォーム
 * @description ユーザログインフォームコンポーネント
 * @author 平野
 * @created 2025-06-17
 * @updated 2025-07-05
 * @version 2.4.0
 */

'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { fetcher } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation'; // ✅ 追加
import styles from './LoginForm.module.css';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ 追加
  const redirectPath = searchParams.get('redirect') || null; // ✅ 追加

  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  useEffect(() => {
    // スクロールを無効にする
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // コンポーネントがアンマウントされたときに戻す
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetcher<{
        message: string;
        data?: {
          user: {
            id: number;
            username: string;
          };
          token: string;
        };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user = res.data?.user;
      const token = res.data?.token;

      if (user && token) {
        localStorage.setItem('jwt_token', token);
        await refresh();

        setStatusMessage(`ようこそ、${user.username}さん！`);

        // ✅ リダイレクト先が指定されていればそちらへ、なければプロフィール
        router.push(redirectPath || `/profile/${user.id}`);
      } else {
        setStatusMessage(res.message || 'ログイン失敗');
      }
    } catch (err) {
      const error = err as Error;
      console.error('ログインエラー', err);
      setStatusMessage(error.message || '通信エラーが発生しました');
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.heading}>ログイン</h2>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />

        <button type="submit" className={styles.button}>
          ログイン
        </button>

        <p className={styles.message}>{statusMessage}</p>

        <p className={styles.link}>
          アカウントがない方は <Link href="/signup">こちら</Link>
        </p>
      </form>
    </div>
  );
}
