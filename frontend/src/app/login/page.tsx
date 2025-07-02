/**
 * @fileoverview ログインページコンポーネント
 * @description ユーザー認証のためのログインフォームを表示するページコンポーネント
 * @author 平野
 * @created 2025-06-17
 * @updated 2025-06-24
 * @version 2.0.0
 */

import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main>
      <h1>ログインページ</h1>
      <LoginForm />
    </main>
  );
}