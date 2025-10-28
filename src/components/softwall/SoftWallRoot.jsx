// src/components/softwall/SoftWallRoot.jsx
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import SoftWallBanner from './SoftWallBanner'
import { useSoftWall } from '../../hooks/useSoftWall'

/** Static paths where we never render the soft wall */
const IGNORE_PATHS = new Set([
  '/login','/register','/forgot-password','/reset-password','/verify-email',
  '/terms','/privacy','/guidelines','/disclaimer','/refunds','/contact','/',
  '/billing','/checkout','/account'
])

/** Path prefixes we also want to ignore (server rewrites, share pages, etc.) */
const IGNORE_PREFIXES = ['/api/', '/s/']  // server passthroughs / public share

const isIgnoredPath = (pathname) => {
  if (IGNORE_PATHS.has(pathname)) return true
  for (const p of IGNORE_PREFIXES) if (pathname.startsWith(p)) return true
  return false
}

/** Basic bot guard so crawlers don’t burn guest views */
const isBotUA = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|twitterbot|pinterest|embedly|quora link preview/.test(ua)
}

export default function SoftWallRoot() {
  const { pathname, search } = useLocation()

  // 1) Never show on ignored routes
  if (isIgnoredPath(pathname)) return null

  // 2) Allow manual disable for testing: ?softwall=off
  const sp = useMemo(() => new URLSearchParams(search), [search])
  if (sp.get('softwall') === 'off') return null

  // 3) We only COUNT views on recipe detail routes
  const countThisPage = useMemo(() => pathname.startsWith('/recipe/'), [pathname])

  // token is the dedupe key for your hook; include query for uniqueness
  const token = useMemo(
    () => (countThisPage ? `${pathname}${search || ''}` : null),
    [countThisPage, pathname, search]
  )

  // 4) Hook: computes guest state & whether to show the wall (counting only on recipe pages)
  const {
    isGuest,
    showSoftWall,
    dismissSoftWall,
    viewsInWindow,
    dailyLimit,
  } = useSoftWall(token)

  // 5) Dev-only debug
  if (typeof window !== 'undefined' && import.meta?.env?.MODE !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[SoftWall]', {
      path: pathname,
      query: search,
      isGuest,
      showSoftWall,
      viewsInWindow,
      dailyLimit,
      counted: !!countThisPage,
      bot: isBotUA(),
    })
  }

  // 6) Don’t render for bots (avoids wasting view budget on crawlers)
  if (isBotUA()) return null

  // 7) Only show to guests AND when the rule says it’s time
  if (!isGuest || !showSoftWall) return null

  return (
    <SoftWallBanner
      onClose={dismissSoftWall}
      viewsUsed={viewsInWindow}
      limit={dailyLimit}
    />
  )
}
