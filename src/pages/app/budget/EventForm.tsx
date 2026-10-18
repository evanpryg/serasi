import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { EVENT_ICONS, EVENT_SUGGESTIONS, eventIcon } from '@/lib/budgetIcons'
import type { BudgetEvent } from '@/lib/database.types'
import type { EventInput } from '@/hooks/usePlanningData'

type EventFormProps = {
  initial?: BudgetEvent
  existingNames?: string[]
  onSubmit: (input: EventInput) => Promise<void>
  onCancel: () => void
}

/** Form acara: nama, ikon (pilih dari daftar), tanggal opsional. */
export function EventForm({ initial, existingNames = [], onSubmit, onCancel }: EventFormProps) {
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? 'sparkles')
  const [date, setDate] = useState(initial?.event_date ?? '')
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const taken = new Set(existingNames.map((n) => n.toLowerCase()))
  const suggestions = EVENT_SUGGESTIONS.filter((s) => !taken.has(s.name.toLowerCase()))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) {
      setError('Beri nama acara, misalnya Lamaran.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await onSubmit({ name: clean, icon, event_date: date || null })
    } catch {
      setFormError('Gagal menyimpan acara. Periksa koneksi lalu coba lagi.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEdit ? `Ubah acara ${initial?.name}` : 'Acara baru'} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <TextField label="Nama acara" placeholder="Contoh: Lamaran" value={name} onChange={(e) => setName(e.target.value)} error={error ?? undefined} autoFocus maxLength={60} />
        <TextField label="Tanggal" optional type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {!isEdit && suggestions.length > 0 && (
        <div>
          <p className="text-sm text-ink-muted">Atau pilih yang umum:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const Icon = eventIcon(s.icon)
              const active = name === s.name
              return (
                <button
                  key={s.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setName(s.name)
                    setIcon(s.icon)
                  }}
                  className={cn(
                    'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                    active ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {s.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Ikon</legend>
        <div role="radiogroup" aria-label="Ikon acara" className="mt-2 grid max-w-sm grid-cols-6 gap-2">
          {EVENT_ICONS.map(({ key, label, icon: Icon }) => {
            const active = icon === key
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={label}
                title={label}
                onClick={() => setIcon(key)}
                className={cn(
                  'flex aspect-square min-h-11 cursor-pointer items-center justify-center rounded-xl border transition-colors',
                  active ? 'border-primary bg-primary text-on-primary shadow-sm' : 'border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </button>
            )
          })}
        </div>
      </fieldset>

      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Batal
        </Button>
        <Button type="submit" loading={busy}>
          {isEdit ? 'Simpan acara' : 'Tambah acara'}
        </Button>
      </div>
    </form>
  )
}
