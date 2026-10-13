/**
 * Pola bersama halaman perencanaan (Budget, Vendor, Checklist, Tamu, Rundown).
 * Tujuan: setiap halaman punya struktur yang sama — judul + satu kalimat penjelasan,
 * ringkasan angka penting, filter sederhana, lalu daftar — agar mudah dipahami.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Lightbulb, Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { Badge } from './Card'
import { Button } from './Button'

export function PageHeader({ title, description, actions }: { title: string; description: ReactNode; actions?: ReactNode }) {
  const isDemo = Boolean(getCurrentDemoAccount())
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-display text-[2.2rem] font-semibold leading-tight sm:text-[2.75rem]">{title}</h1>
          {isDemo && <Badge tone="gold">Akun demo</Badge>}
        </div>
        <p className="mt-1 max-w-2xl text-ink-muted">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

const HINT_PREFIX = 'serasi:hint-hidden:'

/** Panduan 3 langkah yang bisa disembunyikan. Tersimpan per browser (aman jika storage tidak tersedia). */
export function HowTo({ id, steps }: { id: string; steps: ReactNode[] }) {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HINT_PREFIX + id) === '1'
    } catch {
      return false
    }
  })
  if (hidden) return null

  function hide() {
    setHidden(true)
    try {
      localStorage.setItem(HINT_PREFIX + id, '1')
    } catch {
      /* abaikan */
    }
  }

  return (
    <section aria-label="Cara pakai halaman ini" className="relative rounded-card border border-gold/40 bg-gold-soft/50 p-4 pr-12 sm:p-5 sm:pr-14">
      <div className="flex items-center gap-2 text-sm font-semibold text-gold-text">
        <Lightbulb className="size-4" aria-hidden />
        Cara pakai
      </div>
      <ol className="mt-2 grid gap-2 text-sm text-ink sm:grid-cols-3 sm:gap-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-gold-text ring-1 ring-gold/40">
              {i + 1}
            </span>
            <span className="text-ink-muted">{step}</span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={hide}
        aria-label="Sembunyikan panduan"
        title="Sembunyikan panduan"
        className="absolute right-2 top-2 flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <X className="size-4" aria-hidden />
      </button>
    </section>
  )
}

/** Satu angka ringkasan dengan label jelas. */
export function Stat({ label, value, hint, tone = 'ink', icon }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'ink' | 'primary' | 'success' | 'warning' | 'danger'; icon?: ReactNode }) {
  const toneClass = { ink: 'text-ink', primary: 'text-primary', success: 'text-success', warning: 'text-warning', danger: 'text-danger' }[tone]
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-sm text-ink-muted">
        {icon}
        {label}
      </p>
      <p className={cn('mt-0.5 font-display text-2xl font-bold tabular sm:text-[1.7rem]', toneClass)}>{value}</p>
      {hint && <p className="text-xs text-ink-subtle">{hint}</p>}
    </div>
  )
}

export type ChipOption<T extends string> = { value: T; label: string; count?: number }

/** Grup pilihan satu (chip). Membungkus ke baris baru, tidak pernah terpotong. */
export function ChipGroup<T extends string>({ label, options, value, onChange, className }: { label: string; options: ChipOption<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors',
              active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink',
            )}
          >
            {opt.label}
            {opt.count != null && (
              <span className={cn('rounded-full px-1.5 text-xs tabular', active ? 'bg-white/20' : 'bg-surface-muted')}>{opt.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder, label, className }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  const id = useId()
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Hapus pencarian"
          className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-ink-subtle hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}

export function SelectFilter({ label, value, onChange, children, className }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full cursor-pointer rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      >
        {children}
      </select>
    </div>
  )
}

/** Tombol ikon dengan label aksesibel dan target sentuh 40px. */
export function IconButton({ label, onClick, children, tone = 'neutral', className }: { label: string; onClick: () => void; children: ReactNode; tone?: 'neutral' | 'danger'; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        // cn tidak menggabungkan kelas Tailwind: jangan pasang inline-flex jika pemanggil ingin `hidden`.
        !className?.split(' ').includes('hidden') && 'inline-flex',
        'size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-ink-subtle transition-colors',
        tone === 'danger' ? 'hover:bg-danger-soft hover:text-danger' : 'hover:bg-surface-muted hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Dialog konfirmasi untuk aksi yang tidak bisa dibatalkan (pengganti window.confirm). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, hapus',
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-pop"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <AlertTriangle className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="font-semibold text-ink">
              {title}
            </h2>
            <div className="mt-1 text-sm text-ink-muted">{message}</div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button variant="danger" loading={busy} onClick={() => void handleConfirm()}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Hook kecil untuk menyimpan item yang akan dihapus. */
export function useConfirm<T>() {
  const [target, setTarget] = useState<T | null>(null)
  return { target, ask: setTarget, close: () => setTarget(null) }
}
