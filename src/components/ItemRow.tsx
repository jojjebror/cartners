import { useEffect, useRef, type PointerEvent } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { animate, m, useMotionValue, useReducedMotion } from 'motion/react'
import { DRAG, ICON_SIZE, LABELS, MOTION, SMALL_ICON_SIZE, SWIPE } from '../../shared/constants'
import type { Item } from '../data/items'
import { HapticButton, haptic } from './HapticButton'

// A row swiped to the left opens on a delete button instead of deleting the item outright: iOS only ticks for
// a tap, so removing an item takes one. The button slides in over the row, which stays put so its name shows.
export function ItemRow({ item, open, leaving, onOpen, onToggle, onRemove }: { item: Item; open: boolean; leaving: boolean; onOpen: (open: boolean) => void; onToggle: () => void; onRemove: () => void }) {
  const hidden = useMotionValue<number>(SWIPE.actionPx)
  const out = useMotionValue(0)
  const wrapper = useRef<HTMLDivElement>(null)
  const pan = useRef<{ id: number; x: number; y: number; from: number; t: number; v: number; axis?: 'x' | 'y' }>(undefined)
  const panned = useRef(false)
  const reduced = useReducedMotion()
  const snap = (to: number) => animate(hidden, to, reduced ? { duration: 0 } : { type: 'spring', visualDuration: SWIPE.seconds, bounce: 0 })

  useEffect(() => {
    const to = open ? 0 : SWIPE.actionPx
    if (hidden.get() !== to) snap(to)
  }, [open])

  const release = (cancelled = false) => {
    const g = pan.current
    pan.current = undefined
    if (g?.axis !== 'x') return
    const opens = cancelled ? open : g.v < -DRAG.flickPxPerMs || (g.v < DRAG.flickPxPerMs && hidden.get() < SWIPE.actionPx / 2)
    if (opens !== open) onOpen(opens)
    else snap(open ? 0 : SWIPE.actionPx)
    if (opens && !open) haptic()
  }

  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const g = pan.current
    if (g?.id !== e.pointerId) return
    const dx = e.clientX - g.x
    if (!g.axis) {
      if (Math.hypot(dx, e.clientY - g.y) < DRAG.slopPx) return
      // A shut row only opens to the left; a swipe to the right from the edge is the page's back gesture.
      g.axis = Math.abs(dx) > Math.abs(e.clientY - g.y) && (open || dx < 0) ? 'x' : 'y'
      if (g.axis === 'y') return
      panned.current = true
      hidden.stop()
      g.from = hidden.get()
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (g.axis !== 'x') return
    const next = Math.min(SWIPE.actionPx, Math.max(0, g.from + dx))
    g.v = (next - hidden.get()) / Math.max(1, e.timeStamp - g.t)
    g.t = e.timeStamp
    hidden.set(next)
  }

  const remove = () => animate(out, -(wrapper.current?.offsetWidth ?? 0), { duration: reduced ? 0 : MOTION.exitMs / 1000, ease: 'easeIn' }).then(onRemove)

  return (
    <m.div ref={wrapper} className={leaving ? 'swipe-row leaving' : 'swipe-row'} data-key={item.id} style={{ x: out }}>
      <button
        className="row item"
        aria-pressed={item.checked}
        onPointerDown={(e) => {
          panned.current = false
          pan.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: 0, t: e.timeStamp, v: 0 }
        }}
        onPointerMove={move}
        onPointerUp={() => release()}
        onPointerCancel={() => release(true)}
        onClick={() => {
          if (panned.current) panned.current = false
          else onToggle()
        }}
      >
        <span className="row-name">{item.name}</span>
        {item.checked && <Check className="row-check reveal" size={ICON_SIZE} strokeWidth={3} aria-hidden="true" />}
      </button>
      <m.div className="swipe-action" style={{ width: SWIPE.actionPx, x: hidden }} inert={!open}>
        <HapticButton className="swipe-delete" aria-label={LABELS.removeItem(item.name)} onClick={remove}>
          <Trash2 size={SMALL_ICON_SIZE} aria-hidden="true" />
          {LABELS.delete}
        </HapticButton>
      </m.div>
    </m.div>
  )
}
