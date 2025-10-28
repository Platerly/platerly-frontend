import { Link } from 'react-router-dom'

export default function SoftWallBanner({ onClose, viewsUsed, limit }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 md:pb-4"
      role="region"
      aria-label="Free views limit reached"
    >
      <div
        className="
          mx-auto max-w-2xl
          rounded-t-2xl
          border border-platerly-border
          bg-platerly-card/95
          backdrop-blur-xl
          shadow-[0_-8px_30px_rgba(0,0,0,0.45)]
          px-5 py-4
          safe-area-inset-b
        "
      >
        <div className="flex flex-col gap-3 text-platerly-text">
          
          {/* Title + counter */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <strong className="text-base font-semibold">
              You’re out of free views.
            </strong>

            <span
              className="
                inline-flex items-center gap-1
                px-2 py-0.5 rounded-full
                bg-platerly-light/10
                text-[11px]
                font-medium
                ring-1 ring-platerly-border
                text-platerly-subtle
              "
            >
              {viewsUsed}/{limit}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-platerly-subtle">
            Create a Platerly account to unlock full access.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Link
              to="/register"
              className="
                px-4 py-1.5 rounded-full
                bg-platerly-green text-white
                text-sm font-medium
                shadow hover:bg-platerly-green/90
                transition focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-platerly-green/60
              "
            >
              Sign up
            </Link>

            <Link
              to="/login"
              className="
                px-4 py-1.5 rounded-full
                border border-platerly-border
                bg-platerly-light/5
                text-sm text-platerly-text
                hover:bg-platerly-green/20
                transition focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-platerly-green/60
              "
            >
              Log in
            </Link>

            <button
              onClick={onClose}
              className="
                ml-auto
                px-3 py-1
                text-xs
                text-platerly-subtle
                hover:text-platerly-text
                transition
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-platerly-green/60
              "
            >
              Not now
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
