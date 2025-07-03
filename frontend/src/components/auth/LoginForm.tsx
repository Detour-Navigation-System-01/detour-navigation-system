/**
 * @fileoverview 認証コンポーネント
 * @description ログイン画面ロジック
 * @author 平野
 * @created 2025-06-24
 * @updated 2025-07-03
 * @version 2.2.1
 */

'use client';

import { useState } from 'react';
import { fetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './LoginForm.module.css';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext'; // ✅ 追加

export default function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth(); // ✅ 追加
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

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
        await refresh(); // ✅ グローバル状態にuserを反映！

        setStatusMessage(`ようこそ、${user.username}さん！`);
        router.push(`/profile/${user.id}`);
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
