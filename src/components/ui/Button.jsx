import React from 'react'
import classNames from 'classnames'

const Button = ({
  type = 'button',
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200'

  const variantStyles = {
    primary: 'bg-platerly-green text-white hover:bg-green-700 focus:ring-platerly-green',
    secondary: 'bg-platerly-card text-platerly-subtle hover:bg-platerly-green/20 focus:ring-platerly-green',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }

  const sizeStyles = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-5 py-2 text-base',
    lg: 'px-6 py-2.5 text-lg',
  }

  return (
    <button
      type={type}
      className={classNames(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
