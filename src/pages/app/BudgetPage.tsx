import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
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
import { AnimatePresence, CountUp, EASE_OUT, m } from '@/components/motion'
import { cn } from '@/lib/cn'
import { formatDate, formatDateShort, formatRupiah, formatRupiahShort, relativeDueLabel } from '@/lib/format'
import { calculateFinance, expenseValue, type CategorySummary } from '@/lib/finance'
import { NEUTRAL_TONE, POS_SUGGESTIONS, POS_SUGGESTIONS_DEFAULT, eventIcon, eventTone, type EventTone } from '@/lib/budgetIcons'
import type { BudgetCategory, BudgetEvent, Expense, PaymentType } from '@/lib/database.types'
import { removeItemPhoto, uploadItemPhoto } from '@/lib/itemPhoto'
import { CategoryCard, type VendorLine } from './budget/CategoryCard'
import { CategoryForm } from './budget/CategoryForm'
import { EventManager } from './budget/EventManager'
import { SpendLog, type LogEntry, type PosOption } from './budget/SpendLog'

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
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(() => new Set<string>())
  const [addingIn, setAddingIn] = useState<string | null>(null)
  const [justCreated, setJustCreated] = useState<string | null>(null)
  const [managerOpen, setManagerOpen] = useState(false)
  const [logSignal, setLogSignal] = useState(0)
  const confirmItem = useConfirm<Expense>()
  const confirmPos = useConfirm<BudgetCategory>()
  const confirmEvent = useConfirm<BudgetEvent>()
  const addRef = useRef<HTMLDivElement>(null)

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
        setExpandedEvents((prev) => new Set(prev).add(grp))
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

  function toggleEvent(key: string) {
    setExpandedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function expandAll(keys: string[]) {
    setExpandedEvents(new Set(keys))
  }

  function collapseAll() {
    setExpandedEvents(new Set())
  }

  function startAdding(groupKey: string) {
    setExpandedEvents((prev) => new Set(prev).add(groupKey))
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
  const allExpanded = groupKeys.length > 0 && groupKeys.every((k) => expandedEvents.has(k))

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

  // Catatan pengeluaran: item lunas + pembayaran vendor yang sudah dibayar.
  const catById = new Map(categories.map((c) => [c.id, c]))
  const eventName = (c: BudgetCategory | undefined) => (c && groupOf(c) !== NO_EVENT ? events.find((e) => e.id === c.event_id)?.name ?? null : null)
  const vendorById = new Map(vendors.map((v) => [v.id, v]))
  const logAll: (LogEntry & { group: string })[] = [
    ...expenses
      .filter((e) => e.status === 'paid')
      .map((e) => {
        const c = catById.get(e.category_id)
        return {
          id: e.id,
          kind: 'item' as const,
          title: e.title,
          date: e.expense_date,
          value: expenseValue(e),
          planned: e.amount > 0 ? e.amount : null,
          posName: c?.name ?? 'Pos dihapus',
          isReserve: Boolean(c?.is_reserve),
          eventName: eventName(c),
          group: c ? groupOf(c) : NO_EVENT,
        }
      }),
    ...payments
      .filter((p) => p.status === 'paid')
      .map((p) => {
        const v = p.wedding_vendor_id ? vendorById.get(p.wedding_vendor_id) : undefined
        const c = v?.category_id ? catById.get(v.category_id) : undefined
        return {
          id: `pay-${p.id}`,
          kind: 'vendor' as const,
          title: p.notes ?? `${PAYMENT_TYPE[p.payment_type]} ${v?.custom_name ?? 'vendor'}`,
          date: p.payment_date,
          value: p.amount,
          planned: null,
          posName: c?.name ?? v?.custom_name ?? 'Vendor',
          isReserve: false,
          eventName: eventName(c),
          group: c ? groupOf(c) : NO_EVENT,
        }
      }),
  ]
  const logEntries = logAll
  const groupLabel = (key: string) => (key === NO_EVENT ? (events.length ? 'Tanpa acara' : 'Pos anggaran') : (events.find((e) => e.id === key)?.name ?? ''))
  const posOptions: PosOption[] = groupKeys.flatMap((key) => catsIn(key).map((c) => ({ id: c.id, name: c.name, group: groupLabel(key) })))
  const defaultPosId = categories[0]?.id ?? null

  const scheduledPayments = payments.filter((p) => p.status === 'scheduled').sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
  const settledPayments = payments.filter((p) => p.status !== 'scheduled')

  const existingNames = (eventId: string | null) => categories.filter((c) => (c.event_id ?? null) === eventId).map((c) => c.name)

  function renderEventCard(key: string) {
    const ev = events.find((e) => e.id === key)
    const index = ev ? events.indexOf(ev) : -1
    const cats = catsIn(key)
    const tone = ev ? eventTone(index) : NEUTRAL_TONE
    const Icon: LucideIcon = ev ? eventIcon(ev.icon) : FolderOpen
    const t = totalsOf(cats, catSummary)
    const title = groupLabel(key)
    const isAdding = addingIn === key
    const isExpanded = expandedEvents.has(key)
    const emptyMsg =
      cats.length === 0
        ? `Belum ada pos. Contoh: ${((ev?.template_key && POS_SUGGESTIONS[ev.template_key]) || POS_SUGGESTIONS_DEFAULT).slice(0, 4).join(', ')}.`
        : undefined

    return (
      <BigEventCard
        key={key}
        id={`acara-${key}`}
        title={title}
        subtitle={
          ev
            ? `${ev.event_date ? formatDate(ev.event_date) : 'Tanggal belum diatur'} · ${cats.length} pos`
            : events.length
              ? `${cats.length} pos belum masuk acara. Ubah pos untuk memindahkannya.`
              : `${cats.length} pos`
        }
        icon={Icon}
        tone={tone}
        totals={t}
        posCount={cats.length}
        isExpanded={isExpanded}
        onToggle={() => toggleEvent(key)}
        onEdit={ev ? () => setManagerOpen(true) : undefined}
        empty={emptyMsg}
        isAdding={isAdding}
        onStartAdd={ev || events.length === 0 ? () => startAdding(key) : undefined}
      >
        <div className="space-y-3">
          {cats.map((cat) => (
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
          ))}

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
            (ev || events.length === 0) &&
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
      </BigEventCard>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Anggaran"
        description="Atur uang per acara — lamaran, prewedding, wedding, honeymoon — lalu catat berapa yang benar-benar keluar."
        actions={
          categories.length > 0 && (
            <Button icon={<Receipt className="size-4" aria-hidden />} onClick={() => setLogSignal((n) => n + 1)}>
              Catat pengeluaran
            </Button>
          )
        }
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
              Acara Pernikahan
            </h2>
            <p className="text-sm text-ink-muted">
              {events.length > 0
                ? 'Klik kartu acara untuk melihat dan mengatur pos-pos anggarannya.'
                : 'Kelompokkan anggaran per acara agar terencana rapi.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {groupKeys.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => (allExpanded ? collapseAll() : expandAll(groupKeys))}
                icon={<ChevronsUpDown className="size-4" aria-hidden />}
              >
                {allExpanded ? 'Tutup semua' : 'Buka semua'}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setManagerOpen(true)}
              icon={<Settings2 className="size-4" aria-hidden />}
            >
              Kelola acara
            </Button>
          </div>
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
          <div className="space-y-4">
            {groupKeys.map(renderEventCard)}

            {/* Tombol Tambah Acara Baru di bagian bawah kartu */}
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[1.5rem] border border-dashed border-border-strong bg-surface/60 p-4 text-sm font-semibold text-primary transition-all duration-200 hover:border-primary hover:bg-primary-soft/50 shadow-sm"
            >
              <Plus className="size-4" aria-hidden />
              Tambah acara baru (Lamaran, Akad, Resepsi, Honeymoon, ...)
            </button>
          </div>
        )}
      </section>

      <SpendLog
        entries={logEntries}
        posOptions={posOptions}
        defaultPosId={defaultPosId}
        openSignal={logSignal}
        onAdd={({ category_id, title, amount, date }) => createExpense({ category_id, title, amount, status: 'paid', expense_date: date })}
      />

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
          setExpandedEvents((prev) => new Set(prev).add(id))
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
          setExpandedEvents((prev) => {
            const next = new Set(prev)
            next.delete(target.id)
            return next
          })
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

function BigEventCard({
  id,
  title,
  subtitle,
  icon: Icon,
  tone,
  totals,
  posCount,
  isExpanded,
  onToggle,
  onEdit,
  empty,
  isAdding,
  onStartAdd,
  children,
}: {
  id: string
  title: string
  subtitle: string
  icon: LucideIcon
  tone: EventTone
  totals: Totals
  posCount: number
  isExpanded: boolean
  onToggle: () => void
  onEdit?: () => void
  empty?: string
  isAdding?: boolean
  onStartAdd?: () => void
  children: ReactNode
}) {
  const left = totals.planned - totals.committed
  const over = left < 0
  const actualRatio = ratio(totals.actual, totals.planned)
  const committedRatio = ratio(totals.committed, totals.planned)
  const pct = totals.planned > 0 ? Math.round((totals.actual / totals.planned) * 100) : 0

  return (
    <section
      aria-labelledby={id}
      className={cn(
        'relative overflow-hidden rounded-[1.5rem] border bg-gradient-to-br to-surface to-70% shadow-card transition-all duration-200',
        tone.border,
        tone.from,
        isExpanded ? 'ring-1 ring-primary/20 shadow-pop' : 'hover:border-border-strong hover:shadow-pop',
      )}
    >
      {/* Kartu Besar Header - Klik untuk buka / tutup detail */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        className="group cursor-pointer p-4 sm:p-6 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <span
              className={cn(
                'flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-105',
                tone.tile,
              )}
              aria-hidden
            >
              <Icon className="size-6 sm:size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={id} className="truncate font-display text-2xl sm:text-[1.75rem] font-semibold text-ink leading-tight">
                {title}
              </h2>
              <p className="flex items-center gap-1.5 text-xs sm:text-sm text-ink-muted mt-0.5">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{subtitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                aria-label={`Ubah acara ${title}`}
                className="flex size-9 sm:size-10 cursor-pointer items-center justify-center rounded-xl bg-surface/70 text-ink-muted transition-colors hover:bg-surface hover:text-ink ring-1 ring-border/60"
              >
                <Settings2 className="size-4" aria-hidden />
              </button>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ring-1',
                isExpanded
                  ? 'bg-primary text-on-primary ring-primary shadow-sm'
                  : 'bg-surface/90 text-ink ring-border/70 group-hover:bg-primary-soft group-hover:text-primary group-hover:ring-primary/40',
              )}
            >
              <span>{isExpanded ? 'Tutup' : 'Detail'}</span>
              <ChevronDown className={cn('size-3.5 transition-transform duration-200', isExpanded && 'rotate-180')} aria-hidden />
            </span>
          </div>
        </div>

        {/* Panel Finansial Utama: Total budget dan aktualisasinya (aktual / budget) */}
        <div className="mt-4 rounded-2xl bg-surface/90 p-4 ring-1 ring-border/70 backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Realisasi Anggaran
              </span>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                <span className="font-num text-2xl sm:text-3xl font-bold text-ink">
                  {formatRupiah(totals.actual)}
                </span>
                <span className="font-num text-base sm:text-lg font-medium text-ink-muted">
                  / {formatRupiah(totals.planned)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {over ? (
                <Badge tone="danger" className="text-xs font-semibold">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  Terlampaui {formatRupiah(Math.abs(left))}
                </Badge>
              ) : totals.planned > 0 ? (
                <Badge tone={totals.actual > 0 ? 'success' : 'neutral'} className="text-xs font-semibold">
                  {pct}% terealisasi
                </Badge>
              ) : (
                <Badge tone="neutral" className="text-xs font-semibold">
                  Belum dianggarkan
                </Badge>
              )}
              <span className="text-xs text-ink-muted font-medium">
                Sisa:{' '}
                <strong className={cn('font-num font-semibold', over ? 'text-danger' : 'text-ink')}>
                  {formatRupiah(Math.max(0, left))}
                </strong>
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            role="img"
            aria-label={`Aktual ${formatRupiah(totals.actual)} dari budget ${formatRupiah(totals.planned)}`}
            className="relative mt-3 h-2 sm:h-2.5 overflow-hidden rounded-full bg-surface-muted ring-1 ring-border/50"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gold/70 transition-all duration-500"
              style={{ width: `${committedRatio * 100}%` }}
            />
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                over ? 'bg-danger' : tone.bar,
              )}
              style={{ width: `${actualRatio * 100}%` }}
            />
          </div>

          {/* 3 kolom ringkasan */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center sm:text-left">
            <div className="rounded-xl bg-surface/50 p-2 sm:bg-transparent sm:p-0">
              <p className="text-[11px] font-medium text-ink-muted">Target Budget</p>
              <p className="font-num text-sm sm:text-base font-semibold text-ink">{formatRupiahShort(totals.planned)}</p>
            </div>
            <div className="rounded-xl bg-surface/50 p-2 sm:bg-transparent sm:p-0">
              <p className="text-[11px] font-medium text-ink-muted">Aktual Keluar</p>
              <p className="font-num text-sm sm:text-base font-semibold text-primary">{formatRupiahShort(totals.actual)}</p>
            </div>
            <div className="rounded-xl bg-surface/50 p-2 sm:bg-transparent sm:p-0">
              <p className="text-[11px] font-medium text-ink-muted">{over ? 'Lebih' : 'Sisa Budget'}</p>
              <p className={cn('font-num text-sm sm:text-base font-semibold', over ? 'text-danger' : 'text-ink')}>
                {formatRupiahShort(Math.abs(left))}
              </p>
            </div>
          </div>
        </div>

        {/* Petunjuk aksi di bagian bawah kartu */}
        <div className="mt-3.5 flex items-center justify-between text-xs sm:text-sm">
          <span className="font-medium text-ink-muted">
            {posCount === 0
              ? 'Belum ada pos anggaran'
              : isExpanded
                ? `Menampilkan ${posCount} pos anggaran`
                : `Lihat detail ${posCount} pos & kategori di ${title}`}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:underline">
            {isExpanded ? 'Tutup detail' : 'Klik untuk lihat pos'}
            <ChevronDown className={cn('size-4 transition-transform duration-200', isExpanded && 'rotate-180')} aria-hidden />
          </span>
        </div>
      </div>

      {/* Bagian detail yang muncul saat diklik */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="overflow-hidden border-t border-border/70 bg-surface/50"
          >
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-subtle">
                    Daftar Pos Anggaran ({posCount})
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Pos adalah alokasi untuk kebutuhan di {title}.
                  </p>
                </div>
                {!isAdding && onStartAdd && (
                  <Button size="sm" variant="secondary" icon={<Plus className="size-3.5" aria-hidden />} onClick={onStartAdd}>
                    Tambah pos
                  </Button>
                )}
              </div>

              {posCount === 0 && empty ? (
                <div className="rounded-2xl border border-dashed border-border-strong bg-surface/80 p-5 text-center">
                  <p className="font-medium text-ink">Belum ada pos anggaran di {title}</p>
                  <p className="mt-1 text-xs text-ink-muted max-w-md mx-auto">{empty}</p>
                  {onStartAdd && (
                    <div className="mt-4 flex justify-center">
                      <Button size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={onStartAdd}>
                        Tambah pos pertama di {title}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                children
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
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
