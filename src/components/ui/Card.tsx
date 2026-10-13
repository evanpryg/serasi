import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { m } from '@/components/motion'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-border bg-surface shadow-card', className)} {...rest} />
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 sm:p-6', className)} {...rest} />
}

type BadgeTone = 'neutral' | 'primary' | 'gold' | 'success' | 'warning' | 'danger'
const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-ink-muted',
  primary: 'bg-primary-soft text-primary',
  gold: 'bg-gold-soft text-gold-text',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', badgeTones[tone], className)}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, label, tone = 'primary' }: { value: number; label: string; tone?: 'primary' | 'gold' | 'danger' }) {
  const bar = tone === 'danger' ? 'bg-danger' : tone === 'gold' ? 'bg-gold' : 'bg-primary'
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
      <m.div
        className={cn('h-full origin-left rounded-full', bar)}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: value / 100 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
