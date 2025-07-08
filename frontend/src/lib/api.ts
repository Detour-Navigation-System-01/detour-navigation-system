// frontend/src/lib/api.ts

/**
 * @fileoverview 認証コンポーネント
 * @description API用ふぇっちゃー
 * @author 平野
 * @created 2025-06-10
 * @updated 2025-07-03
 * @version 2.1.5
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const fetcher = async <T = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

  try {
    const res = await fetch(API_BASE + input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(init?.headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('❌ fetch失敗:', res.status, res.statusText, data);
      throw new Error(data.message || 'APIエラー');
    }

    return data;
  } catch (err) {
    console.error('❌ fetcherレベルでの失敗:', err);
    throw err;
  }
};
