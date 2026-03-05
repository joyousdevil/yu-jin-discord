import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Yu-Jin',
  description: 'Yu-Jin is a fixer. She watches the door, keeps the ledger, and notices when people go quiet.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-mono" suppressHydrationWarning>
      <head>
        {/* Runs before hydration to set dark class from localStorage, preventing theme flash */}
        <script src="/theme-init.js" />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-[var(--color-text)]">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
