/**
 * @fileoverview ログインフォームコンポーネント
 * @description ユーザー認証のためのログインフォーム機能を提供
 * @author 作成者名
 * @created YYYY-MM-DD
 * @updated YYYY-MM-DD
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { fetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const routerInstance = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleUserLogin = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();

    try {
      const responseData = await fetcher<{
        success: boolean; 
        userId?: number; 
        message?: string;
      }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ 
            email: userEmail, 
            password: userPassword 
          }),
        }
      );

      if (responseData.success) {
        setStatusMessage(`ログイン成功！ユーザーID: ${responseData.userId}`);
        // TODO: トークン保存やリダイレクトなど
        routerInstance.push('/profile');
      } else {
        setStatusMessage(responseData.message || 'ログイン失敗');
      }
    } catch (loginError) {
      console.error(loginError);
      setStatusMessage('通信エラーが発生しました');
    }
  };

  return (
    <form onSubmit={handleUserLogin}>
      <input
        type="email"
        placeholder="メールアドレス"
        value={userEmail}
        onChange={(inputEvent) => setUserEmail(inputEvent.target.value)}
        required
      />
      <br />
      <input
        type="password"
        placeholder="パスワード"
        value={userPassword}
        onChange={(inputEvent) => setUserPassword(inputEvent.target.value)}
        required
      />
      <br />
      <button type="submit">ログイン</button>
      <p>{statusMessage}</p>
    </form>
  );
}