import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

type Tone = 'info' | 'success' | 'warning' | 'danger'

const toneStyles: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: 'bg-primary-soft border-primary/15 text-ink', icon: <Info className="size-5 text-primary" aria-hidden /> },
  success: { box: 'bg-success-soft border-success/20 text-ink', icon: <CheckCircle2 className="size-5 text-success" aria-hidden /> },
  warning: { box: 'bg-warning-soft border-warning/20 text-ink', icon: <AlertTriangle className="size-5 text-warning" aria-hidden /> },
  danger: { box: 'bg-danger-soft border-danger/20 text-ink', icon: <XCircle className="size-5 text-danger" aria-hidden /> },
}

export function Alert({ tone = 'info', title, children, className }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string }) {
  const s = toneStyles[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', s.box, className)}
    >
      <span className="mt-0.5 shrink-0">{s.icon}</span>
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-ink-muted">{children}</div>}
      </div>
    </div>
  )
}

export function Spinner({ label = 'Memuat…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center gap-3 text-ink-muted', className)}>
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <Spinner label={label} />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-surface-muted', className)} />
}

export function ErrorState({ title = 'Data gagal dimuat', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card border border-danger/20 bg-danger-soft/50 px-6 py-10 text-center">
      <XCircle className="size-8 text-danger" aria-hidden />
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-muted">{message ?? 'Periksa koneksi internetmu, lalu coba lagi.'}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="size-4" aria-hidden />}>
          Coba lagi
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-card border border-dashed border-border-strong bg-surface/60 px-6 py-12 text-center', className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gold-soft text-gold-text">{icon}</div>
      <h3 className="font-display text-2xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-[0.95rem] text-ink-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
