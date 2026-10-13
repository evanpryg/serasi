import { useState } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, Plus, ReceiptText, Trash2, Wallet } from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useBudgetData } from '@/hooks/usePlanningData'
import { Card, Badge, ProgressBar } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ChipGroup, ConfirmDialog, HowTo, IconButton, PageHeader, Stat, useConfirm } from '@/components/ui/PageKit'
import { m } from '@/components/motion'
import { cn } from '@/lib/cn'
import { formatDate, formatRupiah, relativeDueLabel } from '@/lib/format'
import { calculateFinance } from '@/lib/finance'
import type { Expense, PaymentType } from '@/lib/database.types'
import { ExpenseModal } from './budget/ExpenseModal'
import { CategoryModal } from './budget/CategoryModal'

type Tab = 'categories' | 'expenses' | 'payments'

const PAYMENT_TYPE: Record<PaymentType, string> = {
  dp: 'DP',
  termin: 'Cicilan',
  pelunasan: 'Pelunasan',
  lainnya: 'Pembayaran',
}

const EXPENSE_STATUS: Record<Expense['status'], { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  paid: { label: 'Sudah dibayar', tone: 'success' },
  planned: { label: 'Belum dibayar', tone: 'warning' },
  cancelled: { label: 'Batal', tone: 'neutral' },
}

function ratio(part: number, whole: number) {
  return whole > 0 ? part / whole : 0
}

