/**
 * ProhibitedIngredientsError.jsx — Inline error display for prohibited ingredient violations.
 *
 * Layer: Presentational / form feedback.
 *
 * Shown on the recipe create/edit form when the API returns a 422 response
 * indicating one or more ingredients match the admin-managed prohibited
 * ingredients list (managed via AdminLayout → /admin/prohibited-ingredients).
 *
 * Each violation object is passed through `formatViolation` (from parseApiError)
 * to extract a human-readable ingredient name and reason before rendering.
 * The component renders nothing when `violations` is empty or undefined.
 *
 * Props:
 *   @prop {string}    [message]    — Optional override for the heading text.
 *   @prop {object[]}  violations   — Array of violation objects from the API response.
 */
import { AlertTriangle, XCircle } from 'lucide-react'
import { formatViolation } from '../../utils/parseApiError'

/**
 * Displays a user-friendly error message for prohibited ingredients
 */
export default function ProhibitedIngredientsError({ message, violations }) {
  if (!violations || violations.length === 0) {
    return null
  }

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-400 font-medium">
            {message || 'This recipe contains ingredients that are not allowed'}
          </p>
          <p className="text-red-400/70 text-sm mt-1">
            Please remove or replace the following ingredients:
          </p>
        </div>
      </div>

      <ul className="space-y-2 ml-8">
        {violations.map((v, i) => {
          const formatted = formatViolation(v)
          return (
            <li key={i} className="flex items-start gap-2 text-sm">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-red-300 font-medium capitalize">{formatted.ingredient}</span>
                <span className="text-red-400/60 mx-1.5">-</span>
                <span className="text-red-400/80">{formatted.reason}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
