'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    setDark(isDark);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      className="text-muted hover:text-accent transition-colors text-base leading-none"
    >
      {dark ? '☀' : '☾'}
    </button>
  );
}
