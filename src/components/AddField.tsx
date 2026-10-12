import type { Ref } from 'react'
import { Plus } from 'lucide-react'
import { ICON_SIZE, LABELS } from '../../shared/constants'
import { HapticButton, haptic } from './HapticButton'

export function AddField({ ref, value, onChange, onSubmit, placeholder, autoFocus }: { ref?: Ref<HTMLInputElement>; value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder: string; autoFocus?: boolean }) {
  return (
    <form
      className="add"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim()) haptic()
        onSubmit()
      }}
    >
      <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} enterKeyHint="done" autoComplete="off" autoFocus={autoFocus} />
      <HapticButton type="button" className="add-button" aria-label={LABELS.add} onPointerDown={(e) => e.preventDefault()} onClick={onSubmit}>
        <Plus size={ICON_SIZE} strokeWidth={3} aria-hidden="true" />
      </HapticButton>
    </form>
  )
}
