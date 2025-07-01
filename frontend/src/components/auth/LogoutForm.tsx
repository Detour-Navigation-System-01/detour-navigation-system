'use client';

import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import styles from './LogoutForm.module.css';

export default function LogoutForm() {
  const router = useRouter();
  const { setUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('ログアウト失敗', err);
      alert('ログアウトに失敗しました');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <h2 className={styles.heading}>ログアウト確認</h2>

        <p className={styles.message}>本当にログアウトしますか？</p>

        <div className={styles.buttonGroup}>
          <button type="button" onClick={handleLogout} className={styles.logoutButton}>
            ログアウトする
          </button>
          <button type="button" onClick={handleCancel} className={styles.cancelButton}>
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
