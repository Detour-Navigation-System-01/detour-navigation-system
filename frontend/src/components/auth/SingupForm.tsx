/**
 * @fileoverview サインアップフォーム
 * @description 新規ユーザー登録用フォームコンポーネント
 * @author 平野
 * @created 2025-06-17
 * @updated 2025-06-20
 * @version 1.2.0
 */

'use client';

import { useState } from 'react';
import { fetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './SigupForm.module.css'

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetcher<{
        message: string;
        data?: { user: { id: number; username: string } };
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (data.data?.user) {
        setMessage('登録完了！ログインページに移動します。');
        setTimeout(() => router.push('/login'), 1000);
      } else {
        setMessage(data.message || '登録に失敗しました');
      }
    } catch (err) {
      console.error(err);
      setMessage('通信エラーが発生しました');
    }
  };
  
  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.heading}>新規登録</h2>

        <input name="username" placeholder="ユーザー名" required value={form.username} onChange={handleChange} className={styles.input} />
        <input name="email" type="email" placeholder="メールアドレス" required value={form.email} onChange={handleChange} className={styles.input} />
        <input name="password" type="password" placeholder="パスワード" required value={form.password} onChange={handleChange} className={styles.input} />

        <button type="submit" className={styles.button}>登録</button>

        <p className={styles.message}>{message}</p>
      </form>
    </div>
  );
}
