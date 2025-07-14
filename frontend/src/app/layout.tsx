/**
 * @fileoverview ルートレイアウトコンポーネント
 * @description アプリケーション全体のレイアウトとフォント設定を管理
 * @author 平野
 * @created 2025-06-21
 * @updated 2025-07-02
 * @version 1.1.1
 */

import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import BottomNav from '@/components/layout/BottomNav';

const interFont = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const firaCodeFont = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Detour Navigation App',
  description: '目的地にすぐ行かず、遠回りを楽しむナビアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // pathname を取得するために必要な React hooks は client components でのみ使用可能なため、
  // BottomNav コンポーネント側で表示・非表示の条件分岐をする

  return (
    <html lang="ja">
      <body
        className={`${interFont.variable} ${firaCodeFont.variable}`}
        style={{ margin: 0 }}
      >
        <AuthProvider>
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
