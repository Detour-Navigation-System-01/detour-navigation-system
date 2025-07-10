/**
 * @fileoverview サインアップコンポーネント
 * @description サインアップを表示するページコンポーネント
 * @author 平野
 * @created 2025-06-24
 * @updated 2025-07-05
 * @version 1.1.0
 */

import SignupForm from '@/components/auth/SingupForm';

export default function SignupPage() {
  return (
    <main>
      <SignupForm />
    </main>
  );
}
