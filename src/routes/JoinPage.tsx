import { useIsPresent } from 'motion/react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { HOUSEHOLD_PARAM, LABELS, paths } from '../../shared/constants'
import { AppHeader } from '../components/AppHeader'
import { HapticButton } from '../components/HapticButton'
import { joinHousehold, useHouseholdById, useLists, useUid } from '../data/store'
import { useHousehold } from '../household'

export function JoinPage() {
  const target = useParams()[HOUSEHOLD_PARAM]!
  const uid = useUid()
  const navigate = useNavigate()
  const { household } = useHousehold()
  const own = useLists(household?.id)
  const invited = useHouseholdById(target)
  const present = useIsPresent()

  if (present && invited.value?.members.includes(uid)) return <Navigate to={paths.home} replace />
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
