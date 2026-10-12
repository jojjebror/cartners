import { LOCALE, MAX_OFTEN, paths } from '../../shared/constants'

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

const invitePattern = new RegExp(`${paths.join('')}([A-Za-z0-9]+)`)

export const inviteId = (text: string) => text.match(invitePattern)?.[1]

export const primaryHousehold = (households: Household[]) => households.toSorted((a, b) => b.members.length - a.members.length || a.id.localeCompare(b.id))[0]
