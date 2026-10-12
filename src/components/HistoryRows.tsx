import { Check, Plus } from 'lucide-react'
import { ICON_SIZE, LABELS } from '../../shared/constants'
import { normalize, type HistoryEntry } from '../data/items'
import { HapticButton } from './HapticButton'

export function HistoryRows({ entries, onList, onAdd }: { entries: HistoryEntry[]; onList: Set<string>; onAdd: (name: string) => void }) {
  return (
    <div className="bleed reveal">
      {entries.map((h) => {
        const added = onList.has(normalize(h.name))
        const Icon = added ? Check : Plus
        return (
          <HapticButton
            key={h.name}
            className="row pick"
            aria-pressed={added}
            disabled={added}
            aria-label={LABELS.oftenAdd(h.name)}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => onAdd(h.name)}
          >
            <span className="row-name">{h.name}</span>
            <Icon className="row-check" size={ICON_SIZE} strokeWidth={3} aria-hidden="true" />
          </HapticButton>
        )
      })}
    </div>
  )
}
