/**
 * @fileoverview ルートレイアウトコンポーネント
 * @description アプリケーション全体のレイアウトとフォント設定を管理
 * @author あなたの名前
 * @created 2025-06-21
 * @updated 2025-06-21
 * @version 1.0.0
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
  return (
    <html lang="ja">
      <body
        className={`${interFont.variable} ${firaCodeFont.variable}`}
        style={{ margin: 0, paddingBottom: '64px' }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <BottomNav />
      </body>
    </html>
  );
}
