import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Minus, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import type { Guest, MemberSide } from '@/lib/database.types'
import { GUEST_CATEGORIES, GUEST_SIDE_LABEL } from '@/lib/guests'
import { SIDE_TONE } from '@/lib/side'
import type { GuestDraft } from '@/hooks/usePlanningData'

type Rsvp = Guest['rsvp_status']

export const RSVP_META: Record<Rsvp, { label: string; short: string; active: string; badge: string }> = {
  menunggu: { label: 'Belum jawab', short: 'Belum', active: 'bg-gold-soft text-gold-text border-gold', badge: 'bg-gold-soft text-gold-text' },
  hadir: { label: 'Hadir', short: 'Hadir', active: 'bg-success text-white border-success', badge: 'bg-success-soft text-success' },
  tidak_hadir: { label: 'Tidak hadir', short: 'Tidak', active: 'bg-danger-soft text-danger border-danger/40', badge: 'bg-danger-soft text-danger' },
}
const RSVP_ORDER: Rsvp[] = ['menunggu', 'hadir', 'tidak_hadir']
const SIDES: MemberSide[] = ['cpp', 'cpw']

/**
 * Lembar bawah tamu. Tanpa `guest` = tambah (tetap terbuka setelah simpan untuk tamu berikutnya,
 * pihak & kategori diingat). Dengan `guest` = ubah + status undangan/jawaban yang langsung tersimpan.
 */
