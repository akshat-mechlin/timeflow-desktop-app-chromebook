import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));

// GitHub Pages serves project sites at https://<user>.github.io/<repo>/
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repoName =
  process.env.GITHUB_REPOSITORY?.split('/')[1] || 'timeflow-desktop-app-chromebook';

export default defineConfig({
  base: isGitHubPages ? `/${repoName}/` : '/',
  root: '.',
  publicDir: 'public',
  define: {
    'process.env.SCREENSHOT_STORAGE_SERVER_URL': JSON.stringify(
      process.env.SCREENSHOT_STORAGE_SERVER_URL || 'https://timeflowstorage.mechlintech.com'
    ),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  assetsInclude: ['**/*.svg'],
  resolve: {
    alias: {
      electron: resolve(__dirname, 'lib/electron-shim.js'),
      'screenshot-desktop': resolve(__dirname, 'lib/screenshot-chromebook.js'),
      sharp: resolve(__dirname, 'lib/sharp-chromebook.js'),
      dotenv: resolve(__dirname, 'lib/dotenv-stub.js'),
      fs: resolve(__dirname, 'lib/fs-stub.js'),
      path: resolve(__dirname, 'lib/path-stub.js'),
      os: resolve(__dirname, 'lib/os-stub.js'),
      crypto: resolve(__dirname, 'lib/crypto-stub.js'),
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process/browser', '@supabase/supabase-js'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        oauth: resolve(__dirname, 'oauth-callback.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
