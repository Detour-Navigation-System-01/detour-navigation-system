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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleUserLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-semibold text-center mb-6">ログイン</h2>

        <input
          type="email"
          placeholder="メールアドレス"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        />

        <input
          type="password"
          placeholder="パスワード"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        />

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          ログイン
        </button>

        <p className="mt-4 text-center text-sm text-red-500">{statusMessage}</p>
      </form>
    </div>
  );
}