export function GuestSheet({
  guest,
  defaults,
  categories,
  onClose,
  onCreate,
  onUpdate,
  onRsvp,
  onInvite,
  onDelete,
}: {
  guest?: Guest
  defaults: { side: MemberSide; category: string }
  categories: string[]
  onClose: () => void
  onCreate: (draft: GuestDraft) => Promise<void>
  onUpdate: (id: string, draft: GuestDraft) => Promise<void>
  onRsvp: (id: string, rsvp: Rsvp) => void
  onInvite: (id: string, status: Guest['invitation_status']) => void
  onDelete: (guest: Guest) => void
}) {
  const editing = guest != null
  const [name, setName] = useState(guest?.name ?? '')
  const [side, setSide] = useState<MemberSide>(guest?.side ?? defaults.side)
  const [category, setCategory] = useState(guest?.group_name || defaults.category)
  const [custom, setCustom] = useState<string | null>(null)
  const [count, setCount] = useState(guest?.guest_count ?? 2)
  const [notes, setNotes] = useState(guest?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const titleId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    ;(editing ? closeRef : nameRef).current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [editing, onClose])

  useEffect(() => {
    if (!saved) return
    const t = window.setTimeout(() => setSaved(null), 4000)
    return () => window.clearTimeout(t)
  }, [saved])

  const allCategories = Array.from(new Set([...GUEST_CATEGORIES, ...categories, category].filter(Boolean)))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanName = name.trim()
    const finalCategory = (custom ?? category).trim()
    if (!cleanName) {
      setError('Nama tamu wajib diisi.')
      nameRef.current?.focus()
      return
    }
    setError(null)
    setBusy(true)
    const draft: GuestDraft = { name: cleanName, side, group_name: finalCategory || 'Lainnya', guest_count: Math.max(1, count), notes: notes.trim() || null }
    try {
      if (guest) {
        await onUpdate(guest.id, draft)
        onClose()
        return
      }
      await onCreate(draft)
      setSaved(cleanName)
      setName('')
      setNotes('')
      if (custom != null) {
        setCategory(draft.group_name ?? 'Lainnya')
        setCustom(null)
      }
      nameRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan tamu.')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        noValidate
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-up safe-bottom max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface shadow-pop sm:animate-fade-up sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-surface px-5 pb-2 pt-3">
          <span aria-hidden className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-border sm:hidden" />
          <h2 id={titleId} className="min-w-0 truncate pt-2 font-display text-xl font-semibold text-ink">
            {editing ? guest.name : 'Tambah tamu'}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="mt-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-ink-subtle hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          {guest && (
            <div className="space-y-3 rounded-2xl bg-surface-muted p-3">
              <div role="radiogroup" aria-label="Jawaban tamu" className="flex rounded-xl border border-border bg-surface p-0.5">
                {RSVP_ORDER.map((value) => {
                  const active = guest.rsvp_status === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => !active && onRsvp(guest.id, value)}
                      className={cn(
                        'h-10 flex-1 cursor-pointer rounded-[0.6rem] border text-sm font-semibold transition-colors',
                        active ? RSVP_META[value].active : 'border-transparent text-ink-muted hover:text-ink',
                      )}
                    >
                      {RSVP_META[value].label}
                    </button>
                  )
                })}
              </div>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-1 text-sm font-medium text-ink">
                Undangan sudah dikirim
                <input
                  type="checkbox"
                  checked={guest.invitation_status === 'terkirim'}
                  onChange={(e) => onInvite(guest.id, e.target.checked ? 'terkirim' : 'belum')}
                  className="size-5 cursor-pointer accent-primary"
                />
              </label>
            </div>
          )}

          {saved && (
            <p role="status" className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm font-medium text-success">
              <Check className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{saved} tersimpan. Lanjut tamu berikutnya.</span>
            </p>
          )}

          <TextField
            ref={nameRef}
            label="Nama tamu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Bpk. Bambang & keluarga"
            error={error ?? undefined}
            maxLength={160}
            autoComplete="off"
          />

          <fieldset>
            <legend className="text-sm font-semibold text-ink">Tamu dari pihak</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {SIDES.map((s) => {
                const active = side === s
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSide(s)}
                    className={cn(
                      'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors',
                      active ? cn(SIDE_TONE[s].bg, 'border-transparent text-white') : 'border-border text-ink-muted hover:border-border-strong hover:text-ink',
                    )}
                  >
                    {active && <Check className="size-4" aria-hidden />}
                    {GUEST_SIDE_LABEL[s]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-ink">Kategori</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {allCategories.map((c) => {
                const active = custom == null && category === c
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setCategory(c)
                      setCustom(null)
                    }}
                    className={cn(
                      'min-h-10 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors',
                      active ? 'border-primary bg-primary-soft text-primary' : 'border-border text-ink-muted hover:border-border-strong hover:text-ink',
                    )}
                  >
                    {c}
                  </button>
                )
              })}
              {custom == null && (
                <button
                  type="button"
                  onClick={() => setCustom('')}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full border border-dashed border-border-strong px-3.5 text-sm font-medium text-ink-muted hover:text-ink"
                >
                  <Plus className="size-4" aria-hidden />
                  Kategori lain
                </button>
              )}
            </div>
            {custom != null && (
              <TextField
                label="Nama kategori baru"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Contoh: Jamaah masjid"
                maxLength={80}
                autoFocus
                wrapperClassName="mt-3"
              />
            )}
          </fieldset>

          <div className="flex items-center justify-between gap-3">
            <span id={`${titleId}-count`} className="text-sm font-semibold text-ink">
              Jumlah orang yang datang
            </span>
            <div role="group" aria-labelledby={`${titleId}-count`} className="flex items-center rounded-xl border border-border">
              <button type="button" aria-label="Kurangi" onClick={() => setCount((n) => Math.max(1, n - 1))} className="flex size-11 cursor-pointer items-center justify-center text-ink-muted hover:text-ink">
                <Minus className="size-4" aria-hidden />
              </button>
              <span aria-live="polite" className="w-8 text-center font-num text-lg font-semibold text-ink">
                {count}
              </span>
              <button type="button" aria-label="Tambah" onClick={() => setCount((n) => Math.min(50, n + 1))} className="flex size-11 cursor-pointer items-center justify-center text-ink-muted hover:text-ink">
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <TextField label="Catatan" optional value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: no. WA, meja VIP" maxLength={1000} />

          <div className="flex items-center gap-2 pt-1">
            {guest ? (
              <Button variant="ghost" onClick={() => onDelete(guest)} icon={<Trash2 className="size-4" aria-hidden />} className="mr-auto px-3! hover:bg-danger-soft hover:text-danger">
                Hapus
              </Button>
            ) : (
              <Button variant="ghost" onClick={onClose} className="mr-auto">
                Selesai
              </Button>
            )}
            <Button type="submit" loading={busy}>
              {editing ? 'Simpan' : 'Simpan tamu'}
            </Button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}
