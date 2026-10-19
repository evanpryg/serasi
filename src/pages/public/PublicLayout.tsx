import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { useAuth } from '@/auth/AuthProvider'
import { APP_NAME, APP_TAGLINE, CONTACT_EMAIL } from '@/lib/config'
import { cn } from '@/lib/cn'

const links = [
  { href: '/#fitur', label: 'Fitur' },
  { href: '/#kenali', label: 'Kenali Pasangan' },
  { href: '/#cara-kerja', label: 'Cara Kerja' },
  { href: '/vendors', label: 'Vendor' },
  { href: '/#harga', label: 'Paket' },
]

export function PublicLayout() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname, location.hash])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#konten" className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Lewati ke konten utama
      </a>
      <header
        className={cn(
          'sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-200',
          scrolled || open ? 'border-b border-border bg-canvas/90 backdrop-blur' : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-[4.25rem] max-w-[104rem] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10 xl:px-16">
          <Logo />
          <nav aria-label="Navigasi publik" className="hidden md:block">
            <ul className="flex items-center gap-1">
              <li>
                <Link to="/" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
                  Beranda
                </Link>
              </li>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {session ? (
              <ButtonLink to="/app/dashboard" size="sm">
                Buka Dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost" size="sm">
                  Masuk
                </ButtonLink>
                <ButtonLink to="/register" size="sm">
                  Daftar Gratis
                </ButtonLink>
              </>
            )}
          </div>
          <button
            type="button"
            className="flex size-11 cursor-pointer items-center justify-center rounded-xl text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
          >
            {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
        {open && (
          <nav id="mobile-menu" aria-label="Navigasi publik" className="animate-fade-up border-t border-border px-4 pb-5 pt-2 md:hidden">
            <ul className="space-y-1">
              <li>
                <Link to="/" className="flex h-11 items-center rounded-xl px-3 font-medium text-ink hover:bg-surface-muted">
                  Beranda
                </Link>
              </li>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setOpen(false)} className="flex h-11 items-center rounded-xl px-3 font-medium text-ink hover:bg-surface-muted">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {session ? (
                <ButtonLink to="/app/dashboard" className="col-span-2">
                  Buka Dashboard
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink to="/login" variant="secondary">
                    Masuk
                  </ButtonLink>
                  <ButtonLink to="/register">Daftar Gratis</ButtonLink>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <div id="konten">
        <Outlet />
      </div>

      <footer className="border-t border-border bg-surface-muted/50">
        <div className="mx-auto grid max-w-[104rem] gap-10 px-4 py-12 sm:px-6 lg:px-10 xl:px-16 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-ink-muted">
              {APP_TAGLINE}. Anggaran, vendor, pembayaran, checklist, tamu, dan rundown dalam satu workspace.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Produk</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              <li><a className="hover:text-ink" href="/#fitur">Fitur</a></li>
              <li><a className="hover:text-ink" href="/#cara-kerja">Cara kerja</a></li>
              <li><Link className="hover:text-ink" to="/vendors">Direktori vendor</Link></li>
              <li><a className="hover:text-ink" href="/#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Informasi</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              <li><Link className="hover:text-ink" to="/privasi">Kebijakan privasi</Link></li>
              <li><Link className="hover:text-ink" to="/syarat">Syarat penggunaan</Link></li>
              {CONTACT_EMAIL && (
                <li><a className="hover:text-ink" href={`mailto:${CONTACT_EMAIL}`}>Kontak: {CONTACT_EMAIL}</a></li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-ink-subtle">
          © {new Date().getFullYear()} {APP_NAME}. Dibuat untuk calon pengantin Indonesia.
        </div>
      </footer>
    </div>
  )
}
