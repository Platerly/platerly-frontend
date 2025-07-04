import React from 'react'
import classNames from 'classnames'

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={classNames(
          'w-full px-4 py-2 rounded-md border shadow-sm text-sm transition-colors duration-200',
          'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white',
          'border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

export default Input
