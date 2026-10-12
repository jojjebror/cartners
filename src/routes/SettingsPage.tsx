import { useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, Share2, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { APP_NAME, ICON_SIZE, LABELS, SMALL_ICON_SIZE, THEMES, THEME_LABELS, paths } from '../../shared/constants'
import { version } from '../../package.json'
import { AppHeader } from '../components/AppHeader'
import { HapticButton } from '../components/HapticButton'
import { findCode, formatCode } from '../data/items'
import { createInvite, findInvite, setName, useUid } from '../data/store'
import { useHousehold } from '../household'
import { shareText } from '../share'
import { useTheme } from '../theme'

// Invites are short codes rather than links: on an iPhone a link opens in Safari, which is someone else than
// the app on the home screen, while a code is typed into the app itself.
function Invite({ householdId }: { householdId: string }) {
  const uid = useUid()
  const [code, setCode] = useState<string>()
  const [state, setState] = useState<'idle' | 'creating' | 'failed'>('idle')
  const [copied, setCopied] = useState(false)
  const create = () => {
    setState('creating')
    createInvite(householdId, uid).then(
      (made) => {
        setCode(made)
        setState('idle')
      },
      () => setState('failed'),
    )
  }
  const share = (made: string) => shareText(LABELS.inviteText(formatCode(made)), LABELS.inviteTitle).then(setCopied, () => undefined)

  return (
    <>
      {code ? (
        <div className="invite reveal">
          <span className="invite-code">{formatCode(code)}</span>
          <p className="hint">{LABELS.inviteCode}</p>
          <HapticButton className="outline-button" onClick={() => share(code)}>
            <Share2 size={SMALL_ICON_SIZE} strokeWidth={2.5} aria-hidden="true" />
            {copied ? LABELS.copied : LABELS.shareCode}
          </HapticButton>
        </div>
      ) : (
        <HapticButton className="outline-button" disabled={state === 'creating'} onClick={create}>
          <UserPlus size={SMALL_ICON_SIZE} strokeWidth={2.5} aria-hidden="true" />
          {state === 'creating' ? LABELS.creatingCode : LABELS.invite}
        </HapticButton>
      )}
      {state === 'failed' && (
        <p className="hint reveal" role="alert">
          {LABELS.codeFailed}
        </p>
      )}
    </>
  )
}

function JoinByCode({ householdId }: { householdId: string }) {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [problem, setProblem] = useState<string>()
  const checking = useRef<string>(undefined)
  const check = (value: string) => {
    const code = findCode(value)
    checking.current = code
    if (!code) return setProblem(value.trim() ? LABELS.codeWrong : undefined)
    findInvite(code).then(({ householdId: target, reachable }) => {
      if (checking.current !== code) return
      if (!reachable) setProblem(LABELS.codeUnreachable)
      else if (!target) setProblem(LABELS.codeWrong)
      else if (target === householdId) setProblem(LABELS.codeOwn)
      else navigate(paths.join(target))
    })
  }

  return (
    <>
      <p className="hint">{LABELS.codeHint}</p>
      <form
        className="add"
        onSubmit={(e) => {
          e.preventDefault()
          check(text)
        }}
      >
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setProblem(undefined)
            if (findCode(e.target.value)) check(e.target.value)
            else checking.current = undefined
          }}
          placeholder={LABELS.codePlaceholder}
          aria-label={LABELS.codePlaceholder}
          enterKeyHint="go"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <HapticButton type="button" className="add-button" aria-label={LABELS.openCode} onClick={() => check(text)}>
          <ArrowRight size={ICON_SIZE} strokeWidth={3} aria-hidden="true" />
        </HapticButton>
      </form>
      {problem && (
        <p className="hint reveal" role="alert">
          {problem}
        </p>
      )}
    </>
  )
}

function Household() {
  const uid = useUid()
  const { household } = useHousehold()
  const [name, setDraft] = useState<string>()
  if (!household) return null
  const saved = household.names[uid] ?? ''
  const save = () => {
    if (name !== undefined && name.trim() !== saved) setName(household.id, uid, name.trim())
  }

  return (
    <section className="stack-tight reveal">
      <h2 className="section-title">{LABELS.household}</h2>
      <form
        className="add"
        onSubmit={(e) => {
          e.preventDefault()
          save()
          ;(document.activeElement as HTMLElement | null)?.blur()
        }}
      >
        <input value={name ?? saved} onChange={(e) => setDraft(e.target.value)} onBlur={save} placeholder={LABELS.namePlaceholder} aria-label={LABELS.yourName} enterKeyHint="done" autoComplete="given-name" />
      </form>
      <div className="rows">
        {household.members.map((member) => (
          <div key={member} className="row">
            <span className="row-name">{household.names[member] || LABELS.unnamed}</span>
            {member === uid && <span className="badge">{LABELS.you}</span>}
          </div>
        ))}
      </div>
      <p className="hint">{LABELS.inviteHint}</p>
      <Invite key={household.id} householdId={household.id} />
      <JoinByCode householdId={household.id} />
    </section>
  )
}

export function SettingsPage() {
  const { theme, choose } = useTheme()
  return (
    <>
      <AppHeader />
      <main className="body stack">
        <Household />
        <section className="stack-tight">
          <h2 className="section-title">{LABELS.appearance}</h2>
          <div className="segmented" style={{ '--segments': THEMES.length, '--segment': THEMES.indexOf(theme) } as CSSProperties}>
            {THEMES.map((t) => (
              <HapticButton key={t} aria-pressed={t === theme} onClick={() => choose(t)}>
                {THEME_LABELS[t]}
              </HapticButton>
            ))}
          </div>
        </section>
        <section className="stack-tight">
          <h2 className="section-title">{LABELS.about}</h2>
          <p className="hint">
            {APP_NAME} {version}
          </p>
        </section>
      </main>
    </>
  )
}
