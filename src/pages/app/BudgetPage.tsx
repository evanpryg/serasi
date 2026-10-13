import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, CalendarClock, CheckCircle2, Plus, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useBudgetData } from '@/hooks/usePlanningData'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog, HowTo, PageHeader, useConfirm } from '@/components/ui/PageKit'
import { m } from '@/components/motion'
import { cn } from '@/lib/cn'
import { formatDateShort, formatRupiah, relativeDueLabel } from '@/lib/format'
import { calculateFinance } from '@/lib/finance'
import type { BudgetCategory, Expense, PaymentType } from '@/lib/database.types'
import { removeItemPhoto, uploadItemPhoto } from '@/lib/itemPhoto'
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

  const uploadPhoto = (file: File) => uploadItemPhoto(wedding.id, file)
  const removePhoto = async (path: string | null | undefined) => {
    try {
      await removeItemPhoto(path)
    } catch {
      /* file yatim tidak memengaruhi data */
    }
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
    <Card className="animate-fade-up p-4 sm:p-5">
      <h3 className="mb-3 font-semibold text-ink">Pos anggaran baru</h3>
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
        description="Bagi uang ke beberapa pos, lalu catat belanjanya di dalam pos. Sisa dihitung otomatis."
      />

      <HowTo
        id="budget-v3"
        steps={[
          <>Buat <strong className="text-ink">pos</strong> beserta jatahnya (tombol di bawah daftar), misalnya Seserahan Rp 5 jt.</>,
          <>Ketuk pos, tekan <strong className="text-ink">Tambah item</strong>: nama, harga, foto, atau link tokonya.</>,
          <><strong className="text-ink">Centang</strong> item yang sudah dibayar. Sisa uang pos langsung diperbarui.</>,
        ]}
      />

      {/* Ringkasan: satu angka utama + bar bertumpuk + tiga baris angka */}
      <Card className="p-4 sm:p-6">
        <p className="text-sm text-ink-muted">{over ? 'Anggaran terlampaui' : 'Sisa anggaran'}</p>
        <p className={cn('font-num text-[2.1rem] font-semibold leading-tight sm:text-5xl', over ? 'text-danger' : 'text-ink')}>
          {over && '−'}
          {formatRupiah(Math.abs(remaining))}
        </p>
        <p className="text-sm text-ink-muted">
          dari total <span className="font-semibold text-ink tabular">{formatRupiah(total)}</span>
        </p>

        <div
          role="img"
          aria-label={`Sudah dibayar ${formatRupiah(paid)}, belum dibayar ${formatRupiah(upcoming)}, dari total ${formatRupiah(total)}`}
          className="relative mt-4 h-2 overflow-hidden rounded-full bg-surface-muted"
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

        <dl className="mt-4 divide-y divide-border sm:grid sm:grid-cols-3 sm:gap-4 sm:divide-y-0">
          <SummaryRow dot="bg-primary" label="Sudah dibayar" value={formatRupiah(paid)} />
          <SummaryRow dot="bg-gold" label="Belum dibayar" value={formatRupiah(upcoming)} />
          <SummaryRow
            icon={<Wallet className="size-3.5 text-ink-subtle" aria-hidden />}
            label="Uang yang ada"
            value={formatRupiah(fin.cashOnHand)}
            tone={shortfall > 0 ? 'text-warning' : undefined}
          />
        </dl>

        {(shortfall > 0 || (!over && afterPlans < 0)) && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {!over && afterPlans < 0 ? (
                <>
                  Jika semua rencana dibayar, anggaran lebih <strong className="tabular">{formatRupiah(-afterPlans)}</strong>.
                </>
              ) : (
                <>
                  Uang kurang <strong className="tabular">{formatRupiah(shortfall)}</strong> untuk membayar semua rencana.
                </>
              )}
            </span>
          </p>
        )}
      </Card>

      <section aria-labelledby="pos-heading" className="space-y-2.5 sm:space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="pos-heading" className="font-display text-2xl font-semibold text-ink">
            Pos anggaran
          </h2>
          {categories.length > 0 && <p className="text-sm text-ink-muted">{categories.length} pos</p>}
        </div>

        {categories.length === 0 && !adding ? (
          <EmptyState
            icon={<Wallet className="size-7" aria-hidden />}
            title="Belum ada pos anggaran"
            description="Pos adalah jatah uang untuk tiap kebutuhan, misalnya Seserahan Rp 5 jt. Di dalamnya kamu bisa mencatat barang apa saja yang mau dibeli."
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
                uploadPhoto={uploadPhoto}
                removePhoto={removePhoto}
              />
            ))}
            {adding ? (
              posForm
            ) : (
              <button
                type="button"
                onClick={startAdding}
                className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-card border border-dashed border-border-strong text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-soft/50"
              >
                <Plus className="size-4" aria-hidden />
                Tambah pos
              </button>
            )}
          </>
        )}
      </section>

      {payments.length > 0 && (
        <section aria-labelledby="bayar-heading" className="space-y-3">
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
                  meta={p.due_date ? `jatuh tempo ${formatDateShort(p.due_date)}` : 'tanggal belum ditentukan'}
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
                  meta={p.payment_date ? `dibayar ${formatDateShort(p.payment_date)}` : p.fund_source ?? ''}
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
        onConfirm={async () => {
          const target = confirmItem.target
          if (!target) return
          await deleteExpense(target.id)
          void removePhoto(target.proof_path)
        }}
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
        onConfirm={async () => {
          const target = confirmPos.target
          if (!target) return
          const photos = expenses.filter((e) => e.category_id === target.id).map((e) => e.proof_path)
          await deleteCategory(target.id)
          photos.forEach((path) => void removePhoto(path))
        }}
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
    <li className="px-4 py-3 sm:px-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate font-medium text-ink">{title}</p>
        <span className="shrink-0 font-semibold text-ink tabular">{formatRupiah(amount)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs text-ink-muted">
          <span className="font-semibold">{type}</span>
          {meta && ` · ${meta}`}
        </p>
        {badge}
      </div>
    </li>
  )
}

function SummaryRow({ label, value, dot, icon, tone }: { label: string; value: string; dot?: string; icon?: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 sm:block sm:py-0">
      <dt className="flex items-center gap-1.5 text-sm text-ink-muted">
        {dot && <span className={cn('size-2 rounded-full', dot)} aria-hidden />}
        {icon}
        {label}
      </dt>
      <dd className={cn('font-num text-base font-semibold sm:mt-0.5 sm:text-xl', tone ?? 'text-ink')}>{value}</dd>
    </div>
  )
}
