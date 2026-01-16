import React from 'react'
import classNames from 'classnames'

/**
 * Premium button component with consistent Platerly styling.
 * Supports multiple variants, sizes, and loading states.
 */
const Button = ({
  type = 'button',
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = classNames(
    'inline-flex items-center justify-center font-semibold',
    'rounded-xl', // Consistent with card styling
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-platerly-dark',
    'transition-all duration-200 ease-out',
    'min-h-[44px] select-none',
    'active:scale-[0.98]' // Subtle press feedback
  )

  const variantStyles = {
    primary: classNames(
      'bg-platerly-green text-platerly-dark',
      'hover:bg-platerly-green/90 hover:shadow-lg hover:shadow-platerly-green/20',
      'focus:ring-platerly-green/50',
      'disabled:bg-platerly-green/50 disabled:shadow-none'
    ),
    secondary: classNames(
      'bg-platerly-card text-platerly-text border border-platerly-border',
      'hover:bg-platerly-light hover:border-platerly-green/30',
      'focus:ring-platerly-green/30',
      'disabled:bg-platerly-card/50 disabled:border-platerly-border/50'
    ),
    danger: classNames(
      'bg-red-600 text-white',
      'hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20',
      'focus:ring-red-500',
      'disabled:bg-red-600/50 disabled:shadow-none'
    ),
    ghost: classNames(
      'bg-transparent text-platerly-text',
      'hover:bg-white/5',
      'focus:ring-platerly-green/30',
      'disabled:text-platerly-subtle'
    ),
    outline: classNames(
      'bg-transparent text-platerly-green border border-platerly-green',
      'hover:bg-platerly-green/10',
      'focus:ring-platerly-green/30',
      'disabled:border-platerly-green/30 disabled:text-platerly-green/50'
    ),
  }

  const sizeStyles = {
    sm: 'px-4 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  }

  const spinnerSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classNames(
        baseStyles,
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className={classNames('animate-spin', spinnerSizes[size])}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button
