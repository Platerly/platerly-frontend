import React from 'react'
import * as Sentry from '@sentry/react'

/**
 * Error Boundary component to catch and handle React component errors.
 * Prevents the entire app from crashing when a component throws.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Report to Sentry if available
    if (typeof Sentry !== 'undefined' && Sentry.captureException) {
      Sentry.captureException(error, { extra: errorInfo })
    }

    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-platerly-dark flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-platerly-card border border-platerly-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-platerly-text mb-2">
              Something went wrong
            </h2>

            <p className="text-platerly-muted text-sm mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-platerly-accent text-white rounded-lg hover:bg-platerly-accent/90 transition-colors"
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-platerly-border text-platerly-text rounded-lg hover:bg-platerly-border/70 transition-colors"
              >
                Go Home
              </button>
            </div>

            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-platerly-muted cursor-pointer hover:text-platerly-text">
                  Error Details (dev only)
                </summary>
                <pre className="mt-2 p-3 bg-platerly-dark rounded text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
