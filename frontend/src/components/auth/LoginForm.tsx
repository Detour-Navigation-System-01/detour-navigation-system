'use client';

import { useState } from 'react';
import { fetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './LoginForm.module.css';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext'; // ← 追加（任意）

export default function LoginForm() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { setUser } = useAuth(); // ← 追加（任意）

  const handleUserLogin = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();

    try {
      const responseData = await fetcher<{
        message: string;
        data?: {
          user: {
            id: number;
            username: string;
            email: string;
            first_name: string;
            last_name: string;
            created_at: string;
            updated_at: string;
            public_settings: boolean;
          };
        };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          
          email: userEmail,
          password: userPassword,
        }),
      });

      const user = responseData.data?.user;

      if (user) {
        setStatusMessage(`ようこそ、${user.username}さん！`);
        setUser(user); // ← グローバルに保存（任意）
        router.push(`/profile/${user.id}`);
      } else {
        setStatusMessage(responseData.message || 'ログイン失敗');
      }
    } catch (loginError) {
      console.error(loginError);
      setStatusMessage('通信エラーが発生しました');
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleUserLogin} className={styles.form}>
        <h2 className={styles.heading}>ログイン</h2>

        <input
          type="email"
          placeholder="メールアドレス"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          required
          className={styles.input}
        />

        <input
          type="password"
          placeholder="パスワード"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          required
          className={styles.input}
        />

        <button type="submit" className={styles.button}>
          ログイン
        </button>

        <p className={styles.message}>{statusMessage}</p>

        <p className={styles.link}>
          アカウントをお持ちでない方は <Link href="/signup">こちら</Link> から登録してください。
        </p>
      </form>
    </div>
  );
}
