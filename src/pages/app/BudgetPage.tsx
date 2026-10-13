import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useBudgetData } from '@/hooks/usePlanningData'
import { Card, CardHeader, Badge, ProgressBar } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { formatDate, formatRupiah, formatRupiahShort } from '@/lib/format'
import { percent } from '@/lib/finance'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { ExpenseModal } from './budget/ExpenseModal'
import { CategoryModal } from './budget/CategoryModal'

export function BudgetPage() {
  const wedding = useWedding()
  const { state, reload, createExpense, deleteExpense, createCategory } = useBudgetData(wedding.id)
  const isDemo = Boolean(getCurrentDemoAccount())
  const [activeTab, setActiveTab] = useState<'categories' | 'expenses' | 'payments'>('categories')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <header>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-2 h-5 w-80" />
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat data anggaran." onRetry={() => void reload()} />
  }

  const { categories, expenses, payments } = state.data

  // Perhitungan Keuangan
  const totalPaidExpenses = expenses.filter((e) => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0)
  const totalPaidPayments = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalRealized = totalPaidExpenses + totalPaidPayments
  const totalScheduledPayments = payments.filter((p) => p.status === 'scheduled').reduce((sum, p) => sum + p.amount, 0)
  const totalCommitted = totalRealized + totalScheduledPayments
  const remainingBudget = Math.max(0, wedding.budget_target - totalCommitted)
  const budgetUsagePercent = percent(totalCommitted, wedding.budget_target)

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[2.4rem] font-semibold leading-tight sm:text-5xl">Anggaran Pernikahan</h1>
            {isDemo && (
              <Badge tone="gold" className="self-center">
                Akun Demo Interaktif
              </Badge>
            )}
          </div>
          <p className="mt-1 text-ink-muted">
            Kelola alokasi pos anggaran, pantau pengeluaran riil, dan jadwal pembayaran termin vendor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setShowCategoryModal(true)}
            icon={<Plus className="size-4" />}
          >
            Tambah Pos Kategori
          </Button>
          <Button
            onClick={() => setShowExpenseModal(true)}
            icon={<Plus className="size-4" />}
          >
            Catat Pengeluaran
          </Button>
        </div>
      </header>

      {/* Ringkasan Finansial Card Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Target Anggaran */}
        <Card className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Target Anggaran</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <DollarSign className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">{formatRupiah(wedding.budget_target)}</p>
          <p className="mt-1 text-xs text-ink-subtle">
            Dana tersedia: <strong className="text-ink">{formatRupiah(wedding.available_funds)}</strong>
          </p>
        </Card>

        {/* Sudah Dibayarkan / Realisasi */}
        <Card className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Sudah Dibayar</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-success-soft text-success">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-success">{formatRupiah(totalRealized)}</p>
          <p className="mt-1 text-xs text-ink-subtle">
            {expenses.filter((e) => e.status === 'paid').length} pengeluaran + {payments.filter((p) => p.status === 'paid').length} termin vendor
          </p>
        </Card>

        {/* Komitmen Berjalan (Termasuk Terjadwal) */}
        <Card className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Total Terpakai & Komitmen</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-gold-soft text-gold-text">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">{formatRupiah(totalCommitted)}</p>
          <p className="mt-1 text-xs text-ink-subtle">
            Terjadwal: <strong className="text-ink">{formatRupiah(totalScheduledPayments)}</strong>
          </p>
        </Card>

        {/* Sisa Anggaran */}
        <Card className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Sisa Anggaran Aman</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
              <Wallet className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">{formatRupiah(remainingBudget)}</p>
          <p className="mt-1 text-xs text-ink-subtle">{100 - budgetUsagePercent}% sisa kuota anggaran</p>
        </Card>
      </div>

      {/* Progress Bar Anggaran */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">Realisasi & Komitmen Terhadap Target</p>
            <p className="text-sm text-ink-muted">
              {formatRupiah(totalCommitted)} dari {formatRupiah(wedding.budget_target)} ({budgetUsagePercent}%)
            </p>
          </div>
          <Badge tone={budgetUsagePercent > 95 ? 'danger' : budgetUsagePercent > 80 ? 'warning' : 'primary'}>
            {budgetUsagePercent > 100 ? 'Melebihi Target' : `${budgetUsagePercent}% Terpakai`}
          </Badge>
        </div>
        <div className="mt-4">
          <ProgressBar value={Math.min(100, budgetUsagePercent)} label="Persentase Anggaran" tone={budgetUsagePercent > 95 ? 'danger' : 'primary'} />
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`cursor-pointer border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Kategori Anggaran ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`cursor-pointer border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Pengeluaran Langsung ({expenses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`cursor-pointer border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Termin Pembayaran Vendor ({payments.length})
        </button>
      </div>

      {/* Tab 1: Kategori Anggaran */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              // Hitung pengeluaran terkait kategori ini
              const catExpenses = expenses
                .filter((e) => e.category_id === cat.id && e.status === 'paid')
                .reduce((s, e) => s + e.amount, 0)
              const catPercent = percent(catExpenses, cat.planned_amount)

              return (
                <Card key={cat.id} className="flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-ink">{cat.name}</h3>
                      {cat.is_reserve ? (
                        <Badge tone="gold">Dana Cadangan</Badge>
                      ) : (
                        <span className="text-xs font-semibold text-ink-muted">{catPercent}%</span>
                      )}
                    </div>
                    {cat.notes && <p className="mt-1 text-xs text-ink-muted line-clamp-2">{cat.notes}</p>}
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs text-ink-subtle">
                      <span>Terpakai: {formatRupiahShort(catExpenses)}</span>
                      <span>Rencana: {formatRupiahShort(cat.planned_amount)}</span>
                    </div>
                    <ProgressBar value={Math.min(100, catPercent)} label={cat.name} tone={catPercent > 100 ? 'danger' : 'primary'} />
                    <div className="flex justify-between pt-1 text-xs">
                      <span className="text-ink-muted">Sisa Kuota:</span>
                      <span className={`font-semibold ${cat.planned_amount - catExpenses < 0 ? 'text-danger' : 'text-ink'}`}>
                        {formatRupiah(cat.planned_amount - catExpenses)}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Pengeluaran Langsung */}
      {activeTab === 'expenses' && (
        <Card className="overflow-hidden">
          <CardHeader
            title="Daftar Pengeluaran Riil"
            description="Mencatat semua pengeluaran langsung dan DP yang sudah dibayar."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-xs font-semibold uppercase text-ink-muted">
                <tr>
                  <th className="px-5 py-3.5">Transaksi</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Sumber Dana</th>
                  <th className="px-5 py-3.5 text-right">Nominal</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-muted">
                      Belum ada transaksi pengeluaran.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => {
                    const cat = categories.find((c) => c.id === exp.category_id)
                    return (
                      <tr key={exp.id} className="transition-colors hover:bg-surface-muted/30">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-ink">{exp.title}</p>
                          {exp.notes && <p className="text-xs text-ink-muted">{exp.notes}</p>}
                        </td>
                        <td className="px-5 py-4 text-ink-muted">{cat?.name ?? 'Umum'}</td>
                        <td className="px-5 py-4 text-ink-muted">{exp.expense_date ? formatDate(exp.expense_date) : '—'}</td>
                        <td className="px-5 py-4 text-ink-muted">{exp.fund_source ?? '—'}</td>
                        <td className="px-5 py-4 text-right font-semibold text-ink tabular">{formatRupiah(exp.amount)}</td>
                        <td className="px-5 py-4 text-center">
                          <Badge tone={exp.status === 'paid' ? 'success' : exp.status === 'planned' ? 'warning' : 'neutral'}>
                            {exp.status === 'paid' ? 'Lunas' : exp.status === 'planned' ? 'Rencana' : 'Batal'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus pengeluaran "${exp.title}"?`)) {
                                void deleteExpense(exp.id)
                              }
                            }}
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-subtle hover:bg-danger-soft hover:text-danger transition-colors"
                            title="Hapus Pengeluaran"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Pembayaran Termin Vendor */}
      {activeTab === 'payments' && (
        <Card className="overflow-hidden">
          <CardHeader
            title="Jadwal Termin Pembayaran Vendor"
            description="Daftar kewajiban DP, termin berkala, dan pelunasan vendor."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-xs font-semibold uppercase text-ink-muted">
                <tr>
                  <th className="px-5 py-3.5">Keterangan</th>
                  <th className="px-5 py-3.5">Tipe</th>
                  <th className="px-5 py-3.5">Jatuh Tempo</th>
                  <th className="px-5 py-3.5">Sumber Dana</th>
                  <th className="px-5 py-3.5 text-right">Nominal</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-muted">
                      Belum ada jadwal pembayaran vendor.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-surface-muted/30">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink">{p.notes ?? 'Pembayaran Vendor'}</p>
                      </td>
                      <td className="px-5 py-4 uppercase text-xs font-semibold text-ink-muted">{p.payment_type}</td>
                      <td className="px-5 py-4 text-ink-muted">{p.due_date ? formatDate(p.due_date) : '—'}</td>
                      <td className="px-5 py-4 text-ink-muted">{p.fund_source ?? 'Tabungan Bersama'}</td>
                      <td className="px-5 py-4 text-right font-semibold text-ink tabular">{formatRupiah(p.amount)}</td>
                      <td className="px-5 py-4 text-center">
                        <Badge tone={p.status === 'paid' ? 'success' : p.status === 'scheduled' ? 'warning' : 'danger'}>
                          {p.status === 'paid' ? 'Lunas' : p.status === 'scheduled' ? 'Terjadwal' : 'Dibatalkan'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        categories={categories}
        onSubmit={async (data) => {
          await createExpense(data)
        }}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={async (data) => {
          await createCategory(data)
        }}
      />
    </div>
  )
}
