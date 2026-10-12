import { useCallback, useLayoutEffect, useRef, type ComponentProps } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m, useIsPresent } from 'motion/react'
import { ScrollRestoration, useLocation, useOutlet } from 'react-router'
import { BottomNav } from '../components/BottomNav'
import { HouseholdProvider } from '../household'
import { pageSlide, useSlideDirection } from '../motion'

// A page on its way out can no longer be tapped, so a second tap on back does not go back twice. It is also
// held where it is on screen before the window scrolls for the new page, which would otherwise make it jump.
function Page({ ref, ...props }: ComponentProps<typeof m.div>) {
  const present = useIsPresent()
  const own = useRef<HTMLDivElement>(null)
  const refs = useCallback(
    (el: HTMLDivElement | null) => {
      own.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
    },
    [ref],
  )
  useLayoutEffect(() => {
    const el = own.current
    if (present || !el) return
    const { top, left } = el.getBoundingClientRect()
    Object.entries({ position: 'fixed', top: `${top}px`, left: `${left}px` }).forEach(([key, value]) => el.style.setProperty(key, value, 'important'))
  }, [present])
  return <m.div ref={refs} {...props} inert={!present} />
}

export function AppLayout() {
  const { pathname } = useLocation()
  // The page on its way out keeps the outlet it was rendered with, so it does not turn into the new page mid-slide.
  const outlet = useOutlet()
  const direction = useSlideDirection(pathname)
  return (
    <HouseholdProvider>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <div className="app">
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <Page key={pathname} className="page" custom={direction} variants={pageSlide} initial="enter" animate="shown" exit="leave">
                {outlet}
              </Page>
            </AnimatePresence>
            <BottomNav />
            <ScrollRestoration />
          </div>
        </LazyMotion>
      </MotionConfig>
    </HouseholdProvider>
  )
}
