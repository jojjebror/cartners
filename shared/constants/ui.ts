import { APP_NAME, type Theme } from './app.ts'

export const LIST_PARAM = 'listId'
export const HOUSEHOLD_PARAM = 'householdId'

export const paths = {
  home: '/',
  list: (id: string) => `/list/${id}`,
  often: '/often',
  settings: '/settings',
  join: (id: string) => `/join/${id}`,
}

export const routePatterns = {
  list: `list/:${LIST_PARAM}`,
  often: 'often',
  settings: 'settings',
  join: `join/:${HOUSEHOLD_PARAM}`,
}

export const ICON_SIZE = 18
export const NAV_ICON_SIZE = 22
export const SMALL_ICON_SIZE = 14
export const LOGO_SIZES = { wordmark: 36 }
export const HAPTIC_VIBRATE_MS = 10
export const UNDO_MS = 4000
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
export const MOTION = { easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', page: { durationMs: 240, shiftPx: 28 }, moveMs: 260, exitMs: 200 }
export const SWIPE = { slopPx: 10, removeRatio: 0.4 }
export const KEYBOARD_INSET_VAR = '--keyboard-inset'
export const SPLASH = { id: 'splash', showMs: 2000, fadeMs: 300, logoPx: 112 }

export const NAV_LABELS = { main: 'Huvudmeny', lists: 'Listor', often: 'Ofta köpt', settings: 'Inställningar' }
export const THEME_TOGGLE_LABELS: Record<Theme, string> = { light: 'Byt till mörkt läge', dark: 'Byt till ljust läge' }
export const THEME_LABELS: Record<Theme, string> = { light: 'Ljust', dark: 'Mörkt' }

export const LABELS = {
  yourLists: 'Era listor',
  newList: 'Ny lista',
  create: 'Skapa',
  back: 'Listor',
  share: 'Dela listan',
  addItem: 'Lägg till vara',
  add: 'Lägg till',
  clearChecked: 'Rensa avbockade',
  undo: 'Ångra',
  checked: (name: string) => `${name} i korgen`,
  removed: (name: string) => `${name} borttagen`,
  left: 'kvar',
  inBasket: 'I korgen',
  basketOf: (done: number, total: number) => `${done} av ${total} i korgen`,
  emptyList: 'Inga varor än',
  notFound: 'Sidan finns inte.',
  goHome: 'Till era listor',
  noLists: 'Inga listor än. Skapa en och dela den med den du handlar med.',
  oftenHint: (list: string) => `Det ni lägger till oftast. Tryck på plus för att lägga till på ${list}.`,
  oftenEmpty: 'Här hamnar det ni lägger till ofta. Börja med att skapa en lista.',
  oftenAdd: (name: string) => `Lägg till ${name}`,
  appearance: 'Utseende',
  household: 'Hushåll',
  yourName: 'Ditt namn',
  namePlaceholder: 'Vad ska de andra se?',
  you: 'Du',
  unnamed: 'Utan namn',
  invite: 'Bjud in',
  copied: 'Länken är kopierad',
  inviteHint: 'Alla i hushållet ser och ändrar samma listor.',
  inviteTitle: APP_NAME,
  inviteText: `Gå med i vårt hushåll i ${APP_NAME}`,
  joinTitle: 'Gå med i hushållet',
  joinHint: (names: string) => (names ? `${names} har bjudit in dig.` : 'Du har blivit inbjuden.'),
  joinMoves: 'Ni delar sedan alla listor, och dina listor följer med.',
  join: 'Gå med',
  joinGone: 'Inbjudan gäller inte längre.',
  listMissing: 'Listan finns inte i ert hushåll.',
  listOptions: 'Alternativ för listan',
  deleteList: 'Ta bort listan',
  deleteListHint: (name: string) => `${name} och alla varor på den försvinner för hela hushållet.`,
  cancel: 'Avbryt',
  delete: 'Ta bort',
  about: `Om ${APP_NAME}`,
}
