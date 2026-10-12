import { INVITE, LOCALE, MAX_OFTEN } from '../../shared/constants'

export type Item = { id: string; name: string; checked: boolean; createdAt: number }
export type HistoryEntry = { name: string; count: number }
export type List = { id: string; name: string; synced: boolean }
export type Household = { id: string; members: string[]; names: Record<string, string> }

export const normalize = (name: string) => name.trim().toLocaleLowerCase(LOCALE)

export const historyKey = (name: string) => encodeURIComponent(normalize(name))

export const sortItems = (items: Item[]) =>
  items.toSorted((a, b) => Number(a.checked) - Number(b.checked) || a.createdAt - b.createdAt)

export const suggest = (history: HistoryEntry[], input: string) => oftenBought(history.filter((h) => normalize(h.name).startsWith(normalize(input))))

export const onListNames = (items: Item[]) => new Set(items.filter((i) => !i.checked).map((i) => normalize(i.name)))

export const oftenBought = (history: HistoryEntry[]) => history.toSorted((a, b) => b.count - a.count).slice(0, MAX_OFTEN)

const half = `[${INVITE.alphabet}]{${INVITE.length / 2}}`
const codeInText = new RegExp(`(?:^|[^A-Z0-9])(${half})[ -]?(${half})(?![A-Z0-9])`, 'g')

export const newInviteCode = () => Array.from(crypto.getRandomValues(new Uint32Array(INVITE.length)), (n) => INVITE.alphabet[n % INVITE.alphabet.length]).join('')

// Finds a code however it was typed, or in the whole message it was shared in.
export const findCode = (text: string) => {
  const found = [...text.toUpperCase().matchAll(codeInText)].at(-1)
  return found && found[1] + found[2]
}

export const formatCode = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`

export const primaryHousehold = (households: Household[]) => households.toSorted((a, b) => b.members.length - a.members.length || a.id.localeCompare(b.id))[0]
