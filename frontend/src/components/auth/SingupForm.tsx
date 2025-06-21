/**
 * @fileoverview サインアップフォーム
 * @description 新規ユーザー登録用フォームコンポーネント
 * @author 平野
 * @created 2025-06-17
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { fetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">新規登録</h2>

        <input name="username" placeholder="ユーザー名" required value={form.username} onChange={handleChange} className="w-full border px-3 py-2 mb-4 rounded" />
        <input name="email" type="email" placeholder="メールアドレス" required value={form.email} onChange={handleChange} className="w-full border px-3 py-2 mb-4 rounded" />
        <input name="password" type="password" placeholder="パスワード" required value={form.password} onChange={handleChange} className="w-full border px-3 py-2 mb-4 rounded" />
        <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded">
          登録
        </button>

        <p className="mt-4 text-center text-sm text-red-500">{message}</p>
      </form>
    </div>
  );
}
