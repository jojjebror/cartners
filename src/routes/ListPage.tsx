import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { m, useIsPresent } from 'motion/react'
import { useParams } from 'react-router'
import { DRAG, ICON_SIZE, LABELS, LIST_PARAM, MOTION, SMALL_ICON_SIZE, UNDO_MS } from '../../shared/constants'
import { AddField } from '../components/AddField'
import { AppHeader, useBack } from '../components/AppHeader'
import { HapticButton, haptic } from '../components/HapticButton'
import { HistoryRows } from '../components/HistoryRows'
import { onListNames, sortItems, suggest, type Item } from '../data/items'
import { addItem, clearChecked, deleteItem, deleteList, rememberList, restoreItem, setChecked, useHistory, useItems, useLists } from '../data/store'
import { useHousehold } from '../household'
import { dismiss, shut, standalone, useDragAway, useFlip, usePresence, useScrolledPast } from '../motion'

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
  const adder = useRef<HTMLDialogElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const page = useRef<HTMLDivElement>(null)
  const dock = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLElement>(null)
  const [title, titled] = useScrolledPast<HTMLHeadingElement>(header)
  const goBack = useBack()
  const present = useIsPresent()
  const toast = usePresence(undo)
  const [basketOpen, setBasketOpen] = useState(true)
  const sorted = sortItems(items.docs)
  const basket = sorted.filter((i) => i.checked)
  const left = sorted.length - basket.length
  const rows = useFlip<HTMLDivElement>(sorted.map((i) => `${i.id}:${i.checked}`).join())
  const swipe = useDragAway({ axis: 'x', sign: -1, ratio: DRAG.removeRatio })
  const edge = useDragAway({ axis: 'x', sign: 1, ratio: DRAG.backRatio, from: (e) => e.clientX < DRAG.edgePx })
  const pull = useDragAway({ axis: 'y', sign: 1, ratio: DRAG.closeRatio })
  const pullDown = (dialog: RefObject<HTMLDialogElement | null>) => pull(() => dialog.current && shut(dialog.current), (el) => [el.closest('dialog')])
  const matches = suggest(history.docs, input)

  useEffect(() => rememberList(id), [id])

  useEffect(() => {
    if (!undo) return
    const timer = setTimeout(() => setUndo(undefined), UNDO_MS)
    return () => clearTimeout(timer)
  }, [undo])

  const add = (name: string) => {
    if (!name.trim()) return
    addItem(id, name.trim(), items.docs)
    dismiss(adder.current)
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

  const openAdder = () => {
    adder.current?.showModal()
    field.current?.focus({ preventScroll: true })
  }

  const remove = () => {
    if (options.current) shut(options.current)
    deleteList(id)
    goBack()
  }

  const row = (item: Item) => (
    <button
      key={item.id}
      data-key={item.id}
      className={clearing && item.checked ? 'row item leaving' : 'row item'}
      aria-pressed={item.checked}
      onClick={() => {
        haptic()
        toggle(item)
      }}
      {...swipe(() => discard(item))}
    >
      <span className="row-name">{item.name}</span>
      {item.checked && <Check className="row-check reveal" size={ICON_SIZE} strokeWidth={3} aria-hidden="true" />}
      <span className="swipe-action" aria-hidden="true">
        <Trash2 size={SMALL_ICON_SIZE} aria-hidden="true" />
        {LABELS.delete}
      </span>
    </button>
  )

  return (
    <>
      <div ref={page} className={standalone() ? 'edge-back' : undefined} {...(standalone() ? edge(goBack, () => [page.current?.closest<HTMLElement>('.page') ?? null, dock.current]) : {})}>
        <AppHeader ref={header} back title={list?.name} titleShown={titled} onMore={list && (() => options.current?.showModal())} />
        <main className="body stack-tight docked">
          <div className="title-row">
            <h1 ref={title} className="page-title">{list?.name}</h1>
            {list && !items.loading && (
              <span className="left-count">
                <b>{left}</b> {LABELS.left}
              </span>
            )}
          </div>
          {present && household && !lists.loading && !list && <p className="hint">{LABELS.listMissing}</p>}
          <div className="bleed" ref={rows}>
            {sorted.slice(0, left).map(row)}
            {basket.length > 0 && (
              <button className="basket" aria-expanded={basketOpen} onClick={() => setBasketOpen(!basketOpen)}>
                {LABELS.inBasket}
                <span className="badge">{basket.length}</span>
                <ChevronDown size={ICON_SIZE} aria-hidden="true" />
              </button>
            )}
            {basketOpen && basket.map(row)}
          </div>
          {basket.length > 0 && (
            <HapticButton className="text-button reveal" onClick={clear}>
              {LABELS.clearChecked}
            </HapticButton>
          )}
        </main>
        {toast.shown && present && (
          <div className={toast.leaving ? 'toast leaving' : 'toast'} key={toast.shown.text} role="status">
            <span>{toast.shown.text}</span>
            <HapticButton
              className="text-button"
              onClick={() => {
                toast.shown!.revert()
                setUndo(undefined)
              }}
            >
              {LABELS.undo}
            </HapticButton>
          </div>
        )}
      </div>
      {createPortal(
        <m.div ref={dock} className="dock" initial={{ opacity: 0 }} animate={{ opacity: present ? 1 : 0 }} style={{ pointerEvents: present ? undefined : 'none' }}>
          <HapticButton className="solid-button dock-add" disabled={!list} onClick={openAdder}>
            {LABELS.add}
            <Plus size={SMALL_ICON_SIZE + 2} strokeWidth={3} aria-hidden="true" />
          </HapticButton>
        </m.div>,
        document.body,
      )}
      <dialog ref={adder} className="adder" aria-label={LABELS.addItem} onClose={() => setInput('')}>
        <div className="adder-head drag-handle" {...pullDown(adder)}>
          <span className="grabber" />
          <div className="adder-bar">
            <AddField ref={field} value={input} onChange={setInput} onSubmit={() => add(input)} placeholder={LABELS.addItem} />
            <button className="text-button" onClick={() => dismiss(adder.current)}>
              {LABELS.done}
            </button>
          </div>
        </div>
        <div className="adder-body" onTouchMove={() => field.current?.blur()}>
          <h2 className="section-title">{LABELS.earlier}</h2>
          {matches.length > 0 ? <HistoryRows entries={matches} onList={onListNames(items.docs)} onAdd={add} /> : !input.trim() && <p className="hint">{LABELS.historyEmpty}</p>}
        </div>
      </dialog>
      <dialog ref={options} className="sheet" aria-label={LABELS.listOptions} onClose={() => setConfirming(false)} onClick={(e) => e.target === e.currentTarget && dismiss(options.current)}>
        {list && (
          <div className="sheet-body stack-tight drag-handle" {...pullDown(options)}>
            <span className="grabber" />
            <h2 className="section-title">{list.name}</h2>
            {confirming ? (
              <div className="stack-tight reveal">
                <p className="hint">{LABELS.deleteListHint(list.name)}</p>
                <div className="confirm-actions">
                  <button className="outline-button" onClick={() => dismiss(options.current)}>
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
    </>
  )
}
