import type { ButtonHTMLAttributes } from 'react'
import { hapticTrigger } from 'ios-haptics'
import { HAPTIC_VIBRATE_MS } from '../../shared/constants'

// Android vibrates on request. iOS gives no vibration API and since 26.5 only ticks when the finger itself
// toggles a switch, so each haptic button carries an invisible switch from ios-haptics.
export const haptic = () => void navigator.vibrate?.(HAPTIC_VIBRATE_MS)

export function HapticButton({ onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      ref={hapticTrigger}
      {...props}
      onClick={(event) => {
        haptic()
        onClick?.(event)
      }}
    />
  )
}
