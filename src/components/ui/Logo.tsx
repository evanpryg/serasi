import { Link } from 'react-router'
import { APP_NAME } from '@/lib/config'
import { cn } from '@/lib/cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--color-primary)" />
      {/* Dua cincin: emas & warna pasangan — dua pribadi yang serasi */}
      <circle cx="12.8" cy="16" r="6" fill="none" stroke="var(--color-gold)" strokeWidth="2" />
      <circle cx="19.2" cy="16" r="6" fill="none" stroke="var(--color-partner-light)" strokeWidth="2" />
    </svg>
  )
}

export function Logo({ to = '/', light = false, className }: { to?: string; light?: boolean; className?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5 rounded-lg', className)} aria-label={`${APP_NAME} — beranda`}>
      <LogoMark />
      <span className={cn('font-display text-[1.7rem] font-semibold italic leading-none tracking-tight', light ? 'text-canvas' : 'text-ink')}>{APP_NAME}</span>
    </Link>
  )
}
