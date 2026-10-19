import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Crown,
  FolderOpen,
  PiggyBank,
  Plus,
  Receipt,
  Settings2,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useBudgetData } from '@/hooks/usePlanningData'
import { usePremium } from '@/hooks/usePremium'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog, HowTo, PageHeader, useConfirm } from '@/components/ui/PageKit'
import { CountUp, m } from '@/components/motion'
import { cn } from '@/lib/cn'
import { formatDateShort, formatRupiah, formatRupiahShort, relativeDueLabel } from '@/lib/format'
import { calculateFinance, type CategorySummary } from '@/lib/finance'
import { NEUTRAL_TONE, POS_SUGGESTIONS, POS_SUGGESTIONS_DEFAULT, eventIcon, eventTone, type EventTone } from '@/lib/budgetIcons'
import type { BudgetCategory, BudgetEvent, Expense, PaymentType } from '@/lib/database.types'
import { removeItemPhoto, uploadItemPhoto } from '@/lib/itemPhoto'
import { CategoryCard, type VendorLine } from './budget/CategoryCard'
import { CategoryForm } from './budget/CategoryForm'
import { EventManager } from './budget/EventManager'

const PAYMENT_TYPE: Record<PaymentType, string> = {
  dp: 'DP',
  termin: 'Cicilan',
  pelunasan: 'Pelunasan',
  lainnya: 'Pembayaran',
}

/** Kelompok pos tanpa acara (acaranya dihapus, atau migration acara belum dijalankan). */
const NO_EVENT = 'tanpa-acara'

function ratio(part: number, whole: number) {
  return whole > 0 ? Math.min(1, Math.max(0, part / whole)) : 0
}

