import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MSS Sentinel — Market Sentiment Score',
  description: 'Real-time contrarian market sentiment monitor. VIX + Fear & Greed → investment signal.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
