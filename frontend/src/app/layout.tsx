import './globals.css';
import BottomNav from '@/components/layout/BottomNav';

export const metadata = {
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
      <body style={{ margin: 0, paddingBottom: '64px' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
