import { useId, useRef, useState } from 'react'
import { ChevronDown, Link2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MoneyField, TextField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/format'
import type { Expense } from '@/lib/database.types'
import type { ExpenseInput } from '@/hooks/usePlanningData'
import { normalizeLink } from './links'

type ItemFormProps = {
  /** Item yang diubah; kosong = tambah item baru. */
  initial?: Expense
  /** Sisa jatah pos sebelum item ini dihitung, untuk pratinjau "sisa setelah ini". */
  remainingBefore: number
  onSubmit: (input: ExpenseInput) => Promise<void>
  onCancel?: () => void
  autoFocus?: boolean
}

/**
 * Form item anggaran. Mode tambah: nama + harga cukup untuk menyimpan (Enter), link & catatan
 * opsional di bawahnya. Setelah tersimpan, kolom nama difokuskan lagi agar bisa langsung
 * menulis item berikutnya.
 */
export function ItemForm({ initial, remainingBefore, onSubmit, onCancel, autoFocus }: ItemFormProps) {
  const isEdit = Boolean(initial)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [amount, setAmount] = useState<number | null>(initial ? initial.amount : null)
  const [link, setLink] = useState(initial?.link_url ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [showExtra, setShowExtra] = useState(isEdit)
  const [errors, setErrors] = useState<{ title?: string; link?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const extraId = useId()

  const after = remainingBefore - (amount ?? 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanTitle = title.trim()
    const parsedLink = normalizeLink(link)
    const nextErrors: typeof errors = {}
    if (!cleanTitle) nextErrors.title = 'Tulis nama barang atau keperluannya.'
    if (!parsedLink.ok) {
      nextErrors.link = 'Tempel alamat web lengkap, misalnya shopee.co.id/nama-produk.'
      setShowExtra(true)
    }
    setErrors(nextErrors)
    if (nextErrors.title || nextErrors.link || !parsedLink.ok) return

    setBusy(true)
    try {
      await onSubmit({
        title: cleanTitle,
        amount: amount ?? 0,
        link_url: parsedLink.url,
        notes: notes.trim() || null,
      })
      if (!isEdit) {
        setTitle('')
        setAmount(null)
        setLink('')
        setNotes('')
        titleRef.current?.focus()
      }
    } catch {
      setErrors({ form: 'Gagal menyimpan. Periksa koneksi lalu coba lagi.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEdit ? `Ubah ${initial?.title}` : 'Tambah item'}
      className={cn('rounded-xl', isEdit ? 'bg-surface-muted/60 p-3 sm:p-4' : 'border border-dashed border-border-strong p-3 sm:p-4')}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <TextField
          ref={titleRef}
          label={isEdit ? 'Nama barang / keperluan' : 'Tambah item'}
          placeholder="Contoh: Skincare set, DP gedung"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          autoFocus={autoFocus}
          maxLength={120}
        />
        <MoneyField
          label="Harga"
          value={amount}
          onChange={setAmount}
          hint={amount ? undefined : 'Kosongkan jika belum tahu'}
        />
      </div>

      {amount != null && amount > 0 && (
        <p className={cn('mt-2 text-sm tabular', after < 0 ? 'font-semibold text-danger' : 'text-ink-muted')}>
          {after < 0 ? `Pos ini akan lebih ${formatRupiah(-after)}` : `Sisa pos setelah ini: ${formatRupiah(after)}`}
        </p>
      )}

      {showExtra && (
        <div id={extraId} className="mt-3 grid gap-3 sm:grid-cols-2">
          <TextField
            label="Link toko"
            optional
            inputMode="url"
            placeholder="Tempel link Shopee / Tokopedia / IG"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            error={errors.link}
          />
          <TextField
            label="Catatan"
            optional
            placeholder="Contoh: warna sage, ukuran 38"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
          />
        </div>
      )}

      {errors.form && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {errors.form}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {!isEdit && (
          <button
            type="button"
            onClick={() => setShowExtra((v) => !v)}
            aria-expanded={showExtra}
            aria-controls={extraId}
            className="mr-auto inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-primary hover:underline"
          >
            <Link2 className="size-4" aria-hidden />
            {showExtra ? 'Sembunyikan link & catatan' : 'Tambah link toko & catatan'}
            <ChevronDown className={cn('size-4 transition-transform', showExtra && 'rotate-180')} aria-hidden />
          </button>
        )}
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Batal
          </Button>
        )}
        <Button type="submit" loading={busy} icon={isEdit ? undefined : <Plus className="size-4" aria-hidden />}>
          {isEdit ? 'Simpan' : 'Tambah'}
        </Button>
      </div>
    </form>
  )
}
