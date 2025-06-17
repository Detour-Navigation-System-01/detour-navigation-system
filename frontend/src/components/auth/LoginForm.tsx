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
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <br />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <br />
      <button type="submit">ログイン</button>
      <p>{message}</p>
    </form>
  );
}
