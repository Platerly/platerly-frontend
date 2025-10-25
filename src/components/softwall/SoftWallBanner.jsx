import { Link } from 'react-router-dom'

export default function SoftWallBanner({ onClose, viewsUsed, limit }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50" role="region" aria-label="Free views limit">
      <div className="mx-auto max-w-4xl rounded-t-2xl border border-platerly-border bg-platerly-card/95 backdrop-blur px-5 py-4 shadow-2xl">
        <div className="flex flex-col gap-2 text-sm text-platerly-text">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-white">You’re out of free views.</strong>
            <span className="inline-flex items-center rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-medium text-platerly-subtle ring-1 ring-platerly-border">
              {viewsUsed}/{limit}
            </span>
          </div>

          <p className="text-platerly-subtle">
            Create a Platerly account to unlock full access.
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to="/register"
              className="px-4 py-1.5 rounded-full bg-platerly-green text-white text-sm font-medium shadow hover:bg-platerly-green/90 transition"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full border border-platerly-border bg-transparent text-sm text-platerly-text hover:bg-platerly-green/20 transition"
            >
              Log in
            </Link>
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs text-platerly-subtle hover:text-platerly-text transition"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