export function BudgetPage() {
  const wedding = useWedding()
  const { state, reload, createExpense, deleteExpense, createCategory } = useBudgetData(wedding.id)
  const [tab, setTab] = useState<Tab>('categories')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const confirm = useConfirm<Expense>()

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-44 rounded-card" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat data anggaran." onRetry={() => void reload()} />
  }

  const { categories, expenses, payments } = state.data
  // Rumus resmi (lib/finance) — sama dengan Dashboard, tanpa hitung ganda kontrak vs jadwal bayar.
  const fin = calculateFinance({ wedding, ...state.data })
  const total = fin.totalBudget > 0 ? fin.totalBudget : fin.budgetTarget
  const remaining = total - fin.actualSpent
  const paid = fin.actualSpent
  const upcoming = fin.outstandingBills + fin.plannedExpenses
  const used = paid + upcoming
  const over = remaining < 0
  const shortfall = fin.unallocatedFunds < 0 ? -fin.unallocatedFunds : 0
  const catSummary = new Map(fin.categories.map((c) => [c.id, c]))

  const scheduledPayments = payments.filter((p) => p.status === 'scheduled').sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
  const settledPayments = payments.filter((p) => p.status !== 'scheduled')

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Anggaran"
        description="Bagi uang pernikahan ke beberapa pos, lalu catat setiap uang yang keluar supaya tahu sisanya."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCategoryModal(true)} icon={<Plus className="size-4" aria-hidden />}>
              Tambah pos
            </Button>
            <Button onClick={() => setShowExpenseModal(true)} icon={<Plus className="size-4" aria-hidden />}>
              Catat pengeluaran
            </Button>
          </>
        }
      />

      <HowTo
        id="budget"
        steps={[
          <>Buat <strong className="text-ink">pos anggaran</strong> untuk tiap kebutuhan, misalnya Katering Rp 60 jt.</>,
          <>Setiap ada uang keluar, tekan <strong className="text-ink">Catat pengeluaran</strong> dan pilih posnya.</>,
          <>Lihat <strong className="text-ink">sisa anggaran</strong> di bawah. Warna merah berarti sudah melebihi jatah.</>,
        ]}
      />

      {/* Ringkasan: satu angka utama + bar bertumpuk */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-ink-muted">{over ? 'Anggaran terlampaui' : 'Sisa anggaran (belum dibayarkan)'}</p>
            <p className={cn('font-display text-4xl font-bold tabular sm:text-5xl', over ? 'text-danger' : 'text-ink')}>
              {over && '−'}
              {formatRupiah(Math.abs(remaining))}
            </p>
          </div>
          <p className="text-sm text-ink-muted">
            dari total anggaran <strong className="text-ink tabular">{formatRupiah(total)}</strong>
          </p>
        </div>

        <div
          role="img"
          aria-label={`Sudah dibayar ${formatRupiah(paid)}, akan dibayar ${formatRupiah(upcoming)}, dari total ${formatRupiah(total)}`}
          className="relative mt-5 h-3 overflow-hidden rounded-full bg-surface-muted"
        >
          <m.div
            className={cn('absolute inset-y-0 left-0 w-full origin-left rounded-full', over ? 'bg-danger/40' : 'bg-gold')}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.min(1, ratio(used, total)) }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          <m.div
            className={cn('absolute inset-y-0 left-0 w-full origin-left rounded-full', over ? 'bg-danger' : 'bg-primary')}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.min(1, ratio(paid, total)) }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {!over && used > total && (
          <p className="mt-3 flex items-start gap-2 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Jika semua tagihan dibayar, anggaran akan lebih {formatRupiah(used - total)}.
          </p>
        )}

        <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
          <Stat
            label="Sudah dibayar"
            icon={<span className="size-2.5 rounded-full bg-primary" aria-hidden />}
            value={formatRupiah(paid)}
            hint="Uang yang benar-benar sudah keluar"
          />
          <Stat
            label="Akan dibayar"
            icon={<span className="size-2.5 rounded-full bg-gold" aria-hidden />}
            value={formatRupiah(upcoming)}
            hint="Sisa tagihan vendor & pengeluaran rencana"
          />
          <Stat
            label="Uang yang masih ada"
            icon={<Wallet className="size-3.5" aria-hidden />}
            value={formatRupiah(fin.cashOnHand)}
            hint={
              shortfall > 0 ? (
                <span className="text-warning">Kurang {formatRupiah(shortfall)} untuk melunasi semua tagihan</span>
              ) : (
                'Cukup untuk semua tagihan yang akan datang'
              )
            }
          />
        </dl>
      </Card>

      <ChipGroup<Tab>
        label="Pilih tampilan"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'categories', label: 'Pos anggaran', count: categories.length },
          { value: 'expenses', label: 'Pengeluaran', count: expenses.length },
          { value: 'payments', label: 'Jadwal bayar vendor', count: payments.length },
        ]}
      />

      {tab === 'categories' &&
        (categories.length === 0 ? (
          <EmptyState
            icon={<Wallet className="size-7" aria-hidden />}
            title="Belum ada pos anggaran"
            description="Pos anggaran adalah jatah uang untuk tiap kebutuhan, misalnya venue, katering, atau busana."
            action={
              <Button onClick={() => setShowCategoryModal(true)} icon={<Plus className="size-4" aria-hidden />}>
                Tambah pos pertama
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const sum = catSummary.get(cat.id)
              const spent = sum?.actual ?? 0
              const pending = (sum?.committed ?? 0) - spent
              const left = cat.planned_amount - (sum?.committed ?? 0)
              const pct = Math.round(ratio(sum?.committed ?? 0, cat.planned_amount) * 100)
              const status =
                left < 0
                  ? { label: 'Melebihi jatah', tone: 'danger' as const }
                  : pct >= 80
                    ? { label: 'Hampir habis', tone: 'warning' as const }
                    : { label: 'Aman', tone: 'success' as const }
              return (
                <Card key={cat.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink">{cat.name}</h3>
                    {cat.is_reserve ? <Badge tone="gold">Dana cadangan</Badge> : <Badge tone={status.tone}>{status.label}</Badge>}
                  </div>
                  {cat.notes && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{cat.notes}</p>}
                  <div className="mt-auto pt-5">
                    <p className="text-sm text-ink-muted">
                      <strong className="text-ink tabular">{formatRupiah(spent)}</strong> dibayar dari{' '}
                      <span className="tabular">{formatRupiah(cat.planned_amount)}</span>
                    </p>
                    {pending > 0 && <p className="text-xs text-ink-subtle tabular">+ {formatRupiah(pending)} akan dibayar</p>}
                    <div className="mt-2">
                      <ProgressBar value={Math.min(100, pct)} label={`Pemakaian ${cat.name}`} tone={left < 0 ? 'danger' : 'primary'} />
                    </div>
                    <p className={cn('mt-2 flex items-center gap-1 text-sm font-semibold tabular', left < 0 ? 'text-danger' : 'text-ink')}>
                      {left < 0 && <AlertTriangle className="size-4" aria-hidden />}
                      {left < 0 ? `Lebih ${formatRupiah(-left)}` : `Sisa ${formatRupiah(left)}`}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        ))}

      {tab === 'expenses' &&
        (expenses.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="size-7" aria-hidden />}
            title="Belum ada pengeluaran"
            description="Catat setiap pembayaran, misalnya DP gedung atau beli seserahan, supaya sisa anggaran selalu akurat."
            action={
              <Button onClick={() => setShowExpenseModal(true)} icon={<Plus className="size-4" aria-hidden />}>
                Catat pengeluaran
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border">
              {expenses.map((exp) => {
                const cat = categories.find((c) => c.id === exp.category_id)
                const st = EXPENSE_STATUS[exp.status]
                return (
                  <li key={exp.id} className="flex items-start gap-3 p-4 sm:items-center sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{exp.title}</p>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {[cat?.name ?? 'Tanpa pos', exp.expense_date && formatDate(exp.expense_date), exp.fund_source].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <span className="font-semibold text-ink tabular">{formatRupiah(exp.amount)}</span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <IconButton label={`Hapus ${exp.title}`} tone="danger" onClick={() => confirm.ask(exp)}>
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}

      {tab === 'payments' &&
        (payments.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="size-7" aria-hidden />}
            title="Belum ada jadwal bayar vendor"
            description="DP, cicilan, dan pelunasan vendor akan muncul di sini beserta tanggal jatuh temponya."
          />
        ) : (
          <div className="space-y-6">
            <PaymentGroup title="Belum dibayar" empty="Tidak ada tagihan yang menunggu. Semua sudah beres.">
              {scheduledPayments.map((p) => {
                const late = p.due_date ? relativeDueLabel(p.due_date).startsWith('Terlambat') : false
                return (
                  <PaymentRow
                    key={p.id}
                    title={p.notes ?? 'Pembayaran vendor'}
                    type={PAYMENT_TYPE[p.payment_type]}
                    amount={p.amount}
                    meta={p.due_date ? `Jatuh tempo ${formatDate(p.due_date)}` : 'Tanggal belum ditentukan'}
                    badge={
                      p.due_date ? (
                        <Badge tone={late ? 'danger' : 'warning'}>
                          <CalendarClock className="size-3" aria-hidden />
                          {relativeDueLabel(p.due_date)}
                        </Badge>
                      ) : null
                    }
                  />
                )
              })}
            </PaymentGroup>
            {settledPayments.length > 0 && (
              <PaymentGroup title="Sudah selesai">
                {settledPayments.map((p) => (
                  <PaymentRow
                    key={p.id}
                    title={p.notes ?? 'Pembayaran vendor'}
                    type={PAYMENT_TYPE[p.payment_type]}
                    amount={p.amount}
                    meta={p.payment_date ? `Dibayar ${formatDate(p.payment_date)}` : p.fund_source ?? ''}
                    badge={
                      p.status === 'paid' ? (
                        <Badge tone="success">
                          <CheckCircle2 className="size-3" aria-hidden />
                          Lunas
                        </Badge>
                      ) : (
                        <Badge>Dibatalkan</Badge>
                      )
                    }
                  />
                ))}
              </PaymentGroup>
            )}
          </div>
        ))}

      <ExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} categories={categories} onSubmit={createExpense} />
      <CategoryModal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSubmit={createCategory} />
      <ConfirmDialog
        open={confirm.target != null}
        title="Hapus pengeluaran ini?"
        message={
          <>
            <strong className="text-ink">{confirm.target?.title}</strong> ({formatRupiah(confirm.target?.amount ?? 0)}) akan dihapus dan sisa
            anggaran dihitung ulang.
          </>
        }
        onConfirm={() => (confirm.target ? deleteExpense(confirm.target.id) : undefined)}
        onClose={confirm.close}
      />
    </div>
  )
}

function PaymentGroup({ title, empty, children }: { title: string; empty?: string; children: React.ReactNode[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      {children.length === 0 ? (
        <p className="rounded-card border border-dashed border-border-strong p-5 text-sm text-ink-muted">{empty}</p>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">{children}</ul>
        </Card>
      )}
    </section>
  )
}

function PaymentRow({ title, type, amount, meta, badge }: { title: string; type: string; amount: number; meta: string; badge: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 p-4 sm:items-center sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">
          <span className="mr-2 rounded-md bg-surface-muted px-1.5 py-0.5 text-xs font-semibold text-ink-muted">{type}</span>
          {title}
        </p>
        {meta && <p className="mt-0.5 text-sm text-ink-muted">{meta}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
        <span className="font-semibold text-ink tabular">{formatRupiah(amount)}</span>
        {badge}
      </div>
    </li>
  )
}
