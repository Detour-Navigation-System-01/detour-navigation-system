/**
 * @fileoverview ログインページコンポーネント
 * @description ユーザー認証のためのログインフォームを表示するページコンポーネント
 * @author 作成者名
 * @created YYYY-MM-DD
 * @updated YYYY-MM-DD
 * @version 1.0.0
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