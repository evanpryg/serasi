import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type GuestModalProps = {
  isOpen: boolean
  onClose: () => void
  existingGroups: string[]
  onSubmit: (input: {
    name: string
    group_name: string
    guest_count: number
    notes?: string
  }) => Promise<void>
}

const DEFAULT_GROUPS = ['Keluarga Pria', 'Keluarga Wanita', 'Sahabat & Teman', 'Kolega Kantor', 'VIP', 'Tetangga']

export function GuestModal({ isOpen, onClose, existingGroups, onSubmit }: GuestModalProps) {
  const [name, setName] = useState('')
  const [group, setGroup] = useState('Keluarga Pria')
  const [customGroup, setCustomGroup] = useState('')
  const [isCustomGroup, setIsCustomGroup] = useState(false)
  const [guestCount, setGuestCount] = useState(2)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const allGroups = Array.from(new Set([...DEFAULT_GROUPS, ...existingGroups]))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanName = name.trim()
    if (!cleanName) {
      setError('Nama tamu atau keluarga wajib diisi.')
      return
    }

    const finalGroup = isCustomGroup ? customGroup.trim() : group
    if (!finalGroup) {
      setError('Kategori / kelompok undangan wajib dipilih.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name: cleanName,
        group_name: finalGroup,
        guest_count: Math.max(1, guestCount),
        notes: notes.trim() || undefined,
      })
      onClose()
      setName('')
      setCustomGroup('')
      setIsCustomGroup(false)
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan tamu.')
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

        <h3 className="font-display text-xl font-bold text-ink">Tambah tamu</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Catat nama tamu, kelompok keluarga/teman, dan perkiraan jumlah kursi (pax).
        </p>

        {error && (
          <div className="mt-3 rounded-xl bg-danger-soft p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink">Nama tamu</label>
            <input
              type="text"
              required
              placeholder="Contoh: Bpk. Bambang & Keluarga"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-ink">Kelompok</label>
              {!isCustomGroup ? (
                <select
                  value={group}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomGroup(true)
                    } else {
                      setGroup(e.target.value)
                    }
                  }}
                  className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
                >
                  {allGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  <option value="__custom__">+ Kelompok Baru...</option>
                </select>
              ) : (
                <div className="mt-1 flex gap-1">
                  <input
                    type="text"
                    required
                    placeholder="Nama kelompok"
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                    className="block w-full rounded-xl border border-border bg-canvas px-2.5 py-1.5 text-xs text-ink focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomGroup(false)}
                    className="rounded-lg bg-surface-muted px-2 text-xs text-ink-muted"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink">Berapa orang yang datang?</label>
              <input
                type="number"
                min={1}
                max={20}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 1)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs font-semibold text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink">Catatan, misalnya no. WA atau meja (opsional)</label>
            <input
              type="text"
              placeholder="Contoh: 0812-9999-8888 (Meja VIP A)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2 text-xs text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2.5 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              Simpan Tamu
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
