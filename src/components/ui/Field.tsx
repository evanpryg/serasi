import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref, type SelectHTMLAttributes } from 'react'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber, parseRupiahInput } from '@/lib/format'

export const inputClass =
  'block w-full h-11 rounded-xl border border-border bg-surface px-3.5 text-[0.95rem] text-ink ' +
  'placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-150 ' +
  'hover:border-border-strong focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15 disabled:bg-surface-muted disabled:text-ink-subtle'

type FieldShellProps = {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: ReactNode
  className?: string
}

/** Label terlihat + hint + error tepat di bawah field (bukan hanya di atas form). */
export function FieldShell({ id, label, hint, error, optional, children, className }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-ink-subtle"> (opsional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  ref?: Ref<HTMLInputElement>
  wrapperClassName?: string
}

export function TextField({ label, hint, error, optional, id: idProp, className, wrapperClassName, ref, ...rest }: TextFieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(inputClass, className)}
        {...rest}
      />
    </FieldShell>
  )
}

export function PasswordField(props: Omit<TextFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false)
  const autoId = useId()
  const id = props.id ?? autoId
  const { label, hint, error, optional, ref, wrapperClassName, className, ...rest } = props
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(inputClass, 'pr-12', className)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-ink-muted hover:text-ink"
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
    </FieldShell>
  )
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  ref?: Ref<HTMLSelectElement>
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({ label, hint, error, optional, options, placeholder, id: idProp, className, ref, ...rest }: SelectFieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <select
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(inputClass, 'cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27%23545d58%27%3E%3Cpath%20d%3D%27M5.3%207.3a1%201%200%20011.4%200L10%2010.6l3.3-3.3a1%201%200%20111.4%201.4l-4%204a1%201%200%2001-1.4%200l-4-4a1%201%200%20010-1.4z%27/%3E%3C/svg%3E")] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10', className)}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

type MoneyFieldProps = {
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  value: number | null
  onChange: (value: number | null) => void
  onBlur?: () => void
  name?: string
  id?: string
  disabled?: boolean
}

/** Input nominal rupiah: menampilkan "12.500.000", menyimpan integer. */
export function MoneyField({ label, hint, error, optional, value, onChange, onBlur, name, id: idProp, disabled }: MoneyFieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[0.95rem] font-medium text-ink-muted">
          Rp
        </span>
        <input
          id={id}
          name={name}
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={value == null ? '' : formatNumber(value)}
          onChange={(e) => onChange(parseRupiahInput(e.target.value))}
          onBlur={onBlur}
          placeholder="0"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(inputClass, 'tabular pl-11')}
        />
      </div>
    </FieldShell>
  )
}
