import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] px-6 py-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between text-sm text-muted">
        <span>Yu-Jin — Discord bot</span>
        <a
          href="https://github.com/joyousdevil/yu-jin-discord"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
          className="hover:text-accent transition-colors"
        >
          <Github size={16} strokeWidth={1.5} />
        </a>
      </div>
    </footer>
  );
}
