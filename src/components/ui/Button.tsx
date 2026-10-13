import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out-soft ' +
  'cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover shadow-sm',
  secondary: 'bg-surface text-ink border border-border-strong hover:bg-surface-muted',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:bg-[#931c13]',
  gold: 'bg-gold-soft text-gold-text border border-gold/40 hover:bg-[#efe1c4]',
}

// Tinggi minimum 44px untuk target sentuh (md/lg); sm hanya untuk area padat desktop.
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-12 px-6 text-base',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({ variant, size, loading, icon, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

type ButtonLinkProps = LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode }

export function ButtonLink({ variant, size, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, typeof className === 'string' ? className : undefined)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}
