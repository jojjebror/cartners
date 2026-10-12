import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { HOUSEHOLD_PARAM, LABELS, SMALL_ICON_SIZE, paths } from '../../shared/constants'
import { AppHeader } from '../components/AppHeader'
import { HapticButton } from '../components/HapticButton'
import { joinHousehold, useHouseholdById, useLists, useUid } from '../data/store'
import { useHousehold } from '../household'
import { standalone } from '../motion'

export function JoinPage() {
  const target = useParams()[HOUSEHOLD_PARAM]!
  const uid = useUid()
  const navigate = useNavigate()
  const { household } = useHousehold()
  const own = useLists(household?.id)
  const invited = useHouseholdById(target)
  const [copied, setCopied] = useState(false)

  if (invited.value?.members.includes(uid)) return <Navigate to={paths.home} replace />
  const names = invited.value ? Object.values(invited.value.names).filter(Boolean).join(' och ') : ''

  return (
    <>
      <AppHeader />
      <main className="body stack">
        <h1 className="page-title">{LABELS.joinTitle}</h1>
        {!invited.loading &&
          (invited.value ? (
            <div className="stack-tight reveal">
              <p>{LABELS.joinHint(names)}</p>
              <p className="hint">{LABELS.joinMoves}</p>
              {!standalone() && (
                <>
                  <p className="hint">{LABELS.joinInApp}</p>
                  <HapticButton className="outline-button" onClick={() => navigator.clipboard.writeText(location.href).then(() => setCopied(true), () => undefined)}>
                    <Copy size={SMALL_ICON_SIZE} strokeWidth={2.5} aria-hidden="true" />
                    {copied ? LABELS.copied : LABELS.copyLink}
                  </HapticButton>
                </>
              )}
              <HapticButton
                className="solid-button"
                disabled={!household || own.loading}
                onClick={() => {
                  joinHousehold(uid, target, household, own.docs)
                  navigate(paths.home, { replace: true })
                }}
              >
                {LABELS.join}
              </HapticButton>
            </div>
          ) : (
            <p className="hint reveal">{LABELS.joinGone}</p>
          ))}
      </main>
    </>
  )
}
