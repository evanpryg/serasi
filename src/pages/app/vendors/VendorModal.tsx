import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { BudgetCategory, WeddingVendor } from '@/lib/database.types'

type VendorModalProps = {
  isOpen: boolean
  onClose: () => void
  categories: BudgetCategory[]
  onSubmit: (input: {
    custom_name: string
    vendor_category: string
    category_id?: string
    contract_amount?: number
    status: WeddingVendor['status']
    contact_note?: string
    service_scope?: string
    notes?: string
  }) => Promise<void>
}

const CATEGORY_OPTIONS = [
  { key: 'venue', label: 'Venue & Gedung' },
  { key: 'katering', label: 'Katering' },
  { key: 'dekorasi', label: 'Dekorasi & Ambience' },
  { key: 'foto_video', label: 'Foto & Video' },
  { key: 'mua', label: 'MUA & Busana' },
  { key: 'undangan', label: 'Undangan & Souvenir' },
  { key: 'hiburan', label: 'Musik & Hiburan' },
  { key: 'wedding_organizer', label: 'Wedding Organizer (WO)' },
  { key: 'lainnya', label: 'Vendor Lainnya' },
]

export function VendorModal({ isOpen, onClose, categories, onSubmit }: VendorModalProps) {
  const [name, setName] = useState('')
  const [categoryKey, setCategoryKey] = useState('katering')
  const [budgetCatId, setBudgetCatId] = useState(categories[0]?.id ?? '')
  const [amountStr, setAmountStr] = useState('')
  const [status, setStatus] = useState<WeddingVendor['status']>('kandidat')
  const [contactNote, setContactNote] = useState('')
  const [serviceScope, setServiceScope] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanName = name.trim()
    if (!cleanName) {
      setError('Nama vendor atau penyedia jasa wajib diisi.')
      return
    }

    const cleanAmount = amountStr ? parseInt(amountStr.replace(/\D/g, ''), 10) : undefined

    setSubmitting(true)
    try {
      await onSubmit({
        custom_name: cleanName,
        vendor_category: categoryKey,
        category_id: budgetCatId || undefined,
        contract_amount: cleanAmount,
        status,
        contact_note: contactNote.trim() || undefined,
        service_scope: serviceScope.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onClose()
      setName('')
      setAmountStr('')
      setContactNote('')
      setServiceScope('')
      setNotes('')
    } catch {
      setError('Gagal menambahkan vendor.')
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
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-pop sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
          aria-label="Tutup"
        >
          <X className="size-5" />
        </button>

        <h3 className="font-display text-xl font-bold text-ink">Tambah Vendor Baru</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Catat vendor kandidat, PIC kontak, atau vendor yang sudah deal/kontrak.
        </p>

        {error && (
          <div className="mt-3 rounded-xl bg-danger-soft p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink">Nama Vendor / Brand</label>
            <input
              type="text"
              required
              placeholder="Contoh: Plataran Catering & Events"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink">Kategori Layanan</label>
              <select
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink focus:border-primary focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Pos Anggaran Terkait</label>
              <select
                value={budgetCatId}
                onChange={(e) => setBudgetCatId(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink focus:border-primary focus:outline-none"
              >
                <option value="">Tidak Dikaitkan</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Status Kerjasama</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WeddingVendor['status'])}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink focus:border-primary focus:outline-none"
            >
              <option value="kandidat">Kandidat</option>
              <option value="dihubungi">Sudah Dihubungi</option>
              <option value="dipertimbangkan">Dipertimbangkan</option>
              <option value="dipilih">Dipilih (Deal / Kontrak)</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink">Nilai Kontrak / Penawaran (Rp)</label>
              <input
                type="text"
                placeholder="Contoh: 25.000.000"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  setAmountStr(val ? parseInt(val, 10).toLocaleString('id-ID') : '')
                }}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Kontak / No. WhatsApp</label>
              <input
                type="text"
                placeholder="Contoh: 0812-3456-7890 (Mbak Rini)"
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Ruang Lingkup Layanan (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Prasmanan 500 porsi + 3 stall makanan pondokan"
              value={serviceScope}
              onChange={(e) => setServiceScope(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2 text-xs text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Catatan Khusus (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Contoh: Termasuk bonus test food untuk 4 orang"
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
              Simpan Vendor
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
