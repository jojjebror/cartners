import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type SyntheticEvent } from 'react'
import { KEYBOARD_INSET_VAR, MOTION, REDUCED_MOTION_QUERY, SPLASH, SWIPE, paths } from '../shared/constants'

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

export function useSwipeAway() {
  const drag = useRef<{ el: HTMLElement; id: number; x: number; y: number; dx: number; horizontal?: boolean }>(undefined)
  const swiped = useRef(false)

  const release = (onAway?: () => void) => {
    const d = drag.current
    drag.current = undefined
    if (!d?.horizontal) return
    const away = onAway && -d.dx > d.el.offsetWidth * SWIPE.removeRatio
    d.el.style.translate = ''
    const duration = reduced() ? 0 : away ? MOTION.exitMs : MOTION.moveMs
    const slide = d.el.animate({ translate: [`${d.dx}px`, away ? '-100%' : '0'] }, { duration, easing: MOTION.easing, fill: away ? 'forwards' : 'none' })
    if (away) slide.finished.then(onAway)
  }

  return (onAway: () => void) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      drag.current = { el: e.currentTarget, id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0 }
      swiped.current = false
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (d?.id !== e.pointerId) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (d.horizontal === undefined) {
        if (Math.hypot(dx, dy) < SWIPE.slopPx) return
        d.horizontal = swiped.current = -dx > Math.abs(dy)
        if (d.horizontal) d.el.setPointerCapture(e.pointerId)
      }
      if (!d.horizontal) return
      d.dx = Math.min(0, dx)
      d.el.style.translate = `${d.dx}px`
    },
    onPointerUp: () => release(onAway),
    onPointerCancel: () => release(),
    onClickCapture: (e: SyntheticEvent) => {
      if (!swiped.current) return
      e.preventDefault()
      e.stopPropagation()
    },
  })
}

export function useKeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement.style
    const update = () => root.setProperty(KEYBOARD_INSET_VAR, `${Math.max(0, innerHeight - viewport.height - viewport.offsetTop)}px`)
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      root.removeProperty(KEYBOARD_INSET_VAR)
    }
  }, [])
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
