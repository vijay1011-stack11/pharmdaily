// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Emit every bundled <script> as a file instead of inlining small ones, so the
  // Content-Security-Policy in vercel.json only has to hash our two is:inline scripts.
  vite: { build: { assetsInlineLimit: 0 } },
  devToolbar: { enabled: false },
});
