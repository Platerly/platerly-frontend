import React, { forwardRef, useId, useState } from "react";
import classNames from "classnames";

const Input = forwardRef(function Input(
  {
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder = "",
    error = "",
    hint = "",
    required = false,
    disabled = false,
    className = "",
    autoComplete,
    inputMode,
    leftIcon = null,
    rightIcon = null,
    clearable = false,
    onClear, // optional custom clear handler
    passwordToggle = true, // shows eye toggle when type="password"
    size = "md", // 'sm' | 'md' | 'lg'
    ...props
  },
  ref
) {
  const reactId = useId();
  const id = props.id || reactId;
  const [reveal, setReveal] = useState(false);

  // If password, allow toggling reveal
  const resolvedType =
    type === "password" && passwordToggle ? (reveal ? "text" : "password") : type;

  const sizeStyles = {
    sm: "text-sm h-10",
    md: "text-base h-11",
    lg: "text-lg h-12",
  };

  const paddingLeft = leftIcon ? "pl-10" : "pl-4";
  const paddingRight = rightIcon || clearable || (type === "password" && passwordToggle)
    ? "pr-10"
    : "pr-4";

  const describedByIds = [];
  if (error) describedByIds.push(`${id}-error`);
  if (hint) describedByIds.push(`${id}-hint`);

  // Mobile keyboard helpers (best-effort)
  const inputModeMap = {
    email: "email",
    url: "url",
    number: "numeric",
    tel: "tel",
    search: "search",
  };
  const effectiveInputMode = inputMode || inputModeMap[type];

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-recipzee-text/80 mb-1"
        >
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Left icon slot */}
        {leftIcon ? (
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-recipzee-subtle">
            {leftIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          name={name}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          inputMode={effectiveInputMode}
          aria-invalid={!!error}
          aria-describedby={describedByIds.join(" ") || undefined}
          className={classNames(
            "w-full rounded-xl border shadow-sm transition-colors duration-200",
            "bg-recipzee-card text-recipzee-text placeholder:text-recipzee-subtle",
            "border-recipzee-border focus:outline-none focus:ring-2 focus:ring-recipzee-green/50 focus:border-recipzee-green",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            sizeStyles[size],
            paddingLeft,
            paddingRight,
            "min-h-[44px]", // touch target
            className
          )}
          {...props}
        />

        {/* Right accessory area */}
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {/* Clear button */}
          {clearable && value ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (typeof onClear === "function") onClear();
                // If no custom clear, attempt a generic clear
                if (!onClear && props.onChange) {
                  const synthetic = { target: { value: "" } };
                  props.onChange(synthetic);
                }
              }}
              className="px-2 py-1 rounded-md text-recipzee-subtle hover:bg-recipzee-green/20 focus:outline-none focus:ring-2 focus:ring-recipzee-green/50"
              aria-label="Clear input"
              tabIndex={0}
            >
              ×
            </button>
          ) : null}

          {/* Password toggle */}
          {type === "password" && passwordToggle ? (
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="px-2 py-1 rounded-md text-recipzee-subtle hover:bg-recipzee-green/20 focus:outline-none focus:ring-2 focus:ring-recipzee-green/50"
              aria-label={reveal ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {reveal ? "Hide" : "Show"}
            </button>
          ) : null}

          {/* Custom right icon (click-through by default) */}
          {rightIcon ? (
            <span className="text-recipzee-subtle">{rightIcon}</span>
          ) : null}
        </div>
      </div>

      {/* Hint / Error */}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-recipzee-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
