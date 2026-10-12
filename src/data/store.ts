import { use, useEffect, useState } from 'react'
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  waitForPendingWrites,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { COLLECTIONS, LAST_LIST_STORAGE_KEY } from '../../shared/constants'
import { db, uid } from '../firebase'
import { readStored, writeStored } from '../storage'
import { historyKey, normalize, type HistoryEntry, type Household, type Item, type List } from './items'

const households = collection(db, COLLECTIONS.households)
const lists = collection(db, COLLECTIONS.lists)
const household = (householdId: string) => doc(households, householdId)
const items = (listId: string) => collection(db, COLLECTIONS.lists, listId, COLLECTIONS.items)
const history = (listId: string) => collection(db, COLLECTIONS.lists, listId, COLLECTIONS.history)
const householdsOf = (member: string) => query(households, where('members', 'array-contains', member))
const listsOf = (householdId: string) => query(lists, where('householdId', '==', householdId))

const fail = (e: unknown) => console.error(e)

// The rules refuse a listener whose access rests on a write still on its way to the server, such as a
// household just created or joined, and a refused listener stops for good. So it starts again once this
// device's pending writes have landed, and gives up if it is refused again before the server has answered it.
function listen(q: Query, includeMetadataChanges: boolean, next: (s: QuerySnapshot) => void) {
  let stop: Unsubscribe
  let active = true
  const attempt = (mayRetry: boolean) => {
    stop = onSnapshot(q, { includeMetadataChanges }, (s) => {
      if (!s.metadata.fromCache) mayRetry = true
      next(s)
    }, (e) => {
      if (e.code === 'permission-denied' && mayRetry) waitForPendingWrites(db).then(() => active && attempt(false)).catch(fail)
      else fail(e)
    })
  }
  attempt(true)
  return () => {
    active = false
    stop()
  }
}

const latest = new Map<(key: string) => Query, Map<string, unknown[]>>()

function useLive<T>(key: string | undefined, build: (key: string) => Query, map: (d: QueryDocumentSnapshot<DocumentData>) => T, includeMetadataChanges = false) {
  const known = latest.get(build) ?? latest.set(build, new Map()).get(build)!
  const [, setDocs] = useState<T[]>()
  useEffect(() => {
    if (!key) return
    return listen(build(key), includeMetadataChanges, (s) => {
      const docs = s.docs.map(map)
      known.set(key, docs)
      setDocs(docs)
    })
  }, [key])
  const docs = key ? (known.get(key) as T[] | undefined) : []
  return { docs: docs ?? [], loading: !docs }
}

function useLiveDoc<T>(key: string | undefined, build: (key: string) => DocumentReference, map: (d: DocumentData) => T) {
  const [state, setState] = useState<{ key?: string; value?: T }>({})
  useEffect(() => {
    if (!key) return
    return onSnapshot(build(key), (s) => setState({ key, value: s.exists() ? map(s.data()) : undefined }), fail)
  }, [key])
  return { value: state.key === key ? state.value : undefined, loading: state.key !== key }
}

const toHousehold = (id: string, data: DocumentData): Household => ({ id, members: data.members, names: data.names ?? {} })

export const useUid = () => use(uid)

export const useHouseholds = () => useLive(useUid(), householdsOf, (d) => toHousehold(d.id, d.data()))

export const useHouseholdById = (householdId?: string) => useLiveDoc(householdId, household, (data) => data as Pick<Household, 'members' | 'names'>)

export const useLists = (householdId?: string) =>
  useLive(householdId, listsOf, (d): List => ({ id: d.id, name: d.data().name, synced: !d.metadata.hasPendingWrites }), true)

const syncedId = (list?: List) => (list?.synced ? list.id : undefined)

export const useItems = (list?: List) =>
  useLive(syncedId(list), items, (d): Item => {
    const data = d.data({ serverTimestamps: 'estimate' })
    return { id: d.id, name: data.name, checked: data.checked, createdAt: data.createdAt?.toMillis() ?? 0 }
  })

export const useHistory = (list?: List) =>
  useLive(syncedId(list), history, (d): HistoryEntry => ({ name: d.data().name, count: d.data().count }))

export function createHousehold(member: string) {
  const ref = doc(households)
  setDoc(ref, { members: [member], names: {}, createdAt: serverTimestamp() }).catch(fail)
  return ref.id
}

export async function adoptLegacyLists(member: string, householdId: string) {
  const legacy = await getDocs(query(lists, where('members', 'array-contains', member)))
  const batch = writeBatch(db)
  legacy.docs.filter((d) => !d.data().householdId).forEach((d) => batch.update(d.ref, { householdId }))
  return batch.commit()
}

export function joinHousehold(member: string, target: string, current: Household | undefined, own: List[]) {
  const batch = writeBatch(db)
  batch.update(household(target), { members: arrayUnion(member) })
  own.forEach((list) => batch.update(doc(lists, list.id), { householdId: target }))
  if (current && current.id !== target) batch.update(household(current.id), { members: arrayRemove(member) })
  batch.commit().catch(fail)
}

export const setName = (householdId: string, member: string, name: string) =>
  updateDoc(household(householdId), { [`names.${member}`]: name }).catch(fail)

export function createList(householdId: string, name: string) {
  const ref = doc(lists)
  setDoc(ref, { name, householdId, createdAt: serverTimestamp() }).catch(fail)
  return ref.id
}

export const setChecked = (listId: string, itemId: string, checked: boolean) =>
  updateDoc(doc(items(listId), itemId), { checked }).catch(fail)

export function addItem(listId: string, name: string, existing: Item[]) {
  const match = existing.find((i) => normalize(i.name) === normalize(name))
  if (!match) addDoc(items(listId), { name, checked: false, createdAt: serverTimestamp() }).catch(fail)
  else if (match.checked) setChecked(listId, match.id, false)
  setDoc(doc(history(listId), historyKey(name)), { name, count: increment(1) }, { merge: true }).catch(fail)
}

export const deleteItem = (listId: string, itemId: string) => deleteDoc(doc(items(listId), itemId)).catch(fail)

export const restoreItem = (listId: string, { id, ...item }: Item) =>
  setDoc(doc(items(listId), id), { ...item, createdAt: Timestamp.fromMillis(item.createdAt) }).catch(fail)

export function clearChecked(listId: string, all: Item[]) {
  const batch = writeBatch(db)
  all.filter((i) => i.checked).forEach((i) => batch.delete(doc(items(listId), i.id)))
  batch.commit().catch(fail)
}

export async function deleteList(listId: string) {
  const batch = writeBatch(db)
  const subs = await Promise.all([getDocs(items(listId)), getDocs(history(listId))])
  subs.flatMap((s) => s.docs).forEach((d) => batch.delete(d.ref))
  batch.delete(doc(lists, listId))
  return batch.commit().catch(fail)
}

export const rememberList = (listId: string) => writeStored(LAST_LIST_STORAGE_KEY, listId)
export const lastListId = () => readStored<string | undefined>(LAST_LIST_STORAGE_KEY, undefined)
