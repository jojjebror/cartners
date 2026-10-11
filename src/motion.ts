import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type RefObject, type SyntheticEvent } from 'react'
import { DRAG, MOTION, REDUCED_MOTION_QUERY, SPLASH, STANDALONE_QUERY, paths } from '../shared/constants'
import { haptic } from './components/HapticButton'

const reduced = () => matchMedia(REDUCED_MOTION_QUERY).matches

const routeDepth = (path: string) =>
  path === paths.settings ? 3 : path === paths.often ? 2 : path.startsWith(paths.list('')) || path.startsWith(paths.join('')) ? 1 : 0

export function usePageSlide<T extends HTMLElement>(pathname: string) {
  const ref = useRef<T>(null)
  const shown = useRef(pathname)
  useLayoutEffect(() => {
    const direction = Math.sign(routeDepth(pathname) - routeDepth(shown.current))
    shown.current = pathname
    if (reduced()) return
    const { durationMs, shiftPx } = MOTION.page
    ref.current?.animate({ opacity: [0, 1], transform: [`translateX(${direction * shiftPx}px)`, 'none'] }, { duration: durationMs, easing: MOTION.easing })
  }, [pathname])
  return ref
}

export function useFlip<T extends HTMLElement>(signature: string) {
  const ref = useRef<T>(null)
  const tops = useRef(new Map<string, number>())
  useLayoutEffect(() => {
    const next = new Map<string, number>()
    for (const el of Array.from(ref.current?.children ?? []) as HTMLElement[]) {
      const key = el.dataset.key
      if (!key) continue
      const before = tops.current.get(key)
      next.set(key, el.offsetTop)
      if (reduced() || tops.current.size === 0) continue
      if (before === undefined) el.animate({ opacity: [0, 1], transform: ['translateY(6px)', 'none'] }, { duration: MOTION.moveMs, easing: MOTION.easing })
      else if (before !== el.offsetTop) el.animate({ transform: [`translateY(${before - el.offsetTop}px)`, 'none'] }, { duration: MOTION.moveMs, easing: MOTION.easing })
    }
    tops.current = next
  }, [signature])
  return ref
}

export function usePresence<T>(value: T | undefined) {
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (value !== undefined) return setShown(value)
    const timer = setTimeout(() => setShown(undefined), reduced() ? 0 : MOTION.exitMs)
    return () => clearTimeout(timer)
  }, [value])
  return { shown: value ?? shown, leaving: value === undefined && shown !== undefined }
}

export function useDragAway({ axis, sign, ratio, from }: { axis: 'x' | 'y'; sign: 1 | -1; ratio: number; from?: (e: PointerEvent<HTMLElement>) => boolean }) {
  const drag = useRef<{ els: HTMLElement[]; id: number; x: number; y: number; d: number; t: number; v: number; on?: boolean }>(undefined)
  const dragged = useRef(false)
  const shift = (d: number | string) => (axis === 'x' ? `${d} 0` : `0 ${d}`)

  const release = (onAway?: () => void) => {
    const g = drag.current
    drag.current = undefined
    if (!g?.on) return
    const size = axis === 'x' ? g.els[0].offsetWidth : g.els[0].offsetHeight
    const away = onAway && (sign * g.d > size * ratio || sign * g.v > DRAG.flickPxPerMs)
    if (away) haptic()
    const duration = reduced() ? 0 : away ? MOTION.exitMs : MOTION.moveMs
    const slides = g.els.map((el) => {
      el.style.translate = ''
      return el.animate({ translate: [shift(`${g.d}px`), shift(away ? `${sign * 100}%` : 0)] }, { duration, easing: MOTION.easing, fill: away ? 'forwards' : 'none' })
    })
    if (away) slides[0].finished.then(onAway)
  }

  return (onAway: () => void, els: (el: HTMLElement) => (HTMLElement | null)[] = (el) => [el]) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      dragged.current = false
      if (from && !from(e)) return
      drag.current = { els: els(e.currentTarget).filter((el) => el !== null), id: e.pointerId, x: e.clientX, y: e.clientY, d: 0, t: e.timeStamp, v: 0 }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const g = drag.current
      if (g?.id !== e.pointerId) return
      const along = axis === 'x' ? e.clientX - g.x : e.clientY - g.y
      const across = axis === 'x' ? e.clientY - g.y : e.clientX - g.x
      if (g.on === undefined) {
        if (Math.hypot(along, across) < DRAG.slopPx) return
        g.on = dragged.current = sign * along > Math.abs(across)
        if (g.on) e.currentTarget.setPointerCapture(e.pointerId)
      }
      if (!g.on) return
      const d = sign > 0 ? Math.max(0, along) : Math.min(0, along)
      g.v = (d - g.d) / Math.max(1, e.timeStamp - g.t)
      g.t = e.timeStamp
      g.d = d
      g.els.forEach((el) => (el.style.translate = shift(`${d}px`)))
    },
    onPointerUp: () => release(onAway),
    onPointerCancel: () => release(),
    onClickCapture: (e: SyntheticEvent) => {
      if (!dragged.current) return
      e.preventDefault()
      e.stopPropagation()
    },
  })
}

export function useScrolledPast<T extends HTMLElement>(header: RefObject<HTMLElement | null>) {
  const ref = useRef<T>(null)
  const [past, setPast] = useState(false)
  useEffect(() => {
    const update = () => setPast(!!ref.current && !!header.current && ref.current.getBoundingClientRect().bottom <= header.current.getBoundingClientRect().bottom)
    update()
    addEventListener('scroll', update, { passive: true })
    return () => removeEventListener('scroll', update)
  }, [])
  return [ref, past] as const
}

export const standalone = () => matchMedia(STANDALONE_QUERY).matches

export function shut(dialog: HTMLDialogElement) {
  dialog.close()
  dialog.getAnimations().forEach((a) => a.cancel())
}

export function dismiss(dialog: HTMLDialogElement | null) {
  if (!dialog) return
  dialog.animate({ translate: ['0 0', '0 100%'] }, { duration: reduced() ? 0 : MOTION.exitMs, easing: 'ease-in', fill: 'forwards' }).finished.then(() => shut(dialog))
}

export const withViewTransition = (update: () => void) =>
  'startViewTransition' in document && !reduced() ? document.startViewTransition(update) : update()

export function hideSplash(splash = document.getElementById(SPLASH.id)) {
  if (!splash) return
  setTimeout(() => {
    const duration = reduced() ? 0 : SPLASH.fadeMs
    splash.inert = true
    splash.animate({ opacity: [1, 0] }, { duration, easing: MOTION.easing, fill: 'forwards' }).finished.then(() => splash.remove())
  }, SPLASH.showMs - performance.now())
}
