import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, CalendarClock, CheckCircle2, Plus, Wallet } from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useBudgetData } from '@/hooks/usePlanningData'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog, HowTo, PageHeader, Stat, useConfirm } from '@/components/ui/PageKit'
import { m } from '@/components/motion'
import { cn } from '@/lib/cn'
import { formatDate, formatRupiah, relativeDueLabel } from '@/lib/format'
import { calculateFinance } from '@/lib/finance'
import type { BudgetCategory, Expense, PaymentType } from '@/lib/database.types'
import { CategoryCard, type VendorLine } from './budget/CategoryCard'
import { CategoryForm } from './budget/CategoryForm'

const PAYMENT_TYPE: Record<PaymentType, string> = {
  dp: 'DP',
  termin: 'Cicilan',
  pelunasan: 'Pelunasan',
  lainnya: 'Pembayaran',
}

function ratio(part: number, whole: number) {
  return whole > 0 ? part / whole : 0
}

/** Pos yang terbuka disimpan di hash (#pos-<id>) agar bisa dibagikan/dibuka langsung. */
function openFromHash(): Set<string> {
  const match = window.location.hash.match(/^#pos-(.+)$/)
  return new Set(match?.[1] ? [match[1]] : [])
}

export function BudgetPage() {
  const wedding = useWedding()
  const { state, reload, createExpense, updateExpense, deleteExpense, createCategory, updateCategory, deleteCategory } = useBudgetData(wedding.id)
  const [open, setOpen] = useState<Set<string>>(openFromHash)
  const [adding, setAdding] = useState(false)
  const [justCreated, setJustCreated] = useState<string | null>(null)
  const confirmItem = useConfirm<Expense>()
  const confirmPos = useConfirm<BudgetCategory>()
  const addRef = useRef<HTMLDivElement>(null)

  // Gulir ke pos yang dibuka lewat tautan setelah data termuat.
  const ready = state.status === 'ready'
  useEffect(() => {
    if (!ready) return
    const id = [...openFromHash()][0]
    if (id) document.getElementById(`pos-${id}`)?.scrollIntoView({ block: 'start' })
  }, [ready])

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      const hash = next.has(id) ? `#pos-${id}` : ''
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`)
      return next
    })
  }

  function startAdding() {
    setAdding(true)
    requestAnimationFrame(() => addRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-44 rounded-card" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat data anggaran." onRetry={() => void reload()} />
  }

  const { expenses, payments, vendors } = state.data
  const categories = state.data.categories.filter((c) => !c.is_archived)
  // Rumus resmi (lib/finance) — sama dengan Dashboard, tanpa hitung ganda kontrak vs jadwal bayar.
  const fin = calculateFinance({ wedding, ...state.data })
  const total = fin.totalBudget > 0 ? fin.totalBudget : fin.budgetTarget
  const paid = fin.actualSpent
  const upcoming = fin.outstandingBills + fin.plannedExpenses
  const used = paid + upcoming
  // Angka utama sama dengan Dashboard (total − yang sudah dibayar); sisa setelah rencana ditampilkan di bawahnya.
  const remaining = total - paid
  const afterPlans = total - used
  const over = remaining < 0
  const shortfall = fin.unallocatedFunds < 0 ? -fin.unallocatedFunds : 0
  const catSummary = new Map(fin.categories.map((c) => [c.id, c]))

  // Kontrak vendor per pos (hanya dibaca; dikelola di halaman Vendor).
  const paidByVendor = new Map<string, number>()
  const scheduledByVendor = new Map<string, number>()
  for (const p of payments) {
    if (!p.wedding_vendor_id) continue
    const map = p.status === 'paid' ? paidByVendor : p.status === 'scheduled' ? scheduledByVendor : null
    map?.set(p.wedding_vendor_id, (map.get(p.wedding_vendor_id) ?? 0) + p.amount)
  }
  const vendorLines = (catId: string): VendorLine[] =>
    vendors
      .filter((v) => v.category_id === catId && v.status !== 'dibatalkan')
      .map((v) => {
        const vPaid = paidByVendor.get(v.id) ?? 0
        const outstanding =
          v.status === 'dipilih' && v.contract_amount != null ? Math.max(v.contract_amount - vPaid, 0) : (scheduledByVendor.get(v.id) ?? 0)
        return { id: v.id, name: v.custom_name ?? 'Vendor tanpa nama', contract: v.contract_amount ?? 0, paid: vPaid, outstanding }
      })
      .filter((v) => v.paid > 0 || v.outstanding > 0)

  const scheduledPayments = payments.filter((p) => p.status === 'scheduled').sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
  const settledPayments = payments.filter((p) => p.status !== 'scheduled')

  const posForm = (
    <div ref={addRef} className="scroll-mt-24">
    <Card className="p-4 sm:p-5">
      <h2 className="mb-3 font-semibold text-ink">Pos anggaran baru</h2>
      <CategoryForm
        existingNames={categories.map((c) => c.name)}
        onSubmit={async (input) => {
          const id = await createCategory(input)
          setAdding(false)
          setJustCreated(id)
          setOpen((prev) => new Set(prev).add(id))
          requestAnimationFrame(() => document.getElementById(`pos-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        }}
        onCancel={() => setAdding(false)}
      />
    </Card>
    </div>
  )

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Anggaran"
        description="Bagi uang ke beberapa pos, lalu tulis rincian belanjanya di dalam pos. Sisa uang dihitung otomatis."
        actions={
          <Button onClick={startAdding} icon={<Plus className="size-4" aria-hidden />}>
            Tambah pos
          </Button>
        }
      />

      <HowTo
        id="budget-v2"
        steps={[
          <>Buat <strong className="text-ink">pos</strong> beserta jatahnya, misalnya Seserahan Rp 5 jt.</>,
          <>Buka posnya, tulis <strong className="text-ink">barang yang mau dibeli</strong>, harga, dan link tokonya.</>,
          <><strong className="text-ink">Centang</strong> item yang sudah dibayar. Sisa uang pos langsung diperbarui.</>,
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
          aria-label={`Sudah dibayar ${formatRupiah(paid)}, belum dibayar ${formatRupiah(upcoming)}, dari total ${formatRupiah(total)}`}
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

        {!over && upcoming > 0 && (
          <p className={cn('mt-3 flex items-start gap-2 text-sm', afterPlans < 0 ? 'text-danger' : 'text-ink-muted')}>
            {afterPlans < 0 && <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />}
            {afterPlans < 0 ? (
              <span>
                Jika semua rencana dibayar, anggaran akan lebih <strong className="tabular">{formatRupiah(-afterPlans)}</strong>. Kurangi rincian atau
                naikkan jatah pos.
              </span>
            ) : (
              <span>
                Setelah semua rencana dibayar, sisanya <strong className="text-ink tabular">{formatRupiah(afterPlans)}</strong>.
              </span>
            )}
          </p>
        )}

        <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
          <Stat
            label="Sudah dibayar"
            icon={<span className="size-2.5 rounded-full bg-primary" aria-hidden />}
            value={formatRupiah(paid)}
            hint="Item yang sudah dicentang & pembayaran vendor"
          />
          <Stat
            label="Belum dibayar"
            icon={<span className="size-2.5 rounded-full bg-gold" aria-hidden />}
            value={formatRupiah(upcoming)}
            hint="Rencana belanja & sisa tagihan vendor"
          />
          <Stat
            label="Uang yang masih ada"
            icon={<Wallet className="size-3.5" aria-hidden />}
            value={formatRupiah(fin.cashOnHand)}
            hint={
              shortfall > 0 ? (
                <span className="text-warning">Kurang {formatRupiah(shortfall)} untuk membayar semua rencana</span>
              ) : (
                'Cukup untuk semua yang belum dibayar'
              )
            }
          />
        </dl>
      </Card>

      <section aria-labelledby="pos-heading" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="pos-heading" className="font-display text-2xl font-semibold text-ink">
              Pos anggaran
            </h2>
            <p className="text-sm text-ink-muted">Ketuk pos untuk melihat dan menambah rinciannya.</p>
          </div>
          {categories.length > 0 && !adding && (
            <Button variant="secondary" size="sm" onClick={startAdding} icon={<Plus className="size-4" aria-hidden />}>
              Pos baru
            </Button>
          )}
        </div>

        {categories.length === 0 && !adding ? (
          <EmptyState
            icon={<Wallet className="size-7" aria-hidden />}
            title="Belum ada pos anggaran"
            description="Pos adalah jatah uang untuk tiap kebutuhan, misalnya Seserahan Rp 5 jt. Di dalamnya kamu bisa menulis barang apa saja yang mau dibeli."
            action={
              <Button onClick={startAdding} icon={<Plus className="size-4" aria-hidden />}>
                Buat pos pertama
              </Button>
            }
          />
        ) : (
          <>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                summary={catSummary.get(cat.id)}
                items={expenses.filter((e) => e.category_id === cat.id).sort((a, b) => a.created_at.localeCompare(b.created_at))}
                vendors={vendorLines(cat.id)}
                open={open.has(cat.id)}
                focusAddItem={justCreated === cat.id}
                onToggle={() => toggle(cat.id)}
                onAddItem={(input) => createExpense({ ...input, category_id: cat.id })}
                onUpdateItem={updateExpense}
                onAskDeleteItem={confirmItem.ask}
                onUpdateCategory={(input) => updateCategory(cat.id, input)}
                onAskDeleteCategory={() => confirmPos.ask(cat)}
              />
            ))}
            {adding && posForm}
          </>
        )}
      </section>

      {payments.length > 0 && (
        <section aria-labelledby="bayar-heading" className="space-y-4">
          <div>
            <h2 id="bayar-heading" className="font-display text-2xl font-semibold text-ink">
              Jadwal bayar vendor
            </h2>
            <p className="text-sm text-ink-muted">
              DP, cicilan, dan pelunasan vendor. Diatur dari{' '}
              <Link to="/app/vendors" className="font-semibold text-primary underline-offset-2 hover:underline">
                halaman Vendor
              </Link>
              .
            </p>
          </div>
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
        </section>
      )}

      <ConfirmDialog
        open={confirmItem.target != null}
        title="Hapus item ini?"
        message={
          <>
            <strong className="text-ink">{confirmItem.target?.title}</strong> ({formatRupiah(confirmItem.target?.amount ?? 0)}) akan dihapus dan sisa
            anggaran dihitung ulang.
          </>
        }
        onConfirm={() => (confirmItem.target ? deleteExpense(confirmItem.target.id) : undefined)}
        onClose={confirmItem.close}
      />
      <ConfirmDialog
        open={confirmPos.target != null}
        title="Hapus pos ini?"
        message={(() => {
          const target = confirmPos.target
          if (!target) return null
          const n = expenses.filter((e) => e.category_id === target.id).length
          return (
            <>
              Pos <strong className="text-ink">{target.name}</strong>
              {n > 0 ? ` beserta ${n} item di dalamnya` : ''} akan dihapus. Vendor yang terhubung tetap ada di halaman Vendor.
            </>
          )
        })()}
        confirmLabel="Ya, hapus pos"
        onConfirm={() => (confirmPos.target ? deleteCategory(confirmPos.target.id) : undefined)}
        onClose={confirmPos.close}
      />
    </div>
  )
}

function PaymentGroup({ title, empty, children }: { title: string; empty?: string; children: React.ReactNode[] }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h3>
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
