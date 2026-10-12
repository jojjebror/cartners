import { describe, expect, it } from 'vitest'
import { MAX_OFTEN } from '../../shared/constants'
import { historyKey, inviteId, oftenBought, primaryHousehold, sortItems, suggest, type HistoryEntry, type Item } from './items'

const item = (name: string, checked = false, createdAt = 0): Item => ({ id: name, name, checked, createdAt })

describe('historyKey', () => {
  it('is case and whitespace insensitive and safe as a document id', () => {
    expect(historyKey('  Mjölk/Laktosfri ')).toBe(historyKey('mjölk/laktosfri'))
    expect(historyKey('a/b')).not.toContain('/')
  })
})

describe('sortItems', () => {
  it('puts unchecked items first in the order they were added', () => {
    const sorted = sortItems([item('c', true, 0), item('b', false, 2), item('a', false, 1)])
    expect(sorted.map((i) => i.name)).toEqual(['a', 'b', 'c'])
  })
})

describe('suggest', () => {
  const history: HistoryEntry[] = [
    { name: 'Schampo', count: 2 },
    { name: 'Schweizernöt', count: 5 },
    { name: 'Mjölk', count: 9 },
  ]

  it('matches by prefix, most used first', () => {
    expect(suggest(history, 'sch').map((h) => h.name)).toEqual(['Schweizernöt', 'Schampo'])
  })

  it('lists the whole history when nothing is typed', () => {
    expect(suggest(history, ' ').map((h) => h.name)).toEqual(['Mjölk', 'Schweizernöt', 'Schampo'])
  })
})

describe('oftenBought', () => {
  it('lists the most added first, capped', () => {
    const many = Array.from({ length: MAX_OFTEN + 2 }, (_, i) => ({ name: `a${i}`, count: i }))
    const often = oftenBought(many)
    expect(often).toHaveLength(MAX_OFTEN)
    expect(often[0].count).toBe(MAX_OFTEN + 1)
  })
})

describe('primaryHousehold', () => {
  it('prefers the household shared with others', () => {
    const own = { id: 'a', members: ['me'], names: {} }
    const shared = { id: 'b', members: ['me', 'you'], names: {} }
    expect(primaryHousehold([own, shared])).toBe(shared)
    expect(primaryHousehold([])).toBeUndefined()
  })
})

describe('inviteId', () => {
  it('finds the household in a pasted invite, shared text included', () => {
    expect(inviteId('https://cartners.app/join/nWXjesXUsJ3VuDTPttMT')).toBe('nWXjesXUsJ3VuDTPttMT')
    expect(inviteId('Gå med i vårt hushåll i Cartners https://cartners.app/join/abc123 ')).toBe('abc123')
    expect(inviteId('https://cartners.app/list/abc123')).toBeUndefined()
    expect(inviteId(' ')).toBeUndefined()
  })
})
