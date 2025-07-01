// frontend/src/lib/auth.ts

import { fetcher } from './api';

/**
 * 現在のログインユーザー情報を取得
 */
export const fetchCurrentUser = async () => {
  return await fetcher<{ data?: { user: { id: number; username: string } } }>(
    '/api/auth/me'
  );
};

/**
 * ログアウト処理（トークン削除 + サーバ通知）
 */
export const logout = async () => {
  // ✅ トークン削除（フロント側）
  localStorage.removeItem('jwt_token');

  // ✅ サーバにも通知（ログアウト用の処理があるなら）
  return await fetcher<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
};
