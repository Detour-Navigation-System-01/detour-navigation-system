const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const fetcher = async <T = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> => {
  // ✅ localStorage からトークンを取得（SSR環境対策あり）
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

  const res = await fetch(API_BASE + input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'APIエラー');
  }

  return data;
};

