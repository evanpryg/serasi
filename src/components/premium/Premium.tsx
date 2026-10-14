/**
 * Komponen bersama paket Premium. Pola: fitur terkunci selalu menjelaskan APA yang terbuka,
 * menampilkan harga, dan satu tombol menuju /app/premium (bukan modal yang "mengaktifkan").
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Crown, Lock } from 'lucide-react'
import { buttonClass } from '@/components/ui/Button'
import { usePremium } from '@/hooks/usePremium'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/format'
import type { UpgradeSource } from '@/lib/plans'

export const premiumHref = (source?: UpgradeSource) => (source ? `/app/premium?dari=${source}` : '/app/premium')

/** Label kecil "Premium" (ikon + teks, bukan warna saja). */
export function PremiumBadge({ className, label = 'Premium' }: { className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gold-soft px-2 py-0.5 text-xs font-semibold text-gold-text ring-1 ring-gold/30', className)}>
      <Crown className="size-3" aria-hidden />
      {label}
    </span>
  )
}

/** Kartu fitur terkunci: judul, manfaat, harga, satu CTA. */
export function LockedPanel({
  source,
  title,
  description,
  className,
  tone = 'light',
  children,
}: {
  source: UpgradeSource
  title: string
  description: ReactNode
  className?: string
  tone?: 'light' | 'dark'
  children?: ReactNode
}) {
  const { price } = usePremium()
  const dark = tone === 'dark'
  return (
    <div
      className={cn(
        'rounded-card border p-5 sm:p-6',
        dark ? 'border-white/20 bg-white/5 text-white' : 'border-gold/40 bg-gradient-to-br from-gold-soft/60 via-surface to-surface',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', dark ? 'bg-white/10 text-gold-on-dark' : 'bg-gold-soft text-gold-text')}>
          <Lock className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className={cn('font-semibold', dark ? 'text-white' : 'text-ink')}>{title}</p>
          <p className={cn('mt-0.5 text-sm', dark ? 'text-white/75' : 'text-ink-muted')}>{description}</p>
        </div>
      </div>
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link to={premiumHref(source)} className={buttonClass(dark ? 'gold' : 'primary', 'md', 'w-full sm:w-auto')}>
          <Crown className="size-4" aria-hidden />
          Buka dengan Premium
        </Link>
        <span className={cn('text-sm', dark ? 'text-white/75' : 'text-ink-muted')}>
          <strong className={cn('tabular', dark ? 'text-white' : 'text-ink')}>{formatRupiah(price)}</strong> sekali bayar, untuk berdua
        </span>
      </div>
    </div>
  )
}
