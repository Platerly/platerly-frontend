import React from 'react'
import { Link } from 'react-router-dom'

const Footer = ({ variant = 'full', className = '' }) => {
  const container =
    variant === 'contained'
      ? 'mx-auto w-full max-w-3xl px-4'
      : 'mx-auto max-w-6xl px-4'

  return (
    <footer
      className={`border-t border-white/10 bg-recipzee-dark text-sm text-recipzee-subtle ${className}`}
      role="contentinfo"
    >
      <div className={`${container} py-8`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* copyright */}
          <p className="text-center sm:text-left text-neutral-400">
            © {new Date().getFullYear()} <span className="text-white font-medium">Recipzee</span>. All rights reserved.
          </p>

          {/* navigation links */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2"
          >
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/guidelines" className="hover:text-white transition-colors">
              Guidelines
            </Link>
            <Link to="/disclaimer" className="hover:text-white transition-colors">
              Allergy
            </Link>
            <Link to="/refunds" className="hover:text-white transition-colors">
              Refunds
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer
