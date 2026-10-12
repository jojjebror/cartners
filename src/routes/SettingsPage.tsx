import { useState, type CSSProperties } from 'react'
import { ArrowRight, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { APP_NAME, ICON_SIZE, LABELS, SMALL_ICON_SIZE, THEMES, THEME_LABELS, paths } from '../../shared/constants'
import { version } from '../../package.json'
import { AppHeader } from '../components/AppHeader'
import { HapticButton } from '../components/HapticButton'
import { inviteId } from '../data/items'
import { setName, useUid } from '../data/store'
import { useHousehold } from '../household'
import { shareLink } from '../share'
import { useTheme } from '../theme'

// On an iPhone an invite link opens in Safari, which signs in as someone else than the app on the home
// screen, so the link can also be pasted here to join from the app itself.
function JoinByLink() {
  const navigate = useNavigate()
  const [link, setLink] = useState('')
  const [wrong, setWrong] = useState(false)
  const open = () => {
    const id = inviteId(link)
    if (id) navigate(paths.join(id))
    else setWrong(link.trim() !== '')
  }

  return (
    <>
      <p className="hint">{LABELS.pasteHint}</p>
      <form
        className="add"
        onSubmit={(e) => {
          e.preventDefault()
          open()
        }}
      >
        <input
          value={link}
          onChange={(e) => {
            setLink(e.target.value)
            setWrong(false)
          }}
          placeholder={LABELS.pasteInvite}
          aria-label={LABELS.pasteInvite}
          enterKeyHint="go"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <HapticButton type="button" className="add-button" aria-label={LABELS.openInvite} onClick={open}>
          <ArrowRight size={ICON_SIZE} strokeWidth={3} aria-hidden="true" />
        </HapticButton>
      </form>
      {wrong && <p className="hint reveal" role="alert">{LABELS.notInvite}</p>}
    </>
  )
}

function Household() {
  const uid = useUid()
  const { household } = useHousehold()
  const [name, setDraft] = useState<string>()
  const [copied, setCopied] = useState(false)
  if (!household) return null
  const saved = household.names[uid] ?? ''
  const save = () => {
    if (name !== undefined && name.trim() !== saved) setName(household.id, uid, name.trim())
  }
  const invite = () =>
    shareLink(`${location.origin}${paths.join(household.id)}`, LABELS.inviteTitle, LABELS.inviteText)
      .then(setCopied)
      .catch(() => undefined)

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
      <HapticButton className="outline-button" onClick={invite}>
        <UserPlus size={SMALL_ICON_SIZE} strokeWidth={2.5} aria-hidden="true" />
        {copied ? LABELS.copied : LABELS.invite}
      </HapticButton>
      <JoinByLink />
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
