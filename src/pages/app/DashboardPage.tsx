import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarHeart,
  ChevronRight,
  CircleDollarSign,
  ListChecks,
  PiggyBank,
  ReceiptText,
  Store,
  UserPlus,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { firstName, useWedding, useWorkspace } from '@/auth/WorkspaceProvider'
import { CountUp, EASE_OUT, Stagger, StaggerItem, m } from '@/components/motion'
import { CoverImage, CoverPhotoControls } from '@/components/couple/Cover'
import { PartnerInvite } from '@/components/couple/PartnerInvite'
import { useDashboardData, type DashboardData } from '@/hooks/useDashboardData'
import { Card, CardBody, CardHeader, Badge, ProgressBar } from '@/components/ui/Card'
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { calculateFinance, monthlySavingNeeded, percent, upcomingPayments, type FinanceSummary } from '@/lib/finance'
import { buildPriorities, type PriorityItem } from '@/lib/priorities'
import { daysBetween, formatDate, formatRupiah, parseDateOnly } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Wedding } from '@/lib/database.types'
import { clearFlash, peekFlash } from '@/lib/flash'

export function DashboardPage() {
  const wedding = useWedding()
  const { me, partner } = useWorkspace()
  const [flash] = useState(peekFlash)
  useEffect(clearFlash, [])
  const { state, reload } = useDashboardData(wedding.id)

  const daysLeft = wedding.wedding_date ? daysBetween(new Date(), parseDateOnly(wedding.wedding_date)) : null
  const names = me && partner ? `${firstName(me.role === 'owner' ? me.name : partner.name)} & ${firstName(me.role === 'owner' ? partner.name : me.name)}` : wedding.title

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Hero foto pasangan + hitung mundur */}
      <m.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative flex min-h-[21rem] flex-col justify-end overflow-hidden rounded-[1.75rem] shadow-card sm:min-h-[18rem]"
      >
        <CoverImage path={wedding.cover_photo_path} alt={`Foto ${names}`} className="absolute inset-0" imgClassName="object-[center_45%]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10 sm:bg-gradient-to-r sm:from-ink/75 sm:via-ink/35 sm:to-transparent" />
        <CoverPhotoControls className="absolute right-4 top-4 z-10" />
        <div className="relative flex flex-col gap-4 p-6 pt-20 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="text-sm font-medium text-gold-on-dark">{me ? `Halo, ${firstName(me.name)}` : 'Halo'}</p>
            <h1 className="mt-1 font-display text-[2.4rem] font-semibold leading-[1.05] sm:text-5xl">{names}</h1>
            <p className="mt-1.5 text-white/85">
              {wedding.wedding_date ? formatDate(wedding.wedding_date) : 'Tanggal belum ditentukan'} · {wedding.city}
            </p>
          </div>
          {daysLeft != null && daysLeft >= 0 && (
            <div className="flex items-center gap-3 self-start rounded-2xl border border-white/25 bg-white/15 px-4 py-3 backdrop-blur-md sm:self-auto">
              <CalendarHeart className="size-6 text-gold-on-dark" aria-hidden />
              <div>
                <p className="tabular font-num text-3xl font-semibold leading-none">
                  {daysLeft === 0 ? 'Hari ini' : <CountUp value={daysLeft} format={(n) => String(n)} />}
                </p>
                {daysLeft > 0 && <p className="text-xs font-medium text-white/80">hari menuju hari H</p>}
              </div>
            </div>
          )}
        </div>
      </m.header>

      {flash && <Alert tone="success">{flash}</Alert>}

      {!partner && <PartnerInvite />}

      {state.status === 'loading' && <DashboardSkeleton />}
      {state.status === 'error' && <ErrorState message="Ringkasan dashboard gagal dimuat. Periksa koneksi internetmu." onRetry={() => void reload()} />}
      {state.status === 'ready' && <DashboardContent wedding={wedding} data={state.data} />}
    </div>
  )
}

