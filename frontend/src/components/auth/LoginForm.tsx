'use client';

import { useState } from 'react';
import { fetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';


export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = await fetcher<{success: boolean; userId?:number; message?: string}>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({email,password}),
        }
      );


      if (data.success) {
        setMessage(`ログイン成功！ユーザーID: ${data.userId}`);
        // TODO: トークン保存やリダイレクトなど
        router.push('/profile');
      } else {
        setMessage(data.message || 'ログイン失敗');
      }
    } catch (error) {
      console.error(error);
      setMessage('通信エラーが発生しました');
    }
  };

  return (
    <div className = "flex justify-center items-center min-h-screen bg-gray-50">
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          />
          <br />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          />
          <br />
          <button type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >ログイン</button>

          <p>{message}</p>
        </form>
      </div>
  );
}
