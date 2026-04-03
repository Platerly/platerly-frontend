/**
 * AppLayout.jsx — Primary three-column authenticated app shell for Recipzee.
 *
 * Layer: Layout.
 *
 * Structure (desktop):
 *   ┌──────────────────────────────────────────────────────┐
 *   │  Sidebar (fixed 260 px left)  │  Main  │ RightColumn │
 *   │                               │  area  │ (fixed 320) │
 *   └──────────────────────────────────────────────────────┘
 *
 * On mobile:
 *   - A sticky top bar replaces the sidebar; a hamburger button opens a
 *     slide-in drawer containing `SidebarPanel`.
 *   - The right column is hidden entirely.
 *   - Body scroll is locked while the drawer is open.
 *
 * Banner render order (top of main content column):
 *   1. `EmailVerificationBanner` — shown first because it blocks key features.
 *   2. `TrialExpiryBanner`       — shown second; handles both Day 7 gold banner
 *      and the Day 8 post-trial modal.
 *
 * Guest view counting:
 *   `bumpGuestSeenCount` is called on every render where auth state is known to
 *   be unauthenticated, feeding the SoftWallRoot rolling-window counter.
 *
 * Props:
 *   @prop {ReactNode} children — Page content rendered in the centred content area.
 */
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar, { SidebarPanel } from './Sidebar'
import RightColumn from './RightColumn'
import EmailVerificationBanner from '../layout/EmailVerificationBanner'
import TrialExpiryBanner from '../ui/TrialExpiryBanner'
import Footer from '../Footer'
import { useAuth } from '../../context/AuthContext'
import { bumpGuestSeenCount } from '../../utils/softwall'

/**
 * @param {{ children: ReactNode }} props
 * @returns {JSX.Element}
 */
const AppLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { authed, loading } = useAuth()
  const location = useLocation()

  // Close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Increment guest counter only when we know the user is NOT authed
  useEffect(() => {
    bumpGuestSeenCount({ authed, loading })
  }, [authed, loading])

  // Lock document scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      const { body, documentElement } = document
      const prevBody = body.style.overflow
      const prevHtml = documentElement.style.overflow
      body.style.overflow = 'hidden'
      documentElement.style.overflow = 'hidden'
      return () => {
        body.style.overflow = prevBody
        documentElement.style.overflow = prevHtml
      }
    }
  }, [drawerOpen])

  return (
    <div className="bg-recipzee-dark text-recipzee-text min-h-screen w-full">
      {/* ───────── Mobile top bar ───────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-recipzee-card/95 backdrop-blur-md border-b border-recipzee-border">
        <div className="h-[56px] flex items-center justify-between px-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-recipzee-light transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-base font-bold tracking-tight text-recipzee-green">Recipzee</div>
          <div className="w-10" />
        </div>
      </header>

      {/* ───────── Desktop sidebar (fixed) ───────── */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-[260px] border-r border-recipzee-border bg-recipzee-card/50 backdrop-blur-sm z-30">
        <Sidebar />
      </aside>

      {/* ───────── Mobile sidebar drawer ───────── */}
      {drawerOpen && (
        <>
          {/* Backdrop overlay */}
          <button
            aria-hidden
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-recipzee-card border-r border-recipzee-border shadow-2xl flex isolate"
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-recipzee-light text-recipzee-subtle hover:text-recipzee-text transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full overflow-y-auto pt-12 pb-6 bg-recipzee-card">
              <SidebarPanel />
            </div>
          </div>
        </>
      )}

      {/* ───────── Desktop right column ───────── */}
      <aside className="hidden xl:block fixed right-0 top-0 bottom-0 w-[320px] border-l border-recipzee-border bg-recipzee-card/50 backdrop-blur-sm z-20">
        <RightColumn />
      </aside>

      {/* ───────── Main content ───────── */}
      <main
        className={[
          'px-4 sm:px-6 py-6',
          'lg:ml-[260px]',
          'xl:mr-[320px]',
          'pb-[calc(env(safe-area-inset-bottom)+72px)] lg:pb-6',
        ].join(' ')}
      >
        <div className="w-full max-w-3xl mx-auto">
          {/* Email verification banner renders first — it's the most urgent nudge */}
          <EmailVerificationBanner />
          {/* Trial expiry banner/modal renders second, below email verification */}
          <TrialExpiryBanner />
          {children}
          <div className="h-8" />
          <Footer variant="contained" />
        </div>
      </main>
    </div>
  )
}

export default AppLayout
