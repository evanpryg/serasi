import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import {
  Brain,
  CalendarClock,
  ChevronRight,
  Crown,
  FlaskConical,
  Heart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageCircleHeart,
  MoreHorizontal,
  PiggyBank,
  Settings,
  ShieldCheck,
  Store,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { EASE_OUT, SPRING, m } from '@/components/motion'
import { Logo } from '@/components/ui/Logo'
import { MemberAvatar } from '@/components/couple/Cover'
import { SideGate } from '@/components/couple/SidePicker'
import { useAuth } from '@/auth/AuthProvider'
import { firstName, useWedding, useWorkspace } from '@/auth/WorkspaceProvider'
import { PremiumBadge } from '@/components/premium/Premium'
import { PremiumProvider, usePremium } from '@/hooks/usePremium'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { cn } from '@/lib/cn'
import { formatDate, formatRupiahShort } from '@/lib/format'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

const PLANNING: NavItem[] = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/budget', label: 'Budget', icon: Wallet },
  { to: '/app/tabungan', label: 'Tabungan bersama', icon: PiggyBank },
  { to: '/app/vendors', label: 'Vendor', icon: Store },
  { to: '/app/checklist', label: 'Checklist', icon: ListChecks },
  { to: '/app/guests', label: 'Tamu', icon: Users },
  { to: '/app/rundown', label: 'Rundown', icon: CalendarClock },
]
const COUPLE: NavItem[] = [
  { to: '/app/kita', label: 'Kita berdua', icon: Heart, end: true },
  { to: '/app/kita/kepribadian', label: 'Tes kepribadian', icon: Brain },
  { to: '/app/kita/deeptalk', label: 'Deep talk', icon: MessageCircleHeart },
]
const SETTINGS: NavItem = { to: '/app/settings', label: 'Pengaturan', icon: Settings }

