import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type CategoryModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: {
    name: string
    planned_amount: number
    notes?: string
    is_reserve?: boolean
  }) => Promise<void>
}

export function CategoryModal({ isOpen, onClose, onSubmit }: CategoryModalProps) {
  const [name, setName] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [notes, setNotes] = useState('')
  const [isReserve, setIsReserve] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanName = name.trim()
    if (!cleanName) {
      setError('Nama kategori pos anggaran wajib diisi.')
      return
    }

    const cleanAmount = parseInt(amountStr.replace(/\D/g, ''), 10)
    if (!cleanAmount || cleanAmount <= 0) {
      setError('Rencana anggaran harus lebih dari 0.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name: cleanName,
        planned_amount: cleanAmount,
        notes: notes.trim() || undefined,
        is_reserve: isReserve,
      })
      onClose()
      setName('')
      setAmountStr('')
      setNotes('')
      setIsReserve(false)
    } catch {
      setError('Gagal menambah kategori anggaran.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-pop sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
          aria-label="Tutup"
        >
          <X className="size-5" />
        </button>

        <h3 className="font-display text-xl font-bold text-ink">Tambah Pos Kategori Baru</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Buat pos anggaran baru untuk memisahkan alokasi dana kebutuhan pernikahan.
        </p>

        {error && (
          <div className="mt-3 rounded-xl bg-danger-soft p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink">Nama Pos Kategori</label>
            <input
              type="text"
              required
              placeholder="Contoh: Souvenir & Hantaran"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Rencana Alokasi Anggaran (Rp)</label>
            <input
              type="text"
              required
              placeholder="Contoh: 10.000.000"
              value={amountStr}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setAmountStr(val ? parseInt(val, 10).toLocaleString('id-ID') : '')
              }}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Catatan Pos (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Contoh: Target 500 pcs souvenir + kemasan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2 text-xs text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={isReserve}
                onChange={(e) => setIsReserve(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              Tandai sebagai Pos Dana Cadangan / Darurat
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2.5 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              Simpan Pos Kategori
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
