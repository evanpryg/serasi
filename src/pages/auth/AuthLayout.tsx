import type { ReactNode } from 'react'
import { Brain, Heart, PiggyBank } from 'lucide-react'
import { EASE_OUT, m } from '@/components/motion'
import { DEFAULT_COVER } from '@/lib/config'
import { Logo } from '@/components/ui/Logo'

const points = [
  { icon: Heart, text: 'Satu akun untuk kalian berdua' },
  { icon: PiggyBank, text: 'Anggaran, vendor, dan pembayaran tanpa hitung ganda' },
  { icon: Brain, text: 'Tes kepribadian & deep talk untuk saling mengenal' },
]

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <main className="flex flex-col px-4 py-6 sm:px-8">
        <Logo />
        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
          <m.div className="mt-8" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.1 }}>{children}</m.div>
          {footer && <div className="mt-8 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>

      <aside className="relative hidden overflow-hidden bg-primary lg:block" aria-hidden>
        <m.picture className="absolute inset-0 block" initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, ease: EASE_OUT }}>
          <source srcSet={DEFAULT_COVER.webp} type="image/webp" />
          <img src={DEFAULT_COVER.jpg} alt="" className="h-full w-full object-cover" />
        </m.picture>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/55 to-primary/10" />
        <m.div
          className="relative flex h-full flex-col justify-end p-12 xl:p-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
        >
          <p className="font-display text-[2.6rem] font-medium italic leading-tight text-canvas">
            Merencanakan berdua,
            <br />
            melangkah serasi.
          </p>
          <div className="my-8 h-px w-16 bg-gold" />
          <ul className="space-y-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-canvas/90">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon className="size-[1.1rem] text-gold-on-dark" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </m.div>
      </aside>
    </div>
  )
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-ink-subtle">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