function DashboardContent({ wedding, data }: { wedding: Wedding; data: DashboardData }) {
  const summary = useMemo(() => calculateFinance({ wedding, ...data }), [wedding, data])
  const vendorNames = useMemo(() => new Map(data.vendors.map((v) => [v.id, v.custom_name ?? 'vendor'])), [data.vendors])
  const priorities = useMemo(
    () => buildPriorities({ wedding, summary, tasks: data.tasks, payments: data.payments, vendorNames }),
    [wedding, summary, data, vendorNames],
  )
  const doneTasks = data.tasks.filter((t) => t.status === 'done').length
  const chosenVendors = data.vendors.filter((v) => v.status === 'dipilih').length
  const duePayments = upcomingPayments(data.payments, new Date(), 30).length
  const isFresh = data.expenses.length === 0 && data.vendors.length === 0 && data.payments.length === 0

  return (
    <>
      <FinanceHero summary={summary} />
      <FinanceTiles summary={summary} weddingDate={wedding.wedding_date} />

      {isFresh && <GettingStarted />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <PriorityList items={priorities} />
        <div className="space-y-6">
          <PlanningProgress done={doneTasks} total={data.tasks.length} chosenVendors={chosenVendors} duePayments={duePayments} />
          <QuickActions />
        </div>
      </div>
    </>
  )
}

function FinanceHero({ summary }: { summary: FinanceSummary }) {
  const used = percent(summary.actualSpent, summary.totalBudget)
  const over = summary.remainingBudget < 0
  return (
    <section aria-labelledby="finance-title" className="relative overflow-hidden rounded-[1.5rem] bg-primary p-6 text-on-primary shadow-card sm:p-8">
      <svg className="pointer-events-none absolute -right-16 -top-20 size-72 opacity-20" viewBox="0 0 200 200" aria-hidden>
        <circle cx="80" cy="100" r="60" fill="none" stroke="var(--color-gold)" strokeWidth="1" />
        <circle cx="120" cy="100" r="60" fill="none" stroke="#fff" strokeWidth="1" />
      </svg>
      <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <h2 id="finance-title" className="text-sm font-medium text-on-primary/75">
            Sisa anggaran
          </h2>
          <p className={cn('tabular mt-1 font-num text-5xl font-semibold leading-none sm:text-6xl', over && 'text-[#ffd5cf]')}>
            <CountUp value={summary.remainingBudget} format={formatRupiah} />
          </p>
          <p className="mt-3 text-sm text-on-primary/75">
            Dari total anggaran <span className="tabular font-semibold text-on-primary">{formatRupiah(summary.totalBudget)}</span>
            {summary.budgetTarget !== summary.totalBudget && (
              <> · target <span className="tabular font-semibold text-on-primary">{formatRupiah(summary.budgetTarget)}</span></>
            )}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm md:text-right">
          <dt className="text-on-primary/70">Pengeluaran aktual</dt>
          <dd className="tabular text-right font-semibold">{formatRupiah(summary.actualSpent)}</dd>
          <dt className="text-on-primary/70">Terpakai</dt>
          <dd className="tabular text-right font-semibold">{used}%</dd>
        </dl>
      </div>
      <div className="relative mt-6">
        <div
          role="progressbar"
          aria-label="Persentase anggaran terpakai"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 overflow-hidden rounded-full bg-white/15"
        >
          <m.div className="h-full origin-left rounded-full bg-gold" initial={{ scaleX: 0 }} animate={{ scaleX: used / 100 }} transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.2 }} />
        </div>
        {over && (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#ffd5cf]">
            <AlertTriangle className="size-4" aria-hidden /> Pengeluaran aktual sudah melampaui total anggaran.
          </p>
        )}
      </div>
    </section>
  )
}

