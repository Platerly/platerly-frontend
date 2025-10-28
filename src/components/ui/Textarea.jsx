import React, { useEffect, useRef } from 'react'
import classNames from 'classnames'

/**
 * Mobile-friendly Textarea component for Platerly
 * - Prevents iOS zoom-on-focus (16px base font)
 * - Auto-grows to fit content
 * - Accessible labels and error states
 * - Works in light and dark mode
 */

const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  className = '',
  rows = 4,
  autoGrow = true,
  ...props
}) => {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (autoGrow && textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [value, autoGrow])

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={textareaRef}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={classNames(
          'w-full text-[16px] sm:text-sm', // prevents iOS zoom
          'px-4 py-3 rounded-lg border shadow-sm resize-none transition-all duration-200',
          'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white',
          'border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500',
          'placeholder-gray-400 dark:placeholder-neutral-500',
          'leading-relaxed',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}

export default Textarea
