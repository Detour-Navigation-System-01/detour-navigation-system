// frontend/src/lib/auth.ts

/**
 * @fileoverview 認証コンポーネント
 * @description ユーザ情報取得，ログアウト
 * @author 平野
 * @created 2025-06-24
 * @updated 2025-07-02
 * @version 1.2.0
 */

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
  try {
    await fetcher('/api/auth/logout', {
      method: 'POST',
    });
  } catch (err) {
    console.warn('⚠️ ログアウトAPI失敗（たとえ失敗しても続行）', err);
  }

  // ✅ 最後に削除
  localStorage.removeItem('jwt_token');
};