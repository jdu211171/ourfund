import { AlertCircle } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

// Intentionally simple — good enough to catch obvious typos without
// rejecting valid-but-unusual addresses. Server-side validation is
// still the source of truth.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface InviteeEmailFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  /** Called with the current trimmed value's validity whenever it changes. */
  onValidityChange?: (isValid: boolean) => void
  /** Optional externally-supplied error (e.g. "email already invited") shown
   * alongside / instead of the built-in format error. */
  externalError?: string | null
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && EMAIL_PATTERN.test(trimmed)
}

export function InviteeEmailField({
  value,
  onChange,
  label = 'Invitee email',
  placeholder = 'name@example.com',
  externalError = null
}: InviteeEmailFieldProps) {
  const [touched, setTouched] = useState(false)
  const [focused, setFocused] = useState(false)
  const helperId = useId()

  const trimmed = value.trim()
  const formatValid = trimmed.length === 0 || EMAIL_PATTERN.test(trimmed)
  const showFormatError = touched && trimmed.length > 0 && !formatValid
  const showError = showFormatError || Boolean(externalError)

  const helperText = useMemo(() => {
    if (showFormatError) return 'Enter a valid email address, like name@example.com'
    if (externalError) return externalError
    return null
  }, [showFormatError, externalError])

  return (
    <div>
      <div
        className={`rounded-2xl bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-soft)] border-2 transition-colors duration-150 ${
          showError
            ? 'border-[var(--danger)]'
            : focused
              ? 'border-[var(--primary)]'
              : 'border-[var(--border)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <p
            className={`text-[10px] font-semibold uppercase tracking-wide ${
              showError ? 'text-[var(--danger)]' : 'text-muted-foreground'
            }`}
          >
            {label}
          </p>
          {showError && (
            <AlertCircle className="h-3.5 w-3.5 text-[var(--danger)]" strokeWidth={2.25} />
          )}
        </div>
        <input
          value={value}
          onChange={event => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            setTouched(true)
          }}
          className="mt-0.5 w-full bg-transparent text-[13px] font-semibold text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder={placeholder}
          aria-invalid={showError}
          aria-describedby={helperText ? helperId : undefined}
        />
      </div>
      {helperText && (
        <p id={helperId} className="mt-1.5 px-1 text-[11px] font-semibold text-[var(--danger)]">
          {helperText}
        </p>
      )}
    </div>
  )
}
