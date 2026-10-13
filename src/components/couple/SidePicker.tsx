import { useEffect, useId, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { m } from '@/components/motion'
import { Button } from '@/components/ui/Button'
import { useWorkspace } from '@/auth/WorkspaceProvider'
import { cn } from '@/lib/cn'
import { SIDE_LABEL, applySideTheme, otherSide, type MemberSide } from '@/lib/side'

const OPTIONS: { side: MemberSide; theme: string; swatch: string; ring: string }[] = [
  { side: 'cpp', theme: 'Tema Midnight Sapphire', swatch: 'from-[#2c4f8f] via-cpp to-[#0f1f3d]', ring: 'peer-checked:border-cpp peer-checked:ring-cpp/15' },
  { side: 'cpw', theme: 'Tema Rosé Champagne', swatch: 'from-[#c45a80] via-cpw to-[#5a1a33]', ring: 'peer-checked:border-cpw peer-checked:ring-cpw/15' },
]

/**
 * Pilihan peran: calon pengantin pria (CPP) atau wanita (CPW).
 * Radio asli (tersembunyi) menjaga navigasi keyboard & pembaca layar; tema langsung
 * dipratinjau saat dipilih agar user melihat warnanya sebelum menyimpan.
 */
export function SidePicker({
  value,
  onChange,
  disabledSide,
  previewTheme = true,
  className,
}: {
  value: MemberSide | null
  onChange: (side: MemberSide) => void
  /** Peran yang sudah dipakai pasangan (tetap bisa dipilih: peran akan bertukar). */
  disabledSide?: MemberSide | null
  previewTheme?: boolean
  className?: string
}) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label="Peranmu di pernikahan" className={cn('grid grid-cols-2 gap-3', className)}>
      {OPTIONS.map((opt) => {
        const label = SIDE_LABEL[opt.side]
        const selected = value === opt.side
        return (
          <label key={opt.side} className="relative block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.side}
              checked={selected}
              onChange={() => {
                onChange(opt.side)
                if (previewTheme) applySideTheme(opt.side)
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex h-full flex-col rounded-2xl border-2 border-border bg-surface p-3.5 ring-4 ring-transparent transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary sm:p-4',
                opt.ring,
              )}
            >
              <span className={cn('relative flex h-16 items-end overflow-hidden rounded-xl bg-gradient-to-br p-2.5 sm:h-20', opt.swatch)} aria-hidden>
                {/* Dua cincin emas — motif logo */}
                <svg viewBox="0 0 40 24" className="absolute right-2.5 top-2.5 h-5 w-8 opacity-90">
                  <circle cx="14" cy="12" r="8" fill="none" stroke="#d9be85" strokeWidth="1.6" />
                  <circle cx="26" cy="12" r="8" fill="none" stroke="#f6e6c4" strokeWidth="1.6" />
                </svg>
                <span className="font-display text-xl font-semibold italic leading-none text-white">{label.short}</span>
              </span>
              <span className="mt-3 block text-[0.95rem] font-semibold leading-snug text-ink">{label.long}</span>
              <span className="mt-0.5 block text-xs text-ink-subtle">
                {disabledSide === opt.side ? 'Dipakai pasanganmu' : opt.theme}
              </span>
            </span>
            {selected && (
              <m.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  'absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-surface',
                  opt.side === 'cpp' ? 'bg-cpp' : 'bg-cpw',
                )}
                aria-hidden
              >
                <Check className="size-3.5" strokeWidth={3} />
              </m.span>
            )}
          </label>
        )
      })}
    </div>
  )
}

/**
 * Akun lama (sebelum ada peran CPP/CPW) diminta memilih sekali.
 * Tidak bisa ditutup tanpa memilih karena tema & label berkas bergantung padanya.
 */
export function SideGate() {
  const { me, partner, sidesSupported, setMySide } = useWorkspace()
  const needed = Boolean(me && !me.side && sidesSupported)
  const suggested = partner?.side ? otherSide(partner.side) : null
  const [side, setSide] = useState<MemberSide | null>(suggested)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (needed && !dialog.open) dialog.showModal()
    if (!needed && dialog.open) dialog.close()
  }, [needed])

  if (!needed) return null

  async function save() {
    if (!side) return setError('Pilih salah satu dulu, ya.')
    setSaving(true)
    setError(null)
    try {
      await setMySide(side)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Peran gagal disimpan.')
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="side-gate-title"
      onCancel={(e) => e.preventDefault()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[1.5rem] bg-surface p-0 shadow-pop backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-text">Satu akun untuk berdua</p>
        <h2 id="side-gate-title" className="mt-1.5 font-display text-[1.9rem] font-semibold leading-tight text-ink">
          Kamu calon pengantin…
        </h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          Warna aplikasi mengikuti peranmu, dan berkas KUA dipisah untuk masing-masing.
          {partner ? ' Pasanganmu otomatis mendapat peran yang satunya.' : ''}
        </p>
        <SidePicker value={side} onChange={setSide} disabledSide={partner?.side} className="mt-5" />
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        <Button className="mt-6 w-full" size="lg" loading={saving} disabled={!side} onClick={() => void save()}>
          {side ? `Simpan sebagai ${SIDE_LABEL[side].short}` : 'Pilih peranmu'}
        </Button>
      </div>
    </dialog>
  )
}
