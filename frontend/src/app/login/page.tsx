/**
 * @fileoverview ログインページコンポーネント
 * @description ユーザー認証のためのログインフォームを表示するページコンポーネント
 * @author 平野
 * @created 2025-06-17
 * @updated 2025-07-05
 * @version 2.1.0
 */

import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main>
      <LoginForm />
    </main>
  );
}