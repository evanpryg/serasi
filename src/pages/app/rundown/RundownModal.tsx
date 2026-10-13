import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type RundownModalProps = {
  isOpen: boolean
  onClose: () => void
  weddingDateStr: string | null
  onSubmit: (input: {
    title: string
    starts_at?: string
    ends_at?: string
    location?: string
    person_in_charge?: string
    notes?: string
  }) => Promise<void>
}

export function RundownModal({ isOpen, onClose, weddingDateStr, onSubmit }: RundownModalProps) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [location, setLocation] = useState('')
  const [pic, setPic] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const baseDate = weddingDateStr || new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError('Nama atau judul sesi acara wajib diisi.')
      return
    }

    const startIso = startTime ? `${baseDate}T${startTime}:00+07:00` : undefined
    const endIso = endTime ? `${baseDate}T${endTime}:00+07:00` : undefined

    setSubmitting(true)
    try {
      await onSubmit({
        title: cleanTitle,
        starts_at: startIso,
        ends_at: endIso,
        location: location.trim() || undefined,
        person_in_charge: pic.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onClose()
      setTitle('')
      setLocation('')
      setPic('')
      setNotes('')
    } catch {
      setError('Gagal menambahkan sesi rundown.')
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

        <h3 className="font-display text-xl font-bold text-ink">Tambah Sesi Rundown Acara</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Susun alur jadwal acara per sesi, jam pelaksanaan, penanggung jawab (PIC), dan lokasinya.
        </p>

        {error && (
          <div className="mt-3 rounded-xl bg-danger-soft p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink">Nama Sesi Acara</label>
            <input
              type="text"
              required
              placeholder="Contoh: Prosesi Kirab & Pembukaan Resepsi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink">Jam Mulai (WIB)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Jam Selesai (WIB)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink">Lokasi / Ruangan</label>
              <input
                type="text"
                placeholder="Contoh: Main Ballroom"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">PIC / Koordinator</label>
              <input
                type="text"
                placeholder="Contoh: MC & Tim WO"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Catatan / Detail Kegiatan (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Contoh: Pengantin masuk diiringi musik gamelan/lagu romantis"
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
              Simpan Sesi Acara
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
