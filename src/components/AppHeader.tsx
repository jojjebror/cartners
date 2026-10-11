import type { Ref } from 'react'
import { ArrowLeft, Ellipsis, Moon, Share2, Sun } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'
import { APP_NAME, ICON_SIZE, LABELS, LOGO_SIZES, THEME_TOGGLE_LABELS, paths } from '../../shared/constants'
import { useTheme } from '../theme'
import { HapticButton } from './HapticButton'
import { LogoMark } from './LogoMark'

export function useBack() {
  const navigate = useNavigate()
  const { key } = useLocation()
  return () => (key === 'default' ? navigate(paths.home, { replace: true }) : navigate(-1))
}

export function AppHeader({ ref, back, title, titleShown, onShare, onMore }: { ref?: Ref<HTMLElement>; back?: boolean; title?: string; titleShown?: boolean; onShare?: () => void; onMore?: () => void }) {
  const { theme, choose } = useTheme()
  const ThemeIcon = theme === 'dark' ? Sun : Moon
  const goBack = useBack()
  return (
    <header ref={ref} className={title && !titleShown ? 'top flat' : 'top'}>
      <div className="bar">
        {title && (
          <span className={titleShown ? 'bar-title shown' : 'bar-title'} aria-hidden="true">
            {title}
          </span>
        )}
        {back ? (
          <Link
            to={paths.home}
            className="back"
            onClick={(e) => {
              e.preventDefault()
              goBack()
            }}
          >
            <ArrowLeft size={ICON_SIZE} aria-hidden="true" />
            {LABELS.back}
          </Link>
        ) : (
          <Link to={paths.home} className="wordmark">
            <LogoMark width={LOGO_SIZES.wordmark} height={LOGO_SIZES.wordmark} />
            {APP_NAME}
          </Link>
        )}
        <div className="bar-actions">
          {onShare && (
            <HapticButton className="icon-button" onClick={onShare} aria-label={LABELS.share}>
              <Share2 size={ICON_SIZE} aria-hidden="true" />
            </HapticButton>
          )}
          <HapticButton className="icon-button" onClick={() => choose(theme === 'dark' ? 'light' : 'dark')} aria-label={THEME_TOGGLE_LABELS[theme]}>
            <ThemeIcon size={ICON_SIZE} aria-hidden="true" />
          </HapticButton>
          {onMore && (
            <HapticButton className="icon-button" onClick={onMore} aria-label={LABELS.listOptions} aria-haspopup="dialog">
              <Ellipsis size={ICON_SIZE} aria-hidden="true" />
            </HapticButton>
          )}
        </div>
      </div>
    </header>
  )
}
