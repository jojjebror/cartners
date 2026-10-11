import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useParams } from 'react-router'
import { LABELS, LIST_PARAM, MOTION, SMALL_ICON_SIZE, UNDO_MS } from '../../shared/constants'
import { AddField } from '../components/AddField'
import { AppHeader, useBack } from '../components/AppHeader'
import { HapticButton } from '../components/HapticButton'
import { sortItems, suggest, type Item } from '../data/items'
import { addItem, clearChecked, deleteItem, deleteList, rememberList, restoreItem, setChecked, useHistory, useItems, useLists } from '../data/store'
import { useHousehold } from '../household'
import { useFlip, useKeyboardInset, usePresence, useSwipeAway } from '../motion'

export function ListPage() {
  const id = useParams()[LIST_PARAM]!
  const { household } = useHousehold()
  const lists = useLists(household?.id)
  const list = lists.docs.find((l) => l.id === id)
  const items = useItems(list)
  const history = useHistory(list)
  const [input, setInput] = useState('')
  const [undo, setUndo] = useState<{ text: string; revert: () => void }>()
  const [clearing, setClearing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const options = useRef<HTMLDialogElement>(null)
  const goBack = useBack()
  const toast = usePresence(undo)
  const [basketOpen, setBasketOpen] = useState(false)
  const sorted = sortItems(items.docs)
  const basket = sorted.filter((i) => i.checked)
  const left = sorted.length - basket.length
  const rows = useFlip<HTMLDivElement>(sorted.map((i) => `${i.id}:${i.checked}`).join())
  const swipe = useSwipeAway()
  useKeyboardInset()

  useEffect(() => rememberList(id), [id])

  useEffect(() => {
    if (!undo) return
    const timer = setTimeout(() => setUndo(undefined), UNDO_MS)
    return () => clearTimeout(timer)
  }, [undo])

  const add = (name: string) => {
    if (name.trim()) addItem(id, name.trim(), items.docs)
    setInput('')
  }

  const toggle = (item: Item) => {
    setChecked(id, item.id, !item.checked)
    setUndo(item.checked ? undefined : { text: LABELS.checked(item.name), revert: () => setChecked(id, item.id, false) })
  }

  const discard = (item: Item) => {
    deleteItem(id, item.id)
    setUndo({ text: LABELS.removed(item.name), revert: () => restoreItem(id, item) })
  }

  const clear = () => {
    setClearing(true)
    setUndo(undefined)
    setTimeout(() => {
      clearChecked(id, items.docs)
      setClearing(false)
    }, MOTION.exitMs)
  }

  const remove = () => {
    deleteList(id)
    goBack()
  }

  const row = (item: Item) => (
    <HapticButton
      key={item.id}
      data-key={item.id}
      className={clearing && item.checked ? 'row item leaving' : 'row item'}
      aria-pressed={item.checked}
      onClick={() => toggle(item)}
      {...swipe(() => discard(item))}
    >
      <span className="row-name">{item.name}</span>
      <span className="check-box">{item.checked && <Check size={SMALL_ICON_SIZE + 1} strokeWidth={3.5} aria-hidden="true" />}</span>
      <span className="swipe-action" aria-hidden="true">
        <Trash2 size={SMALL_ICON_SIZE} aria-hidden="true" />
        {LABELS.delete}
      </span>
    </HapticButton>
  )

  return (
    <>
      <AppHeader back onMore={list && (() => options.current?.showModal())} />
      <main className="body stack-tight docked">
        <div className="title-row">
          <h1 className="page-title">{list?.name}</h1>
          {list && !items.loading && (
            <span className="left-count">
              <b>{left}</b> {LABELS.left}
            </span>
          )}
        </div>
        {household && !lists.loading && !list && <p className="hint">{LABELS.listMissing}</p>}
        <div className="bleed" ref={rows}>
          {sorted.slice(0, left).map(row)}
          {basket.length > 0 && (
            <button className="basket" aria-expanded={basketOpen} onClick={() => setBasketOpen(!basketOpen)}>
              {LABELS.inBasket}
              <ChevronDown size={SMALL_ICON_SIZE} aria-hidden="true" />
            </button>
          )}
          {basketOpen && basket.map(row)}
        </div>
        {sorted.length > 0 && (
          <div className="sum">
            <span className="sum-line">
              {LABELS.left}
              <span className="leader" />
              <mark>{left}</mark>
            </span>
            <span className="sum-line soft">
              {LABELS.inBasket}
              <span className="leader" />
              <span>{basket.length}</span>
            </span>
          </div>
        )}
        {basket.length > 0 && (
          <button className="text-button reveal" onClick={clear}>
            {LABELS.clearChecked}
          </button>
        )}
      </main>
      {createPortal(
        <div className="dock reveal">
          <div className="chips">
            {suggest(history.docs, input, items.docs).map((s) => (
              <button key={s.name} className="chip reveal" onPointerDown={(e) => e.preventDefault()} onClick={() => add(s.name)}>
                <Plus size={SMALL_ICON_SIZE - 2} strokeWidth={3} aria-hidden="true" />
                {s.name}
              </button>
            ))}
          </div>
          <AddField value={input} onChange={setInput} onSubmit={() => add(input)} placeholder={LABELS.addItem} />
        </div>,
        document.body,
      )}
      <dialog ref={options} className="sheet" aria-label={LABELS.listOptions} onClose={() => setConfirming(false)} onClick={(e) => e.target === e.currentTarget && options.current?.close()}>
        {list && (
          <div className="sheet-body stack-tight">
            <h2 className="section-title">{list.name}</h2>
            {confirming ? (
              <div className="stack-tight reveal">
                <p className="hint">{LABELS.deleteListHint(list.name)}</p>
                <div className="confirm-actions">
                  <button className="outline-button" onClick={() => options.current?.close()}>
                    {LABELS.cancel}
                  </button>
                  <HapticButton className="solid-button danger" onClick={remove}>
                    {LABELS.delete}
                  </HapticButton>
                </div>
              </div>
            ) : (
              <button className="text-button danger" onClick={() => setConfirming(true)}>
                <Trash2 size={SMALL_ICON_SIZE} aria-hidden="true" />
                {LABELS.deleteList}
              </button>
            )}
          </div>
        )}
      </dialog>
      {toast.shown && (
        <div className={toast.leaving ? 'toast leaving' : 'toast'} key={toast.shown.text} role="status">
          <span>{toast.shown.text}</span>
          <button
            className="text-button"
            onClick={() => {
              toast.shown!.revert()
              setUndo(undefined)
            }}
          >
            {LABELS.undo}
          </button>
        </div>
      )}
    </>
  )
}
