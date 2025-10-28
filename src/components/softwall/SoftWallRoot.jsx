import { useLocation } from 'react-router-dom'
import SoftWallBanner from './SoftWallBanner'
import { useSoftWall } from '../../hooks/useSoftWall'

const IGNORE = new Set([
  '/login','/register','/forgot-password','/reset-password','/verify-email',
  '/terms','/privacy','/guidelines','/disclaimer','/refunds','/contact','/landings'
])

export default function SoftWallRoot() {
  const { pathname, search } = useLocation()
  if (IGNORE.has(pathname)) return null

  // ✅ Only count views on recipe detail pages; still allow banner to show anywhere
  const countThisPage = pathname.startsWith('/recipe/')
  const token = countThisPage ? `${pathname}${search || ''}` : null

  const { isGuest, showSoftWall, dismissSoftWall, viewsInWindow, dailyLimit } = useSoftWall(token)

  // Safe debug
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.debug('[SoftWall]', {
      isGuest,
      showSoftWall,
      viewsInWindow,
      dailyLimit,
      path: pathname,
      counted: !!countThisPage
    })
  }

  if (!isGuest || !showSoftWall) return null
  return <SoftWallBanner onClose={dismissSoftWall} viewsUsed={viewsInWindow} limit={dailyLimit} />
}