/** Pos yang terbuka disimpan di hash (#pos-<id>) agar bisa dibagikan/dibuka langsung. */
function openFromHash(): Set<string> {
  const match = window.location.hash.match(/^#pos-(.+)$/)
  return new Set(match?.[1] ? [match[1]] : [])
}

type Totals = { planned: number; actual: number; committed: number }

function totalsOf(cats: BudgetCategory[], summary: Map<string, CategorySummary>): Totals {
  return cats.reduce<Totals>(
    (acc, c) => {
      const s = summary.get(c.id)
      return { planned: acc.planned + c.planned_amount, actual: acc.actual + (s?.actual ?? 0), committed: acc.committed + (s?.committed ?? 0) }
    },
    { planned: 0, actual: 0, committed: 0 },
  )
}

export function BudgetPage() {
  const wedding = useWedding()
  const { isPremium } = usePremium()
  const budget = useBudgetData(wedding.id)
  const { state, reload, createExpense, updateExpense, deleteExpense, createCategory, updateCategory, deleteCategory, createEvent, updateEvent, deleteEvent } = budget
  const [open, setOpen] = useState<Set<string>>(openFromHash)
  // Satu acara terpilih pada satu waktu (pola master-detail) — grid tetap ringkas, detail fokus.
  const [selected, setSelected] = useState<string | null>(null)
  const [addingIn, setAddingIn] = useState<string | null>(null)
  const [justCreated, setJustCreated] = useState<string | null>(null)
  const [managerOpen, setManagerOpen] = useState(false)
  const confirmItem = useConfirm<Expense>()
  const confirmPos = useConfirm<BudgetCategory>()
  const confirmEvent = useConfirm<BudgetEvent>()
  const addRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  // Gulir ke pos yang dibuka lewat tautan setelah data termuat dan buka kartu acara yang menaunginya.
  const ready = state.status === 'ready'
  useEffect(() => {
    if (!ready || !state.data) return
    const id = [...openFromHash()][0]
    if (id) {
      const cat = state.data.categories.find((c) => c.id === id)
      if (cat) {
        const evIds = new Set(state.data.events.map((e) => e.id))
        const grp = cat.event_id && evIds.has(cat.event_id) ? cat.event_id : NO_EVENT
        setSelected(grp)
      }
      setTimeout(() => {
        document.getElementById(`pos-${id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }, 100)
    }
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

  /** Pilih acara dan gulir ke detailnya (penting di mobile, detail ada di bawah grid). */
  function selectEvent(key: string) {
    setSelected(key)
    setAddingIn(null)
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function startAdding(groupKey: string) {
    setSelected(groupKey)
    setAddingIn(groupKey)
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
        <Skeleton className="h-56 rounded-[1.75rem]" />
        <div className="flex gap-2.5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-40 rounded-2xl" />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat data anggaran." onRetry={() => void reload()} />
  }

  const { expenses, payments, vendors, eventsReady } = state.data
  const events = [...state.data.events].sort((a, b) => a.sort_order - b.sort_order)
  const eventIds = new Set(events.map((e) => e.id))
  const categories = state.data.categories.filter((c) => !c.is_archived)
  const groupOf = (c: BudgetCategory) => (c.event_id && eventIds.has(c.event_id) ? c.event_id : NO_EVENT)
  const catsIn = (key: string) => categories.filter((c) => groupOf(c) === key)
  const orphanCount = catsIn(NO_EVENT).length

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

  const groupKeys = events.length === 0 ? [NO_EVENT] : [...events.map((e) => e.id), ...(orphanCount > 0 ? [NO_EVENT] : [])]
  // Acara yang sedang dibuka di panel detail; default ke acara pertama agar detail selalu terlihat.
  const activeKey = selected && groupKeys.includes(selected) ? selected : (groupKeys[0] ?? null)

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

  const groupLabel = (key: string) => (key === NO_EVENT ? (events.length ? 'Tanpa acara' : 'Pos anggaran') : (events.find((e) => e.id === key)?.name ?? ''))

  const scheduledPayments = payments.filter((p) => p.status === 'scheduled').sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
  const settledPayments = payments.filter((p) => p.status !== 'scheduled')

  const existingNames = (eventId: string | null) => categories.filter((c) => (c.event_id ?? null) === eventId).map((c) => c.name)

  /** Isi panel detail: daftar pos acara + form tambah pos. */
  function renderPosList(key: string) {
    const ev = events.find((e) => e.id === key)
    const cats = catsIn(key)
    const title = groupLabel(key)
    const isAdding = addingIn === key
    const canAdd = Boolean(ev) || events.length === 0
    const emptyMsg = `Belum ada pos. Contoh: ${((ev?.template_key && POS_SUGGESTIONS[ev.template_key]) || POS_SUGGESTIONS_DEFAULT)
      .slice(0, 4)
      .join(', ')}.`

    return (
      <div className="space-y-3">
        {cats.length === 0 && !isAdding ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface/80 p-5 text-center">
            <p className="font-semibold text-ink">Belum ada pos anggaran di {title}</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-ink-muted">{emptyMsg}</p>
            {canAdd && (
              <div className="mt-4 flex justify-center">
                <Button size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={() => startAdding(key)}>
                  Tambah pos pertama
                </Button>
              </div>
            )}
          </div>
        ) : (
          cats.map((cat) => (
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
              events={events}
            />
          ))
        )}

        {isAdding ? (
          <div ref={addRef} className="scroll-mt-24">
            <Card className="animate-fade-up p-4 sm:p-5">
              <h3 className="mb-3 font-semibold text-ink">Pos baru{ev ? ` untuk ${ev.name}` : ''}</h3>
              <CategoryForm
                events={events}
                defaultEventId={ev?.id ?? null}
                existingNames={existingNames}
                onSubmit={async (input) => {
                  const id = await createCategory(input)
                  setAddingIn(null)
                  setJustCreated(id)
                  setOpen((prev) => new Set(prev).add(id))
                  requestAnimationFrame(() => document.getElementById(`pos-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
                }}
                onCancel={() => setAddingIn(null)}
              />
            </Card>
          </div>
        ) : (
          // Grup "Tanpa acara" hanya untuk pos lama; pos baru selalu dibuat di dalam acara.
          canAdd &&
          cats.length > 0 && (
            <button
              type="button"
              onClick={() => startAdding(key)}
              className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-card border border-dashed border-border-strong bg-surface/70 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-soft/50"
            >
              <Plus className="size-4" aria-hidden />
              Tambah pos di {title}
            </button>
          )
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Anggaran"
        description="Atur uang per acara — lamaran, prewedding, wedding, honeymoon — lalu centang item yang sudah dibayar beserta nominal aktualnya."
      />

      <HowTo
        id="budget-v4"
        steps={[
          <>Pilih <strong className="text-ink">acara</strong> (Lamaran, Wedding, ...) lalu buat pos di dalamnya, misalnya Make up Rp 1,5 jt.</>,
          <>Isi pos dengan <strong className="text-ink">item</strong>: nama dan harga rencana. Bisa tambah foto atau link toko.</>,
          <><strong className="text-ink">Centang</strong> saat sudah dibayar dan isi nominal aktualnya. Selisih hemat/lebih dihitung otomatis.</>,
        ]}
      />

      {!eventsReady && (
        <p className="flex items-start gap-2 rounded-card border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Pengelompokan per acara belum aktif karena database belum diperbarui. Jalankan migration{' '}
            <code className="rounded bg-surface px-1">20261018000012_budget_events.sql</code> di Supabase.
          </span>
        </p>
      )}

      {/* Ringkasan utama */}
      <section
        aria-label="Ringkasan anggaran"
        className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary-deep via-primary to-primary-hover p-5 text-white shadow-glow sm:p-7"
      >
        <svg aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 size-[22rem] opacity-25 sm:-right-10" viewBox="0 0 200 200">
          <circle cx="80" cy="100" r="62" fill="none" stroke="var(--color-gold)" strokeWidth="0.7" />
          <circle cx="120" cy="100" r="62" fill="none" stroke="var(--color-gold-on-dark)" strokeWidth="0.7" />
          <circle cx="100" cy="100" r="92" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="0.4" strokeDasharray="1 3" />
        </svg>
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 -z-10 size-72 rounded-full bg-gold/25 blur-3xl" />

        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-white/85">{over ? 'Anggaran terlampaui' : 'Sisa anggaran'}</p>
          {isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-gold-on-dark ring-1 ring-gold-on-dark/40">
              <Crown className="size-3.5" aria-hidden />
              Premium
            </span>
          )}
        </div>
        <p className={cn('mt-1 font-num text-[2.4rem] font-semibold leading-none sm:text-6xl', over && 'text-gold-on-dark')}>
          {over && '−'}
          <CountUp value={Math.abs(remaining)} format={formatRupiah} />
        </p>
        <p className="mt-2 text-sm text-white/85">
          dari total anggaran <strong className="font-semibold text-white tabular">{formatRupiah(total)}</strong>
          {events.length > 0 && ` · ${events.length} acara`} · {categories.length} pos
        </p>

        <div
          role="img"
          aria-label={`Sudah dibayar ${formatRupiah(paid)}, belum dibayar ${formatRupiah(upcoming)}, dari total ${formatRupiah(total)}`}
          className="relative mt-5 h-2.5 overflow-hidden rounded-full bg-white/15"
        >
          <m.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gold-on-dark/70"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: ratio(used, total) }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          <m.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-white"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: ratio(paid, total) }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <dl className="mt-5 grid gap-2 sm:grid-cols-3 sm:gap-3">
          <HeroStat icon={Receipt} dot="bg-white" label="Aktual terpakai" value={formatRupiah(paid)} />
          <HeroStat icon={CalendarClock} dot="bg-gold-on-dark/70" label="Belum dibayar" value={formatRupiah(upcoming)} />
          <HeroStat icon={PiggyBank} label="Uang yang ada" value={formatRupiah(fin.cashOnHand)} warn={shortfall > 0} />
        </dl>

        {(shortfall > 0 || (!over && afterPlans < 0)) && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-gold-on-dark ring-1 ring-gold-on-dark/30">
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
      </section>

      {/* Daftar Acara Pernikahan (Kartu Besar) */}
      <section aria-labelledby="acara-section-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="acara-section-heading" className="font-display text-2xl font-semibold text-ink">
              Anggaran per acara
            </h2>
            <p className="text-sm text-ink-muted">
              {events.length > 0
                ? 'Budget, yang sudah terpakai, dan sisa tiap acara. Ketuk kartu untuk mengatur pos di dalamnya.'
                : 'Kelompokkan anggaran per acara agar terencana rapi.'}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setManagerOpen(true)} icon={<Settings2 className="size-4" aria-hidden />}>
            Kelola acara
          </Button>
        </div>

        {categories.length === 0 && events.length === 0 && addingIn == null ? (
          <EmptyState
            icon={<Wallet className="size-7" aria-hidden />}
            title="Belum ada pos anggaran"
            description="Pos adalah jatah uang untuk tiap kebutuhan, misalnya Make up Rp 1,5 jt. Di dalamnya kamu bisa mencatat barang apa saja yang mau dibeli."
            action={
              <Button onClick={() => startAdding(NO_EVENT)} icon={<Plus className="size-4" aria-hidden />}>
                Buat pos pertama
              </Button>
            }
          />
        ) : (
          <>
            {/* Ringkasan ringkas tiap acara — dua kolom, bisa dipindai sekilas. */}
            <div className="grid gap-3 sm:grid-cols-2">
              {groupKeys.map((key) => {
                const ev = events.find((e) => e.id === key)
                const index = ev ? events.indexOf(ev) : -1
                return (
                  <EventBudgetCard
                    key={key}
                    title={groupLabel(key)}
                    date={ev?.event_date ?? null}
                    posCount={catsIn(key).length}
                    totals={totalsOf(catsIn(key), catSummary)}
                    icon={ev ? eventIcon(ev.icon) : FolderOpen}
                    tone={ev ? eventTone(index) : NEUTRAL_TONE}
                    active={activeKey === key}
                    isOrphan={!ev && events.length > 0}
                    onSelect={() => selectEvent(key)}
                  />
                )
              })}

              {/* Tambah acara baru — ubin ringkas sejajar kartu acara. */}
              <button
                type="button"
                onClick={() => setManagerOpen(true)}
                className="flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[1.25rem] border border-dashed border-border-strong bg-surface/50 p-4 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-soft/40"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary" aria-hidden>
                  <Plus className="size-5" />
                </span>
                Tambah acara
                <span className="text-xs font-normal text-ink-muted">Lamaran, Akad, Honeymoon, ...</span>
              </button>
            </div>

            {/* Panel detail acara terpilih: pos-pos di dalamnya. */}
            {activeKey && (
              <div ref={detailRef} className="scroll-mt-24">
                {(() => {
                  const ev = events.find((e) => e.id === activeKey)
                  const index = ev ? events.indexOf(ev) : -1
                  const tone = ev ? eventTone(index) : NEUTRAL_TONE
                  const Icon: LucideIcon = ev ? eventIcon(ev.icon) : FolderOpen
                  const t = totalsOf(catsIn(activeKey), catSummary)
                  const title = groupLabel(activeKey)
                  const left = t.planned - t.committed
                  const over = left < 0
                  return (
                    <section
                      aria-labelledby="detail-acara-heading"
                      className={cn('overflow-hidden rounded-[1.5rem] border bg-surface shadow-card', tone.border)}
                    >
                      <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-gradient-to-br to-surface to-80% p-4 sm:px-6', tone.from)}>
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm', tone.tile)} aria-hidden>
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <h3 id="detail-acara-heading" className="truncate font-display text-xl font-semibold text-ink">
                              {title}
                            </h3>
                            <p className="text-xs text-ink-muted">
                              {catsIn(activeKey).length} pos · sisa{' '}
                              <strong className={cn('tabular font-semibold', over ? 'text-danger' : 'text-ink')}>{formatRupiah(Math.abs(left))}</strong>
                              {over && ' (lebih)'}
                            </p>
                          </div>
                        </div>
                        {ev && (
                          <Button variant="ghost" size="sm" onClick={() => setManagerOpen(true)} icon={<Settings2 className="size-3.5" aria-hidden />}>
                            Ubah acara
                          </Button>
                        )}
                      </div>
                      <div className="p-4 sm:p-5">{renderPosList(activeKey)}</div>
                    </section>
                  )
                })()}
              </div>
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

      <EventManager
        open={managerOpen}
        events={events}
        posCount={(id) => catsIn(id).length}
        onClose={() => setManagerOpen(false)}
        onCreate={async (input) => {
          const id = await createEvent(input)
          setSelected(id)
          return id
        }}
        onUpdate={(id, input) => updateEvent(id, input)}
        onAskDelete={(ev) => {
          // Dialog konfirmasi tampil di atas halaman, jadi lembar kelola ditutup dulu.
          setManagerOpen(false)
          confirmEvent.ask(ev)
        }}
      />

      <ConfirmDialog
        open={confirmEvent.target != null}
        title="Hapus acara ini?"
        message={(() => {
          const target = confirmEvent.target
          if (!target) return null
          const n = catsIn(target.id).length
          return (
            <>
              Acara <strong className="text-ink">{target.name}</strong> akan dihapus.
              {n > 0 ? ` ${n} pos di dalamnya tidak ikut terhapus dan pindah ke "Tanpa acara".` : ''}
            </>
          )
        })()}
        confirmLabel="Ya, hapus acara"
        onConfirm={async () => {
          const target = confirmEvent.target
          if (!target) return
          await deleteEvent(target.id)
          setSelected((cur) => (cur === target.id ? null : cur))
        }}
        onClose={confirmEvent.close}
      />
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

function HeroStat({ icon: Icon, label, value, dot, warn }: { icon: LucideIcon; label: string; value: string; dot?: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur-sm sm:block sm:py-3">
      <dt className="flex items-center gap-2 text-sm text-white/85">
        <span className="flex size-7 items-center justify-center rounded-lg bg-white/15" aria-hidden>
          <Icon className="size-3.5" />
        </span>
        {label}
        {dot && <span className={cn('size-2 rounded-full', dot)} aria-hidden />}
      </dt>
      <dd className={cn('font-num text-base font-semibold sm:mt-1.5 sm:text-xl', warn ? 'text-gold-on-dark' : 'text-white')}>
        {value}
        {warn && <span className="sr-only"> (kurang untuk semua rencana)</span>}
      </dd>
    </div>
  )
}

/**
 * Kartu ringkas satu acara untuk grid 2 kolom: budget · terpakai · sisa dalam sekilas.
 * Ketuk untuk membuka panel detail (pos) di bawah grid.
 */
function EventBudgetCard({
  title,
  date,
  posCount,
  totals,
  icon: Icon,
  tone,
  active,
  isOrphan,
  onSelect,
}: {
  title: string
  date: string | null
  posCount: number
  totals: Totals
  icon: LucideIcon
  tone: EventTone
  active: boolean
  isOrphan: boolean
  onSelect: () => void
}) {
  const left = totals.planned - totals.committed
  const over = left < 0
  const pct = totals.planned > 0 ? Math.round((totals.actual / totals.planned) * 100) : 0
  const meta = isOrphan
    ? `${posCount} pos belum masuk acara`
    : `${posCount} pos${date ? ` · ${formatDateShort(date)}` : ''}`

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'group flex min-h-[7rem] w-full cursor-pointer flex-col gap-3 rounded-[1.25rem] border bg-gradient-to-br to-surface to-80% p-4 text-left shadow-card transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5',
        tone.from,
        active ? 'border-primary/60 ring-2 ring-primary/30 shadow-pop' : cn(tone.border, 'hover:border-border-strong hover:shadow-pop'),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-105', tone.tile)} aria-hidden>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold leading-tight text-ink">{title}</p>
            <p className="truncate text-xs text-ink-muted">{meta}</p>
          </div>
        </div>
        {totals.planned === 0 ? (
          <Badge tone="neutral" className="shrink-0 text-[0.7rem]">
            Belum diatur
          </Badge>
        ) : over ? (
          <Badge tone="danger" className="shrink-0 text-[0.7rem]">
            <AlertTriangle className="size-3" aria-hidden />
            Lebih
          </Badge>
        ) : (
          <Badge tone={totals.actual > 0 ? 'success' : 'neutral'} className="shrink-0 text-[0.7rem]">
            {pct}% terpakai
          </Badge>
        )}
      </div>

      {/* Bar ganda: emas = termasuk yang belum dibayar, warna acara = sudah dibayar. */}
      <div
        role="img"
        aria-label={`Terpakai ${formatRupiah(totals.actual)} dari budget ${formatRupiah(totals.planned)}`}
        className="relative h-1.5 overflow-hidden rounded-full bg-surface-muted ring-1 ring-border/50"
      >
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', over ? 'bg-danger/35' : 'bg-gold/70')}
          style={{ width: `${ratio(totals.committed, totals.planned) * 100}%` }}
        />
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', over ? 'bg-danger' : tone.bar)}
          style={{ width: `${ratio(totals.actual, totals.planned) * 100}%` }}
        />
      </div>

      <dl className="mt-auto grid grid-cols-3 gap-2">
        <div>
          <dt className="text-[0.7rem] text-ink-muted">Budget</dt>
          <dd className="font-num text-sm font-semibold text-ink">{formatRupiahShort(totals.planned)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-[0.7rem] text-ink-muted">
            <span className={cn('size-1.5 rounded-full', over ? 'bg-danger' : tone.bar)} aria-hidden />
            Terpakai
          </dt>
          <dd className="font-num text-sm font-semibold text-ink">{formatRupiahShort(totals.actual)}</dd>
        </div>
        <div>
          <dt className="text-[0.7rem] text-ink-muted">{over ? 'Lebih' : 'Sisa'}</dt>
          <dd className={cn('font-num text-sm font-semibold', over ? 'text-danger' : 'text-ink')}>{formatRupiahShort(Math.abs(left))}</dd>
        </div>
      </dl>
    </button>
  )
}

function PaymentGroup({ title, empty, children }: { title: string; empty?: string; children: ReactNode[] }) {
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

function PaymentRow({ title, type, amount, meta, badge }: { title: string; type: string; amount: number; meta: string; badge: ReactNode }) {
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
