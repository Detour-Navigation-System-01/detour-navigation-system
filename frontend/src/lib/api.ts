// frontend/src/lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const fetcher = async <T = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> => {
  const res = await fetch(API_BASE + input, {
    ...init,
    credentials: 'include', // ✅ Cookie送信を明示
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'APIエラー');
  }

  return data;
};
