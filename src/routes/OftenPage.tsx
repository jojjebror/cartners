import { LABELS, NAV_LABELS } from '../../shared/constants'
import { AppHeader } from '../components/AppHeader'
import { HistoryRows } from '../components/HistoryRows'
import { oftenBought, onListNames } from '../data/items'
import { addItem, lastListId, useHistory, useItems, useLists } from '../data/store'
import { useHousehold } from '../household'

export function OftenPage() {
  const { household } = useHousehold()
  const lists = useLists(household?.id)
  const remembered = lastListId()
  const target = lists.docs.find((l) => l.id === remembered) ?? lists.docs[0]
  const items = useItems(target)
  const history = useHistory(target)

  return (
    <>
      <AppHeader />
      <main className="body stack">
        <div className="intro">
          <h1 className="section-title">{NAV_LABELS.often}</h1>
          {!lists.loading && <p className="hint">{target ? LABELS.oftenHint(target.name) : LABELS.oftenEmpty}</p>}
        </div>
        {target && history.docs.length > 0 && (
          <HistoryRows counted entries={oftenBought(history.docs)} onList={onListNames(items.docs)} onAdd={(name) => addItem(target.id, name, items.docs)} />
        )}
      </main>
    </>
  )
}
