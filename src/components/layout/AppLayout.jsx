import React, { useState } from 'react'
import { Menu, X, Home, Compass, PlusCircle, User } from 'lucide-react'
import Sidebar from './Sidebar'
import RightColumn from './RightColumn'
import EmailVerificationBanner from '../layout/EmailVerificationBanner'
import Footer from '../Footer'

const AppLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="bg-platerly-dark text-platerly-text min-h-screen w-full">
      {/* ───────── Mobile top bar ───────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-platerly-elev/80 backdrop-blur border-b border-platerly-border">
        <div className="h-[56px] flex items-center justify-between px-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-emerald-900/30"
            aria-label="Open navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-sm font-semibold tracking-wide">Platerly</div>
          <div className="w-9" />{/* spacer to balance the Menu button */}
        </div>
      </header>

      {/* ───────── Desktop sidebar (fixed) ───────── */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-[260px] border-r border-platerly-border bg-platerly-elev z-30">
        <Sidebar />
      </aside>

      {/* ───────── Mobile sidebar drawer ───────── */}
      {drawerOpen && (
        <>
          <button
            aria-hidden
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-platerly-elev border-r border-platerly-border shadow-2xl flex"
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute top-0 right-0 p-3">
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-emerald-900/30"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full overflow-y-auto pt-12 pb-6">
              <Sidebar />
            </div>
          </div>
        </>
      )}

      {/* ───────── Desktop right column (fixed on xl+) ───────── */}
      <aside className="hidden xl:block fixed right-0 top-0 bottom-0 w-[320px] border-l border-platerly-border bg-platerly-elev z-20">
        <RightColumn />
      </aside>

      {/* ───────── Main content ───────── */}
      <main
        className={[
          // base spacing
          'px-4 sm:px-6 py-6',
          // leave room for desktop sidebars
          'lg:ml-[260px]',
          'xl:mr-[320px]',
          // push above bottom bar on mobile
          'pb-[calc(env(safe-area-inset-bottom)+84px)] lg:pb-6',
        ].join(' ')}
      >
        <div className="w-full max-w-3xl mx-auto">
          <EmailVerificationBanner />
          {children}
          <div className="h-8" />
          <Footer variant="contained" />
        </div>
      </main>

      {/* ───────── Mobile bottom nav (optional but recommended) ───────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-platerly-border bg-platerly-elev/90 backdrop-blur">
        <div className="grid grid-cols-4 h-[60px] items-center px-2 pb-[calc(env(safe-area-inset-bottom))]">
          <a href="/" className="flex flex-col items-center justify-center gap-1 text-xs hover:text-emerald-300">
            <Home className="w-5 h-5" />
            Home
          </a>
          <a href="/explore" className="flex flex-col items-center justify-center gap-1 text-xs hover:text-emerald-300">
            <Compass className="w-5 h-5" />
            Explore
          </a>
          <a href="/create" className="flex flex-col items-center justify-center gap-1 text-xs hover:text-emerald-300">
            <PlusCircle className="w-5 h-5" />
            Create
          </a>
          <a href="/me" className="flex flex-col items-center justify-center gap-1 text-xs hover:text-emerald-300">
            <User className="w-5 h-5" />
            Profile
          </a>
        </div>
      </nav>
    </div>
  )
}

export default AppLayout
