import React from 'react'
import Sidebar from './Sidebar'
import RightColumn from './RightColumn'
import EmailVerificationBanner from '../layout/EmailVerificationBanner'
import Footer from '../Footer'


const AppLayout = ({ children }) => {
  return (
    <div className="bg-platerly-dark text-platerly-text min-h-screen w-full flex">
      {/* Sidebar - fixed left */}
      <Sidebar />

      {/* Feed area - center-aligned with fixed side margins for Sidebar + RightColumn */}
      <main className="flex-1 ml-[260px] mr-[320px] px-6 py-6 flex justify-center">
        <div className="w-full max-w-3xl">
          {/* Email Verification Banner */}
          <EmailVerificationBanner />
          {children}
          <div className="h-8" />
          <Footer variant="contained" />
        </div>
      </main>

      {/* Right column - fixed right */}
      <RightColumn />
    </div>
  )
}

export default AppLayout
