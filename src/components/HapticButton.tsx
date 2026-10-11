import type { ButtonHTMLAttributes } from 'react'
import { HAPTIC_VIBRATE_MS } from '../../shared/constants'

const hasSwitchHaptics = () => 'switch' in HTMLInputElement.prototype

export function haptic() {
  if (!hasSwitchHaptics()) return void navigator.vibrate?.(HAPTIC_VIBRATE_MS)
  const label = document.createElement('label')
  const input = label.appendChild(document.createElement('input'))
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.hidden = true
  document.body.append(label)
  label.click()
  label.remove()
}

export function HapticButton({ onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      onClick={(event) => {
        haptic()
        onClick?.(event)
      }}
    />
  )
}
