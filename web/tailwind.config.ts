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
