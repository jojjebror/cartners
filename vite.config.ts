import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_DESCRIPTION, APP_NAME, LANG, LOGO_DRAWING, MOTION, SPLASH, THEME_COLORS, THEME_STORAGE_KEY } from './shared/constants/index.ts'

const { viewBox, paper, lines, line, check, colors } = LOGO_DRAWING
const splashContent = [
  `<svg class="splash-logo" viewBox="${viewBox}">`,
  '<g class="splash-paper">',
  `<path d="${paper}" fill="${colors.paper}" />`,
  ...lines.map(({ x, y, width, highlight }) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${line.height}" rx="${line.rx}" fill="${highlight ? colors.highlight : colors.badge}" opacity="${highlight ? 1 : line.opacity}" />`),
  '</g>',
  `<path class="splash-check" d="${check.d}" pathLength="1" stroke="${colors.badge}" stroke-width="${check.outline}" />`,
  `<path class="splash-check" d="${check.d}" pathLength="1" stroke="${colors.check}" stroke-width="${check.width}" />`,
  '</svg>',
  `<span class="splash-name">${[...APP_NAME].map((letter, i) => `<span style="--i: ${i}">${letter}</span>`).join('')}</span>`,
].join('')

const htmlConstants: Record<string, string> = {
  APP_NAME,
  APP_DESCRIPTION,
  LANG,
  THEME_LIGHT: THEME_COLORS.light,
  THEME_DARK: THEME_COLORS.dark,
  THEME_STORAGE_KEY,
  SPLASH_ID: SPLASH.id,
  SPLASH_LOGO_PX: String(SPLASH.logoPx),
  SPLASH_CONTENT: splashContent,
  LOGO_PAPER: colors.paper,
  LOGO_HIGHLIGHT: colors.highlight,
  MOTION_EASING: MOTION.easing,
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-constants',
      transformIndexHtml: { order: 'pre', handler: (html) => html.replace(/%(\w+)%/g, (match, key: string) => htmlConstants[key] ?? match) },
    },
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      pwaAssets: { config: true, injectThemeColor: false },
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: APP_DESCRIPTION,
        theme_color: THEME_COLORS.dark,
        background_color: THEME_COLORS.dark,
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: LANG,
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
  },
})
