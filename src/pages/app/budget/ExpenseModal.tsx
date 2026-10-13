import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { BudgetCategory, Expense } from '@/lib/database.types'

type ExpenseModalProps = {
  isOpen: boolean
  onClose: () => void
  categories: BudgetCategory[]
  onSubmit: (input: {
    category_id: string
    title: string
    amount: number
    expense_date: string
    fund_source: string
    status: Expense['status']
  }) => Promise<void>
}

export function ExpenseModal({ isOpen, onClose, categories, onSubmit }: ExpenseModalProps) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [amountStr, setAmountStr] = useState('')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [fundSource, setFundSource] = useState('Tabungan Bersama')
  const [status, setStatus] = useState<Expense['status']>('paid')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError('Nama transaksi wajib diisi.')
      return
    }

    const cleanAmount = parseInt(amountStr.replace(/\D/g, ''), 10)
    if (!cleanAmount || cleanAmount <= 0) {
      setError('Nominal harus lebih dari 0.')
      return
    }

    if (!categoryId && categories.length > 0) {
      setError('Pilih pos kategori anggaran.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        category_id: categoryId || categories[0]?.id || 'c1',
        title: cleanTitle,
        amount: cleanAmount,
        expense_date: expenseDate,
        fund_source: fundSource,
        status,
      })
      onClose()
      setTitle('')
      setAmountStr('')
    } catch {
      setError('Gagal mencatat pengeluaran.')
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

        <h3 className="font-display text-xl font-bold text-ink">Catat Pengeluaran Baru</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Catat transaksi riil atau pembayaran tunai/transfer untuk memperbarui realisasi dana.
        </p>

        {error && (
          <div className="mt-3 rounded-xl bg-danger-soft p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink">Nama Transaksi / Keperluan</label>
            <input
              type="text"
              required
              placeholder="Contoh: DP Gedung Pernikahan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink">Pos Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink focus:border-primary focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Nominal (Rp)</label>
              <input
                type="text"
                required
                placeholder="Contoh: 5.000.000"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  setAmountStr(val ? parseInt(val, 10).toLocaleString('id-ID') : '')
                }}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink">Tanggal Pengeluaran</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Sumber Dana</label>
              <select
                value={fundSource}
                onChange={(e) => setFundSource(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
              >
                <option value="Tabungan Bersama">Tabungan Bersama</option>
                <option value="Tabungan Pria">Tabungan Pria</option>
                <option value="Tabungan Wanita">Tabungan Wanita</option>
                <option value="Bantuan Orang Tua">Bantuan Orang Tua</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink">Status Pembayaran</label>
            <div className="mt-1.5 flex gap-3">
              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="radio"
                  name="expense_status"
                  value="paid"
                  checked={status === 'paid'}
                  onChange={() => setStatus('paid')}
                  className="text-primary focus:ring-primary"
                />
                Sudah Dibayar (Lunas)
              </label>
              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="radio"
                  name="expense_status"
                  value="planned"
                  checked={status === 'planned'}
                  onChange={() => setStatus('planned')}
                  className="text-primary focus:ring-primary"
                />
                Masih Rencana
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2.5 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              Simpan Pengeluaran
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
