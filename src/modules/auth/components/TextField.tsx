import type React from 'react'

type TextFieldProps = {
  id: string
  label: string
  type?: string
  value: string
  placeholder?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  error?: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
}

export function TextField({
  id,
  label,
  type = 'text',
  value,
  placeholder,
  autoComplete,
  inputMode,
  error,
  onChange,
  onBlur,
}: TextFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`field__input ${error ? 'field__input--error' : ''}`}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      <div className="field__error" id={error ? errorId : undefined} role={error ? 'alert' : undefined}>
        {error ?? ''}
      </div>
    </div>
  )
}
