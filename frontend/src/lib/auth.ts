// src/lib/auth.ts
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User } from '@/types/user';

const SECRET_KEY = 'your_jwt_secret'; // 本番はenvで管理

export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as User;
    return decoded;
  } catch {
    return null;
  }
}
