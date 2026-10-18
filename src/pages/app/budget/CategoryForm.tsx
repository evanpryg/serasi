import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { MoneyField, TextField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { POS_SUGGESTIONS, POS_SUGGESTIONS_DEFAULT, eventIcon, posIcon } from '@/lib/budgetIcons'
import type { BudgetCategory, BudgetEvent } from '@/lib/database.types'
import type { CategoryInput } from '@/hooks/usePlanningData'

type CategoryFormProps = {
  initial?: BudgetCategory
  /** Acara yang tersedia; kosong = fitur acara belum aktif (pilihan disembunyikan). */
  events?: BudgetEvent[]
  /** Acara terpilih untuk pos baru. */
  defaultEventId?: string | null
  /** Nama pos yang sudah ada di acara yang sama (untuk menyaring saran). */
  existingNames?: (eventId: string | null) => string[]
  onSubmit: (input: CategoryInput) => Promise<void>
  onCancel: () => void
}

export function CategoryForm({ initial, events = [], defaultEventId = null, existingNames, onSubmit, onCancel }: CategoryFormProps) {
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState<number | null>(initial?.planned_amount ?? null)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [isReserve, setIsReserve] = useState(initial?.is_reserve ?? false)
  const [eventId, setEventId] = useState<string | null>(initial ? (initial.event_id ?? null) : defaultEventId)
  const [errors, setErrors] = useState<{ name?: string; amount?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  const amountId = useId()

  const event = events.find((e) => e.id === eventId)
  const taken = new Set((existingNames?.(eventId) ?? []).map((n) => n.toLowerCase()))
  const pool = (event?.template_key && POS_SUGGESTIONS[event.template_key]) || POS_SUGGESTIONS_DEFAULT
  const suggestions = pool.filter((s) => !taken.has(s.toLowerCase()))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Beri nama pos, misalnya Make up.'
    if (amount == null) next.amount = 'Isi anggarannya. Boleh perkiraan dulu.'
    setErrors(next)
    if (next.name || next.amount) return

    setBusy(true)
    try {
      await onSubmit({
        name: name.trim(),
        planned_amount: amount ?? 0,
        notes: notes.trim() || null,
        is_reserve: isReserve,
        ...(events.length > 0 && { event_id: eventId }),
      })
    } catch {
      setErrors({ form: 'Gagal menyimpan pos. Periksa koneksi lalu coba lagi.' })
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEdit ? `Ubah pos ${initial?.name}` : 'Pos anggaran baru'} className="space-y-4">
      {events.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Untuk acara</legend>
          <div role="radiogroup" aria-label="Acara" className="mt-2 flex flex-wrap gap-2">
            {events.map((ev) => {
              const Icon = eventIcon(ev.icon)
              const active = ev.id === eventId
              return (
                <button
                  key={ev.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setEventId(ev.id)}
                  className={cn(
                    'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors',
                    active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {ev.name}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <TextField
          label="Nama pos"
          placeholder="Contoh: Make up"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
          maxLength={80}
        />
        <MoneyField id={amountId} label="Anggaran" value={amount} onChange={setAmount} error={errors.amount} />
      </div>

      {!isEdit && suggestions.length > 0 && (
        <div>
          <p className="text-sm text-ink-muted">{event ? `Yang umum untuk ${event.name}:` : 'Atau pilih yang umum:'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const Icon = posIcon(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setName(s)
                    if (/cadangan/i.test(s)) setIsReserve(true)
                    document.getElementById(amountId)?.focus()
                  }}
                  aria-pressed={name === s}
                  className={cn(
                    'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                    name === s ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <TextField
        label="Catatan pos"
        optional
        placeholder="Contoh: 7 nampan, warna sage & emas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={2000}
      />

      <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" checked={isReserve} onChange={(e) => setIsReserve(e.target.checked)} className="size-4 accent-primary" />
        Ini dana cadangan untuk keperluan mendadak
      </label>

      {errors.form && (
        <p role="alert" className="text-sm text-danger">
          {errors.form}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Batal
        </Button>
        <Button type="submit" loading={busy}>
          {isEdit ? 'Simpan perubahan' : 'Buat pos'}
        </Button>
      </div>
    </form>
  )
}
