import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/* The public address of the tool, so the Skill page always shares a link
   other people can open, even from a local copy. Set STRIKE_SITE_URL (in
   .env or the environment) to override; on Vercel it is read from the
   project's production domain automatically. */
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const site = env.STRIKE_SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  return {
    plugins: [react()],
    build: { chunkSizeWarningLimit: 700 },
    base: './',
    define: { __STRIKE_SITE__: JSON.stringify(site.replace(/\/+$/, '')) },
    test: { include: ['test/**/*.test.ts'] },
  } as never;
});
