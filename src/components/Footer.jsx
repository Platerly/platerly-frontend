/**
 * Footer.jsx — Site-wide footer for Recipzee.
 *
 * Layer: Presentational / layout.
 *
 * Renders an allergen disclaimer, copyright notice, and navigation links
 * (Terms, Privacy, Guidelines, Allergy, Refunds, Contact, Roadmap, API).
 *
 * Props:
 *   @prop {'full'|'contained'} [variant='full'] — 'contained' constrains the
 *     inner width to max-w-3xl (used inside AppLayout's centred content column);
 *     'full' uses the wider max-w-6xl layout.
 *   @prop {string} [className=''] — Additional Tailwind classes applied to the
 *     outer <footer> element.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { useCookieConsent } from '../context/CookieConsentContext'

const Footer = ({ variant = 'full', className = '' }) => {
  const { openManage } = useCookieConsent()
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
        {/* Allergen disclaimer */}
        <p className="text-xs text-neutral-500 leading-relaxed mb-6 border-t border-white/5 pt-6">
          Recipzee provides allergen information for reference purposes only. This is not medical advice and does not
          replace consultation with a qualified healthcare professional or dietitian. Always verify ingredient safety
          independently, especially if you have a severe allergy.
        </p>

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
            <Link to="/research" className="hover:text-white transition-colors">
              Research
            </Link>
            <Link to="/roadmap" className="hover:text-white transition-colors">
              Roadmap
            </Link>
            <Link to="/api" className="hover:text-white transition-colors">
              API
            </Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">
              Cookies
            </Link>
            <button
              onClick={openManage}
              className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-sm text-recipzee-subtle font-inherit"
            >
              Manage Cookies
            </button>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer
