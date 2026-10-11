export const APP_NAME = 'Cartners'
export const APP_DESCRIPTION = 'En delad inköpslista'
export const APP_LOGO = '/logo.svg'
export const LANG = 'sv'
export const LOCALE = 'sv-SE'

export const LOGO_DRAWING = {
  viewBox: '0 0 512 512',
  badge: { size: 512, rx: 112 },
  paper: 'M150 96 H362 V404 L335 384 L308 404 L282 384 L256 404 L230 384 L204 404 L177 384 L150 404 Z',
  lines: [
    { x: 186, y: 150, width: 140 },
    { x: 186, y: 214, width: 100 },
    { x: 186, y: 278, width: 140, highlight: true },
  ],
  line: { height: 26, rx: 13, opacity: 0.25 },
  check: { d: 'M244 318 L298 368 L414 236', width: 32, outline: 60 },
  colors: { badge: '#0d0f12', paper: '#eceef1', highlight: '#ffcf3a', check: '#4fd486' },
}

export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]
export const DEFAULT_THEME: Theme = 'dark'
export const THEME_STORAGE_KEY = 'lappen:theme'
export const LAST_LIST_STORAGE_KEY = 'lappen:last-list'
export const THEME_COLORS: Record<Theme, string> = { light: '#eceef0', dark: LOGO_DRAWING.colors.badge }

export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000