// Bottom nav maksimal 5: 4 utama + "Lainnya"
const MOBILE_PRIMARY: NavItem[] = [
  { to: '/app/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { to: '/app/budget', label: 'Budget', icon: Wallet },
  { to: '/app/kita', label: 'Kita', icon: Heart },
  { to: '/app/checklist', label: 'Checklist', icon: ListChecks },
]
const MOBILE_MORE: NavItem[] = [
  { to: '/app/tabungan', label: 'Tabungan bersama', icon: PiggyBank },
  { to: '/app/vendors', label: 'Vendor', icon: Store },
  { to: '/app/guests', label: 'Tamu', icon: Users },
  { to: '/app/rundown', label: 'Rundown', icon: CalendarClock },
  { to: '/app/premium', label: 'Premium', icon: Crown },
  SETTINGS,
]

export function AppLayout() {
  const wedding = useWedding()
  return (
    <PremiumProvider weddingId={wedding.id}>
      <AppShell />
    </PremiumProvider>
  )
}

function AppShell() {
  const wedding = useWedding()
  const { me, partner, couple } = useWorkspace()
  const { isPremium, isAdmin } = usePremium()
  const { signOut, user } = useAuth()
  const location = useLocation()
  const isDemo = Boolean(getCurrentDemoAccount())

  return (
    <div data-premium={isPremium || undefined} className="relative isolate min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="app-backdrop" aria-hidden />
      <a href="#main" className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Lewati ke konten utama
      </a>

      {/* Sidebar desktop */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r [&>*]:shrink-0 bg-surface/75 px-4 py-6 backdrop-blur-md lg:flex',
          isPremium ? 'border-gold/40' : 'border-border',
        )}
      >
        <Logo to="/app/dashboard" className="px-2" />

        {/* Demo badge */}
        {isDemo && (
          <div className="mx-2 mt-3 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-xs font-semibold text-primary">
            <span className="size-2 shrink-0 rounded-full bg-primary animate-pulse" />
            Akun Demo Aktif (Bisa Olah Data)
          </div>
        )}

        {/* Premium: bingkai emas di kartu pasangan agar statusnya terasa di setiap halaman */}
        <div className={cn('mx-2 mt-3 rounded-[0.85rem]', isPremium && 'bg-gradient-to-br from-gold via-gold-soft to-gold p-px shadow-[0_8px_24px_-12px_var(--color-gold)]')}>
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl p-3',
              isPremium ? 'bg-gradient-to-br from-surface via-surface to-gold-soft/70' : 'bg-gradient-to-br from-primary-soft/80 to-partner-soft/70',
            )}
          >
            {me && (
              <div className="flex -space-x-2.5">
                {couple.map((mb) => (
                  <MemberAvatar key={mb.userId} member={mb} size="sm" />
                ))}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {partner && me ? `${couple.map((mb) => firstName(mb.name)).join(' & ')}` : wedding.title}
              </p>
              <p className="truncate text-xs text-ink-muted">{wedding.wedding_date ? formatDate(wedding.wedding_date) : wedding.city}</p>
              {isPremium && <PremiumBadge className="premium-sheen mt-1" label="Premium aktif" />}
            </div>
          </div>
        </div>
        <nav aria-label="Navigasi utama" className="mt-6 flex-1 space-y-6">
          <NavGroup label="Perencanaan" items={PLANNING} />
          <NavGroup label="Kita berdua" items={COUPLE} accent />
          <NavGroup items={[SETTINGS]} />
          {isAdmin && (
            <NavGroup
              label="Admin Serasi"
              items={[{ to: '/app/admin/pembayaran', label: 'Kelola Akun Premium', icon: ShieldCheck }]}
              accent
            />
          )}
        </nav>
        {isPremium ? <PremiumCard /> : <UpgradeCard />}
        <div className="border-t border-border pt-4">
          {isDemo ? (
            <div className="space-y-2">
              <p className="px-3 text-xs text-ink-subtle">Sedang menjelajahi sebagai demo</p>
              <a
                href="/register"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
              >
                Daftar gratis sekarang
              </a>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <LogOut className="size-[1.15rem]" aria-hidden />
                Keluar dari demo
              </button>
            </div>
          ) : (
            <>
              <p className="truncate px-3 text-xs text-ink-subtle">{user?.email}</p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-2 flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <LogOut className="size-[1.15rem]" aria-hidden />
                Keluar
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="min-w-0">
        <header
          className={cn(
            'sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-canvas/80 px-4 backdrop-blur-md lg:hidden',
            isPremium ? 'border-gold/40' : 'border-border',
          )}
        >
          <Logo to="/app/dashboard" />
          <div className="flex items-center gap-2">
            {isPremium && (
              <NavLink
                to="/app/premium"
                aria-label="Premium aktif"
                className="premium-sheen inline-flex h-8 items-center gap-1 rounded-full bg-gradient-to-br from-primary-deep to-primary px-2.5 text-xs font-semibold text-gold-on-dark ring-1 ring-gold/50"
              >
                <Crown className="size-3.5" aria-hidden />
                Premium
              </NavLink>
            )}
            {isDemo && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <FlaskConical className="size-3" aria-hidden />
                Demo
              </span>
            )}
            {me && (
              <div className="flex -space-x-2.5">
                {couple.map((mb) => (
                  <MemberAvatar key={mb.userId} member={mb} size="sm" />
                ))}
              </div>
            )}
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {/* Transisi halaman: masuk lembut setiap pindah route */}
          <m.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}>
            <Outlet />
          </m.div>
        </main>
      </div>

      <MobileNav onSignOut={() => void signOut()} isDemo={isDemo} isAdmin={isAdmin} />
      <SideGate />
    </div>
  )
}

/** Kartu status Premium di sidebar: gelap + emas, beda jelas dari ajakan upgrade paket Gratis. */
function PremiumCard() {
  return (
    <NavLink
      to="/app/premium"
      className="premium-sheen relative mx-1 mb-4 flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-br from-primary-deep to-primary p-3 text-white shadow-glow ring-1 ring-gold/50 transition-transform hover:-translate-y-0.5"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-on-dark text-primary-deep shadow-sm">
        <Crown className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gold-on-dark">Serasi Premium</span>
        <span className="block text-xs text-white/85">Semua fitur terbuka · selamanya</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-white/70" aria-hidden />
    </NavLink>
  )
}

