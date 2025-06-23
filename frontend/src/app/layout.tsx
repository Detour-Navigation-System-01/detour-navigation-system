/**
 * @fileoverview ルートレイアウトコンポーネント
 * @description アプリケーション全体のレイアウトとフォント設定を管理（BottomNav含む）
 * @author 作成者名
 * @created 2025-06-22
 * @updated 2025-06-22
 * @version 1.0.1
 */

import 'leaflet/dist/leaflet.css';
import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import BottomNav from '@/components/layout/BottomNav';

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCodeFont = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Detour Navigation App",
  description: "目的地にすぐ行かず、遠回りを楽しむナビアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${interFont.variable} ${firaCodeFont.variable}`}
        style={{ margin: 0, paddingBottom: '64px' }}
      >
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
