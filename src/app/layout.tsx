import './globals.css';
import { Providers } from '@/components/Providers';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'タビブ -TabiBookmark- | 家族のための旅のしおり',
  description: 'スマホで手軽に共有できる家族旅行用「旅のしおり」アプリ。日程・持ち物・旅費精算・写真をS3クラウド連携。',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased selection:bg-orange-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