/** Ajakan upgrade ringkas di sidebar (hanya untuk paket Gratis). */
function UpgradeCard() {
  const { price } = usePremium()
  return (
    <NavLink
      to="/app/premium"
      className="mx-1 mb-4 flex items-center gap-3 rounded-xl border border-gold/40 bg-gold-soft/50 p-3 transition-colors hover:bg-gold-soft"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-gold-text ring-1 ring-gold/30">
        <Crown className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">Upgrade ke Premium</span>
        <span className="block text-xs text-ink-muted">{formatRupiahShort(price)} · sekali bayar berdua</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-subtle" aria-hidden />
    </NavLink>
  )
}

function NavGroup({ label, items, accent }: { label?: string; items: NavItem[]; accent?: boolean }) {
  return (
    <div>
      {label && <p className={cn('mb-2 px-3 text-xs font-semibold uppercase tracking-[0.12em]', accent ? 'text-partner' : 'text-ink-subtle')}>{label}</p>}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.to}>
            <SideLink item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function SideLink({ item, layoutGroup = 'side' }: { item: NavItem; layoutGroup?: string }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'relative flex h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium transition-colors duration-150',
          isActive ? 'text-on-primary' : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <m.span layoutId={`${layoutGroup}-active`} transition={SPRING} className="absolute inset-0 rounded-xl bg-primary shadow-sm" />}
          <Icon className="relative size-[1.15rem]" aria-hidden />
          <span className="relative">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function MobileNav({ onSignOut, isDemo, isAdmin }: { onSignOut: () => void; isDemo: boolean; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const location = useLocation()
  const moreActive = MOBILE_MORE.some((i) => location.pathname.startsWith(i.to)) || Boolean(isAdmin && location.pathname.startsWith('/app/admin'))

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // <dialog>.showModal(): focus trap, Esc, dan background inert bawaan browser.
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <>
      <nav aria-label="Navigasi utama" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {MOBILE_PRIMARY.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn('flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold transition-colors', isActive ? 'text-primary' : 'text-ink-subtle hover:text-ink')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative flex h-7 w-12 items-center justify-center">
                      {isActive && <m.span layoutId="bottom-active" transition={SPRING} className="absolute inset-0 rounded-full bg-primary-soft" />}
                      <m.span className="relative" animate={{ scale: isActive ? 1.08 : 1 }} transition={SPRING}>
                        <Icon className={cn('size-5', to === '/app/kita' && isActive && 'fill-partner/25 text-partner')} aria-hidden />
                      </m.span>
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              className={cn('flex h-16 w-full cursor-pointer flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold transition-colors', moreActive ? 'text-primary' : 'text-ink-subtle hover:text-ink')}
            >
              <span className="relative flex h-7 w-12 items-center justify-center">
                {moreActive && <m.span layoutId="bottom-active" transition={SPRING} className="absolute inset-0 rounded-full bg-primary-soft" />}
                <MoreHorizontal className="relative size-5" aria-hidden />
              </span>
              Lainnya
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={dialogRef}
        aria-label="Menu lainnya"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-sm lg:hidden"
      >
        <div className="safe-bottom animate-sheet-up rounded-t-[1.5rem] bg-surface px-4 pb-4 pt-3 shadow-pop">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden />
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="font-semibold text-ink">Menu lainnya</p>
            <button type="button" onClick={() => setOpen(false)} className="flex size-11 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted" aria-label="Tutup menu">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <ul className="space-y-1">
            {MOBILE_MORE.map((item) => (
              <li key={item.to}>
                <SideLink item={item} layoutGroup="sheet" />
              </li>
            ))}
            {isAdmin && (
              <li>
                <SideLink
                  item={{ to: '/app/admin/pembayaran', label: 'Kelola Akun Premium (Admin)', icon: ShieldCheck }}
                  layoutGroup="sheet"
                />
              </li>
            )}
            <li>
              {isDemo ? (
                <a
                  href="/register"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[0.95rem] font-semibold text-on-primary"
                >
                  Daftar gratis sekarang
                </a>
              ) : (
                <button type="button" onClick={onSignOut} className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium text-danger hover:bg-danger-soft">
                  <LogOut className="size-[1.15rem]" aria-hidden />
                  Keluar
                </button>
              )}
            </li>
          </ul>
        </div>
      </dialog>
    </>
  )
}
