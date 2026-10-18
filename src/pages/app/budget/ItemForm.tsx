import { useId, useRef, useState } from 'react'
import { ChevronDown, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MoneyField, TextField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/format'
import type { Expense } from '@/lib/database.types'
import type { ExpenseInput } from '@/hooks/usePlanningData'
import { normalizeLink } from './links'
import { PhotoPicker } from './ItemPhoto'

/**
 * Patch realisasi: `actual_amount` hanya dikirim bila berbeda dari harga (atau perlu dikosongkan),
 * sehingga item tetap bisa disimpan sebelum migration 000012 dijalankan.
 */
export function actualPatch(item: Pick<Expense, 'actual_amount'>, amount: number, actual: number | null): Pick<ExpenseInput, 'actual_amount'> {
  if (actual != null && actual !== amount) return { actual_amount: actual }
  return item.actual_amount != null ? { actual_amount: null } : {}
}

type ItemFormProps = {
  /** Item yang diubah; kosong = tambah item baru. */
  initial?: Expense
  /** Sisa jatah pos sebelum item ini dihitung, untuk pratinjau "sisa setelah ini". */
  remainingBefore: number
  onSubmit: (input: ExpenseInput) => Promise<void>
  /** Unggah foto dan kembalikan path-nya (lib/itemPhoto). */
  uploadPhoto: (file: File) => Promise<string>
  onCancel: () => void
  autoFocus?: boolean
}

/**
 * Form item anggaran. Nama + harga cukup untuk menyimpan (Enter); foto, link toko, dan catatan
 * opsional. Mode tambah: setelah tersimpan form dikosongkan dan fokus kembali ke nama
 * agar bisa langsung menulis item berikutnya. "Selesai" menutup form.
 */
export function ItemForm({ initial, remainingBefore, onSubmit, uploadPhoto, onCancel, autoFocus }: ItemFormProps) {
  const isEdit = Boolean(initial)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [amount, setAmount] = useState<number | null>(initial ? initial.amount : null)
  const isPaid = initial?.status === 'paid'
  const [actual, setActual] = useState<number | null>(isPaid ? (initial?.actual_amount ?? initial?.amount ?? null) : null)
  const [paidDate, setPaidDate] = useState(initial?.expense_date ?? '')
  const [link, setLink] = useState(initial?.link_url ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showExtra, setShowExtra] = useState(Boolean(initial?.link_url || initial?.notes))
  const [errors, setErrors] = useState<{ title?: string; link?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
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
      let proof_path: string | null | undefined
      if (photo) proof_path = await uploadPhoto(photo)
      else if (photoRemoved) proof_path = null
      await onSubmit({
        title: cleanTitle,
        amount: amount ?? 0,
        link_url: parsedLink.url,
        notes: notes.trim() || null,
        ...(proof_path !== undefined && { proof_path }),
        ...(isPaid && initial && { ...actualPatch(initial, amount ?? 0, actual), ...(paidDate && { expense_date: paidDate }) }),
      })
      if (!isEdit) {
        setTitle('')
        setAmount(null)
        setLink('')
        setNotes('')
        setPhoto(null)
        setSavedCount((n) => n + 1)
        titleRef.current?.focus()
      }
    } catch (err) {
      const message = err instanceof Error && err.message.startsWith('Ukuran') ? err.message : 'Gagal menyimpan. Periksa koneksi lalu coba lagi.'
      setErrors({ form: message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEdit ? `Ubah ${initial?.title}` : 'Tambah item'}
      className="animate-fade-up rounded-xl bg-surface-muted/70 p-3 sm:p-4"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <TextField
          ref={titleRef}
          label="Nama barang / keperluan"
          placeholder="Contoh: Skincare set"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          autoFocus={autoFocus}
          maxLength={120}
        />
        <MoneyField label={isPaid ? 'Harga rencana' : 'Harga'} value={amount} onChange={setAmount} />
      </div>

      {isPaid && (
        <div className="mt-3 grid gap-3 rounded-xl border border-success/25 bg-success-soft/50 p-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <MoneyField label="Dibayar (aktual)" hint="Nominal yang benar-benar keluar." value={actual} onChange={setActual} />
          <TextField label="Tanggal bayar" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
        </div>
      )}

      {!isPaid && amount != null && amount > 0 && (
        <p className={cn('mt-2 text-sm tabular', after < 0 ? 'font-semibold text-danger' : 'text-ink-muted')}>
          {after < 0 ? `Pos ini akan lebih ${formatRupiah(-after)}` : `Sisa pos setelah ini: ${formatRupiah(after)}`}
        </p>
      )}

      <div className="mt-3">
        <PhotoPicker
          current={initial?.proof_path ?? null}
          file={photo}
          removed={photoRemoved}
          onPick={(f) => {
            setPhoto(f)
            setPhotoRemoved(false)
          }}
          onRemove={() => {
            setPhoto(null)
            setPhotoRemoved(true)
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowExtra((v) => !v)}
        aria-expanded={showExtra}
        aria-controls={extraId}
        className="mt-2 inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg text-sm font-semibold text-primary hover:underline"
      >
        <Link2 className="size-4" aria-hidden />
        Link toko & catatan
        <ChevronDown className={cn('size-4 transition-transform', showExtra && 'rotate-180')} aria-hidden />
      </button>

      {showExtra && (
        <div id={extraId} className="mt-1 grid gap-3 sm:grid-cols-2">
          <TextField
            label="Link toko"
            optional
            inputMode="url"
            placeholder="Tempel link Shopee / Tokopedia"
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

      <div className="mt-3 flex items-center justify-end gap-2">
        {!isEdit && savedCount > 0 && (
          <p role="status" className="mr-auto text-sm text-success">
            {savedCount} item tersimpan
          </p>
        )}
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          {isEdit ? 'Batal' : savedCount > 0 ? 'Selesai' : 'Batal'}
        </Button>
        <Button type="submit" loading={busy}>
          {isEdit ? 'Simpan' : 'Simpan item'}
        </Button>
      </div>
    </form>
  )
}
