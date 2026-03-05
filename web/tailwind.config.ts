import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.mdx',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        heading: 'var(--color-heading)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-links': 'var(--color-accent)',
            '--tw-prose-code': 'var(--color-accent)',
          },
        },
        invert: {
          css: {
            '--tw-prose-links': 'var(--color-accent)',
            '--tw-prose-code': 'var(--color-accent)',
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
