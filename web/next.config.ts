import path from 'path';
import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
});

const nextConfig: NextConfig = {
  output: 'export',
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: { unoptimized: true },
  // Silence workspace-root warning from having a lockfile in the parent dir
  outputFileTracingRoot: path.join(process.cwd(), '../'),
};

export default withMDX(nextConfig);
