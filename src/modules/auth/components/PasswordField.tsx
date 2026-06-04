import { useState } from 'react'
import type React from 'react'

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  placeholder?: string
  autoComplete?: string
  error?: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void
}

export function PasswordField({
  id,
  label,
  value,
  placeholder,
  autoComplete,
  error,
  onChange,
  onBlur,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className={`field__control ${error ? 'field__control--error' : ''}`}>
        <input
          id={id}
          className="field__input field__input--with-action"
          type={isVisible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          className="field__action"
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {isVisible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 12c2.7-4.2 6-6.3 9-6.3 3 0 6.3 2.1 9 6.3-2.7 4.2-6 6.3-9 6.3-3 0-6.3-2.1-9-6.3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 12c2.7-4.2 6-6.3 9-6.3 3 0 6.3 2.1 9 6.3-2.7 4.2-6 6.3-9 6.3-3 0-6.3-2.1-9-6.3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        </button>
      </div>
      <div className="field__error" id={error ? errorId : undefined} role={error ? 'alert' : undefined}>
        {error ?? ''}
      </div>
    </div>
  )
}