function FinanceTiles({ summary, weddingDate }: { summary: FinanceSummary; weddingDate: string | null }) {
  const shortfall = summary.unallocatedFunds < 0 ? -summary.unallocatedFunds : 0
  const monthly = monthlySavingNeeded(shortfall, weddingDate)
  const tiles: { label: string; value: number; hint: string; icon: LucideIcon; tone?: 'danger' }[] = [
    { label: 'Dana tersedia', value: summary.availableFunds, hint: 'Total dana yang sudah terkumpul', icon: Wallet },
    { label: 'Saldo dana', value: summary.cashOnHand, hint: 'Dana tersedia − yang sudah dibayar', icon: CircleDollarSign },
    { label: 'Komitmen vendor', value: summary.contractTotal, hint: `Sudah dibayar ${formatRupiah(summary.paidToVendors)}`, icon: Store },
    { label: 'Sisa tagihan', value: summary.outstandingBills, hint: 'Kontrak yang belum dilunasi', icon: ReceiptText },
    {
      label: shortfall > 0 ? 'Kekurangan dana' : 'Dana belum dialokasikan',
      value: shortfall > 0 ? shortfall : summary.unallocatedFunds,
      hint: shortfall > 0 ? (monthly ? `± ${formatRupiah(monthly)}/bulan sampai hari H` : 'Saldo belum menutup kewajiban') : 'Saldo setelah semua kewajiban',
      icon: shortfall > 0 ? AlertTriangle : CircleDollarSign,
      tone: shortfall > 0 ? 'danger' : undefined,
    },
  ]
  return (
    <section aria-label="Ringkasan keuangan">
      <Stagger as="ul" inView={false} delay={0.15} className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6">
        {tiles.map(({ label, value, hint, icon: Icon, tone }, i) => (
          <StaggerItem
            as="li"
            key={label}
            className={cn(
              'rounded-card border bg-surface p-4 shadow-card sm:p-5',
              tone === 'danger' ? 'border-danger/30 bg-danger-soft/40' : 'border-border',
              // Mobile: 2 kolom (tile terakhir penuh). md+: 3 tile atas, 2 tile bawah lebih lebar.
              i < 3 ? 'md:col-span-2' : 'md:col-span-3',
              i === tiles.length - 1 && 'col-span-2',
            )}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
              <Icon className={cn('size-4', tone === 'danger' ? 'text-danger' : 'text-gold-text')} aria-hidden />
              {label}
            </div>
            <p className={cn('tabular mt-2 whitespace-nowrap text-[1.05rem] font-bold sm:text-xl', tone === 'danger' ? 'text-danger' : 'text-ink')}>
              <CountUp value={value} format={formatRupiah} />
            </p>
            <p className="mt-1 text-xs text-ink-muted">{hint}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}

function GettingStarted() {
  const steps = [
    { title: 'Sesuaikan anggaran', text: 'Cek alokasi tiap kategori dan ubah sesuai kebutuhanmu.', to: '/app/budget' },
    { title: 'Catat vendor', text: 'Simpan vendor yang sedang kamu pertimbangkan beserta penawarannya.', to: '/app/vendors' },
    { title: 'Mulai checklist', text: 'Checklist dasar sudah dibuat. Tandai yang sudah selesai.', to: '/app/checklist' },
  ]
  return (
    <Card>
      <CardHeader title="Mulai dari sini" description="Belum ada transaksi atau vendor. Tiga langkah ini membantu rencanamu terbentuk." />
      <CardBody>
        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Link
                to={s.to}
                className="group flex h-full gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-soft font-display text-lg font-bold text-gold-text">
                  {i + 1}
                </span>
                <span>
                  <span className="flex items-center gap-1 font-semibold text-ink">
                    {s.title}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{s.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  )
}

const kindIcon: Record<PriorityItem['kind'], LucideIcon> = {
  task: ListChecks,
  payment: ReceiptText,
  budget: Wallet,
  profile: CalendarHeart,
}

function PriorityList({ items }: { items: PriorityItem[] }) {
  return (
    <Card>
      <CardHeader title="Prioritas berikutnya" description="Tugas, tagihan, dan hal yang perlu perhatianmu." />
      <CardBody className="pt-4">
        {items.length === 0 ? (
          <p className="rounded-xl bg-success-soft/60 px-4 py-6 text-center text-sm text-ink-muted">
            Tidak ada tenggat atau tagihan mendesak dalam waktu dekat.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const Icon = kindIcon[item.kind]
              return (
                <li key={item.id}>
                  <Link to={item.to} className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-surface-muted">
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        item.tone === 'danger' ? 'bg-danger-soft text-danger' : item.tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary',
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[0.95rem] font-semibold text-ink sm:line-clamp-1">{item.title}</span>
                      <span className="block text-sm text-ink-muted">{item.detail}</span>
                      {/* Mobile: badge di bawah judul agar judul tidak terpotong */}
                      <span className="mt-1 block sm:hidden">
                        <PriorityBadge tone={item.tone} />
                      </span>
                    </span>
                    <span className="hidden sm:block">
                      <PriorityBadge tone={item.tone} />
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

function PriorityBadge({ tone }: { tone: PriorityItem['tone'] }) {
  if (tone === 'danger') return <Badge tone="danger">Mendesak</Badge>
  if (tone === 'warning') return <Badge tone="warning">Segera</Badge>
  return null
}

function PlanningProgress({ done, total, chosenVendors, duePayments }: { done: number; total: number; chosenVendors: number; duePayments: number }) {
  const pct = percent(done, total)
  return (
    <Card>
      <CardHeader title="Progress perencanaan" />
      <CardBody className="space-y-5 pt-4">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-ink-muted">
              <span className="tabular font-semibold text-ink">{done}</span> dari <span className="tabular">{total}</span> tugas selesai
            </span>
            <span className="tabular font-num text-2xl font-semibold text-primary">{pct}%</span>
          </div>
          <ProgressBar value={pct} label="Persentase tugas selesai" />
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-muted/70 p-3">
            <dt className="text-xs font-medium text-ink-muted">Vendor dipilih</dt>
            <dd className="tabular mt-1 text-xl font-bold text-ink">{chosenVendors}</dd>
          </div>
          <div className="rounded-xl bg-surface-muted/70 p-3">
            <dt className="text-xs font-medium text-ink-muted">Tagihan ≤ 30 hari</dt>
            <dd className="tabular mt-1 text-xl font-bold text-ink">{duePayments}</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  )
}

function QuickActions() {
  const actions: { label: string; to: string; icon: LucideIcon }[] = [
    { label: 'Tabungan', to: '/app/tabungan#catat', icon: PiggyBank },
    { label: 'Pengeluaran', to: '/app/budget', icon: ReceiptText },
    { label: 'Vendor', to: '/app/vendors', icon: Store },
    { label: 'Tugas', to: '/app/checklist', icon: ListChecks },
    { label: 'Tamu', to: '/app/guests', icon: UserPlus },
    { label: 'Jadwal acara', to: '/app/rundown', icon: CalendarClock },
  ]
  return (
    <Card>
      <CardHeader title="Tambah cepat" />
      <CardBody className="pt-4">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">
          {actions.map(({ label, to, icon: Icon }) => (
            <li key={label}>
              <Link
                to={to}
                className="flex min-h-[5rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-3 text-center text-xs font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-soft/50"
              >
                <Icon className="size-5 text-primary" aria-hidden />
                <span>
                  <span className="sr-only">Tambah </span>
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat ringkasan">
      <Skeleton className="h-52 rounded-[1.5rem]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className={cn('h-28 rounded-card', i < 3 ? 'md:col-span-2' : 'md:col-span-3', i === 4 && 'col-span-2')} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Skeleton className="h-80 rounded-card" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    </div>
  )
}
