// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://umycarkeys.github.io',
  base: '/INCHUNWA-site-pages',
  output: 'static',
  integrations: [sitemap()],
  build: {
    assets: '_assets',
  },
});
