import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-bg/70 backdrop-blur-md px-6 py-4 animate-fade-in">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-heading font-bold tracking-tight hover:text-accent transition-colors">
          Yu-Jin
        </Link>
        <div className="flex items-center gap-5 text-sm text-muted">
          <Link href="/guide" className="hover:text-accent transition-colors">Guide</Link>
          <Link href="/tos" className="hover:text-accent transition-colors">ToS</Link>
          <Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
