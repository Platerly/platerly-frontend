// src/components/Footer.jsx
import React from 'react'
import { Link } from 'react-router-dom'

const Footer = ({ variant = 'full', className = '' }) => {
  const container =
    variant === 'contained'
      ? 'mx-auto w-full max-w-3xl px-4'
      : 'mx-auto max-w-6xl px-4'

  return (
    <footer className={`border-t border-white/10 bg-platerly-dark ${className}`}>
      <div className={`${container} py-8 text-sm text-platerly-subtle`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Platerly. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/terms" className="hover:text-platerly-text">Terms</Link>
            <Link to="/privacy" className="hover:text-platerly-text">Privacy</Link>
            <Link to="/guidelines" className="hover:text-platerly-text">Guidelines</Link>
            <Link to="/disclaimer" className="hover:text-platerly-text">Allergy</Link>
            <Link to="/refunds" className="hover:text-platerly-text">Refunds</Link>
            <Link to="/contact" className="hover:text-platerly-text">Contact</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer
