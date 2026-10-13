import { useEffect, useState } from 'react'
import {
  DollarSign,
  ShoppingBag,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/Field'
import { CHECKLIST_EVENTS, type ChecklistEventKey, type ChecklistItem } from '@/lib/checklistTypes'
import type { TaskPriority, TaskStatus } from '@/lib/database.types'

type TaskModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: Partial<ChecklistItem>) => Promise<void>
  initialTask?: ChecklistItem | null
  defaultEvent?: ChecklistEventKey
}

const CATEGORY_SUGGESTIONS: Record<ChecklistEventKey, string[]> = {
  lamaran: [
    'Perencanaan Acara',
    'Pertemuan Keluarga',
    'Busana Calon Pengantin',
    'Cincin & Simbolis',
    'Seserahan Lamaran',
    'Konsumsi',
    'Dekorasi',
    'Dokumentasi',
    'Transportasi',
    'Rundown Acara',
  ],
  pernikahan: [
    'Akad Nikah',
    'Resepsi',
    'Venue & Gedung',
    'Catering',
    'Dekorasi',
    'Busana Pengantin',
    'Makeup Artist (MUA)',
    'Dokumentasi Foto & Video',
    'Undangan',
    'Mahar & Cincin',
    'Hiburan & MC',
    'Souvenir',
    'Koordinasi Vendor',
    'Transportasi & Akomodasi',
  ],
  adat: [
    'Slametan / Syukuran Pra-Nikah',
    'Pengajian Pra-Nikah',
    'Siraman / Ngebakan',
    'Midodareni / Malam Bainai',
    'Temu Manten / Saweran Sunda',
    'Tradisi Keluarga Lainnya',
  ],
  legalitas: [
    'Dokumen KUA Muslim (Standar)',
    'Dokumen Kondisional (Sesuai Situasi)',
    'Dokumen Operasional Vendor',
    'Legalitas Sipil / Gereja / Vihara',
  ],
  hari_h_pasca: [
    'Barang Bawaan Pengantin',
    'Pemeriksaan Perlengkapan',
    'Koordinasi Hari H',
    'Pengembalian & Pelunasan',
    'Apresiasi & Hadiah',
    'Administrasi Setelah Menikah',
  ],
}

export function TaskModal({ isOpen, onClose, onSave, initialTask, defaultEvent = 'pernikahan' }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [event, setEvent] = useState<ChecklistEventKey>(defaultEvent)
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [itemStatus, setItemStatus] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState('')
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)
  const [actualCost, setActualCost] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number | null>(null)
  const [unit, setUnit] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [vendorStoreName, setVendorStoreName] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title)
      setEvent((initialTask.event as ChecklistEventKey) || 'pernikahan')
      setCategory(initialTask.category || '')
      setSubcategory(initialTask.subcategory || '')
      setStatus(initialTask.status)
      setItemStatus(initialTask.item_status || '')
      setPriority(initialTask.priority)
      setDueDate(initialTask.due_date || '')
      setAssignee(initialTask.assignee || '')
      setEstimatedCost(initialTask.estimated_cost ?? null)
      setActualCost(initialTask.actual_cost ?? null)
      setQuantity(initialTask.quantity ?? null)
      setUnit(initialTask.unit || '')
      setProductUrl(initialTask.product_url || '')
      setVendorStoreName(initialTask.vendor_store_name || '')
      setNotes(initialTask.notes || '')
    } else {
      setTitle('')
      setEvent(defaultEvent)
      setCategory(CATEGORY_SUGGESTIONS[defaultEvent][0] || 'Umum')
      setSubcategory('')
      setStatus('todo')
      setItemStatus('')
      setPriority('medium')
      setDueDate('')
      setAssignee('')
      setEstimatedCost(null)
      setActualCost(null)
      setQuantity(null)
      setUnit('')
      setProductUrl('')
      setVendorStoreName('')
      setNotes('')
    }
    setError(null)
  }, [initialTask, defaultEvent, isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Nama tugas atau barang wajib diisi.')
      return
    }

    // URL validation if filled
    if (productUrl.trim()) {
      try {
        const parsed = new URL(productUrl.trim())
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          setError('URL produk harus diawali dengan http:// atau https://')
          return
        }
      } catch {
        setError('Format tautan produk tidak valid. Contoh: https://shopee.co.id/...')
        return
      }
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onSave({
        title: title.trim(),
        event,
        category: category.trim() || 'Lainnya',
        subcategory: subcategory.trim() || null,
        status,
        item_status: itemStatus.trim() || null,
        priority,
        due_date: dueDate.trim() || null,
        assignee: assignee.trim() || null,
        estimated_cost: estimatedCost,
        actual_cost: actualCost,
        quantity: quantity && quantity > 0 ? quantity : null,
        unit: unit.trim() || null,
        product_url: productUrl.trim() || null,
        vendor_store_name: vendorStoreName.trim() || null,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryOptions = CATEGORY_SUGGESTIONS[event] || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface border border-border shadow-pop p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-ink">
              {initialTask ? 'Edit Tugas & Rincian' : 'Tambah Tugas / Rincian Checklist'}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Catat nama pekerjaan, seserahan, anggaran, atau tautan referensi produk.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
            aria-label="Tutup"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger/30 bg-danger-soft p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Nama Tugas / Barang <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Beli Sepatu Heels Seserahan / Booking Katering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
            />
          </div>

          {/* Event & Category Row */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Rangkaian Acara (Event)</label>
              <select
                value={event}
                onChange={(e) => {
                  const nextEvent = e.target.value as ChecklistEventKey
                  setEvent(nextEvent)
                  setCategory(CATEGORY_SUGGESTIONS[nextEvent][0] || 'Umum')
                }}
                className="w-full h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none"
              >
                {(Object.keys(CHECKLIST_EVENTS) as ChecklistEventKey[]).map((evKey) => (
                  <option key={evKey} value={evKey}>
                    {CHECKLIST_EVENTS[evKey].shortTitle} ({CHECKLIST_EVENTS[evKey].title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Kategori</label>
              <div className="space-y-1">
                <input
                  list="category-suggestions"
                  type="text"
                  placeholder="Pilih atau ketik kategori..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
                <datalist id="category-suggestions">
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Subcategory & PIC */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Subkategori (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Skincare, Lauk Utama, Pakaian"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">PIC / Penanggung Jawab</label>
              <input
                type="text"
                placeholder="Contoh: Citra, Bayu, WO, Ibu"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Status, Priority & Deadline */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Status Pengerjaan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none"
              >
                <option value="todo">Belum Selesai</option>
                <option value="in_progress">Sedang Dikerjakan</option>
                <option value="done">Selesai</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none"
              >
                <option value="high">Tinggi (Mendesak)</option>
                <option value="medium">Sedang</option>
                <option value="low">Rendah</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Tenggat Waktu (Deadline)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION: Seserahan & Link Produk */}
          <div className="rounded-xl border border-border bg-surface-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider text-ink">
                Informasi Belanja, Seserahan & Link Produk
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Tautan / Link Produk (URL)</label>
                <input
                  type="url"
                  placeholder="https://shopee.co.id/... atau https://tokopedia.com/..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-xs text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Nama Toko / Vendor</label>
                <input
                  type="text"
                  placeholder="Contoh: Official Store / Pasar Baru"
                  value={vendorStoreName}
                  onChange={(e) => setVendorStoreName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-xs text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Jumlah</label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quantity ?? ''}
                  onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Satuan</label>
                <input
                  type="text"
                  placeholder="pcs, botol, pax, set"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Status Pembelian / Dokumen</label>
                <select
                  value={itemStatus}
                  onChange={(e) => setItemStatus(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-surface px-2.5 text-xs text-ink focus:border-primary focus:outline-none"
                >
                  <option value="">— Standar —</option>
                  <option value="belum_dicari">Belum Dicari</option>
                  <option value="sudah_dipilih">Sudah Dipilih</option>
                  <option value="sudah_dipesan">Sudah Dipesan</option>
                  <option value="sudah_dibeli">Sudah Dibeli</option>
                  <option value="siap">Siap / Terverifikasi</option>
                  <option value="perlu_revisi">Perlu Revisi</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION: Anggaran (Estimasi & Aktual) */}
          <div className="rounded-xl border border-border bg-surface-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-success" />
              <p className="text-xs font-bold uppercase tracking-wider text-ink">Pencatatan Anggaran</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MoneyField
                label="Estimasi Biaya"
                value={estimatedCost}
                onChange={setEstimatedCost}
                hint="Perkiraan harga sebelum transaksi"
              />
              <MoneyField
                label="Biaya Aktual"
                value={actualCost}
                onChange={setActualCost}
                hint="Pengeluaran riil setelah pembayaran"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Catatan Tambahan & Spesifikasi</label>
            <textarea
              rows={2}
              placeholder="Contoh: Warna sage green ukuran 38, bawa fotokopi saat ke KUA, dll."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {initialTask ? 'Simpan Perubahan' : 'Tambahkan Tugas'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
