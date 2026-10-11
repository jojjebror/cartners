export const APP_NAME = 'Cartners'
export const APP_DESCRIPTION = 'En delad inköpslista'
export const APP_LOGO = '/logo.svg'
export const LANG = 'sv'
export const LOCALE = 'sv-SE'

export const LOGO_DRAWING = {
  viewBox: '0 0 512 512',
  badge: { size: 512, rx: 112 },
  cart: { frame: 'M92 138 H142 L190 326 H382 L414 198 H157', width: 30, wheels: [214, 360], wheelY: 384, wheelRadius: 24 },
  check: { d: 'M222 236 L274 284 L412 132', width: 36, outline: 66 },
  colors: { badge: '#0d0f12', paper: '#eceef1', highlight: '#ffcf3a', check: '#4fd486' },
}

export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]
export const DEFAULT_THEME: Theme = 'dark'
export const THEME_STORAGE_KEY = 'lappen:theme'
export const LAST_LIST_STORAGE_KEY = 'lappen:last-list'
export const THEME_COLORS: Record<Theme, string> = { light: '#eceef0', dark: LOGO_DRAWING.colors.badge }

export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000
