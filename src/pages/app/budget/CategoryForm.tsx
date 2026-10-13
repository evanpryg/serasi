import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { MoneyField, TextField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import type { BudgetCategory } from '@/lib/database.types'
import type { CategoryInput } from '@/hooks/usePlanningData'

/** Pos yang umum dipakai pasangan Indonesia — satu ketukan untuk mengisi nama. */
const SUGGESTIONS = ['Seserahan', 'Mahar', 'Cincin', 'Souvenir', 'Undangan', 'Busana', 'Rias', 'Dokumentasi', 'Transportasi', 'Honeymoon']

type CategoryFormProps = {
  initial?: BudgetCategory
  existingNames?: string[]
  onSubmit: (input: CategoryInput) => Promise<void>
  onCancel: () => void
}

export function CategoryForm({ initial, existingNames = [], onSubmit, onCancel }: CategoryFormProps) {
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState<number | null>(initial?.planned_amount ?? null)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [isReserve, setIsReserve] = useState(initial?.is_reserve ?? false)
  const [errors, setErrors] = useState<{ name?: string; amount?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  const amountId = useId()

  const taken = new Set(existingNames.map((n) => n.toLowerCase()))
  const suggestions = SUGGESTIONS.filter((s) => !taken.has(s.toLowerCase()))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Beri nama pos, misalnya Seserahan.'
    if (amount == null) next.amount = 'Isi jatah uangnya. Boleh perkiraan dulu.'
    setErrors(next)
    if (next.name || next.amount) return

    setBusy(true)
    try {
      await onSubmit({ name: name.trim(), planned_amount: amount ?? 0, notes: notes.trim() || null, is_reserve: isReserve })
    } catch {
      setErrors({ form: 'Gagal menyimpan pos. Periksa koneksi lalu coba lagi.' })
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEdit ? `Ubah pos ${initial?.name}` : 'Pos anggaran baru'} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <TextField
          label="Nama pos"
          placeholder="Contoh: Seserahan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
          maxLength={80}
        />
        <MoneyField id={amountId} label="Jatah uang" value={amount} onChange={setAmount} error={errors.amount} />
      </div>

      {!isEdit && suggestions.length > 0 && (
        <div>
          <p className="text-sm text-ink-muted">Atau pilih yang umum:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setName(s)
                  document.getElementById(amountId)?.focus()
                }}
                aria-pressed={name === s}
                className={cn(
                  'min-h-10 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors',
                  name === s ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink',
                )}
              >
                {s}
              </button>
            ))}
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
