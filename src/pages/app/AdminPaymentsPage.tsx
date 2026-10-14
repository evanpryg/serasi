import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { Check, CreditCard, Crown, Inbox, RefreshCw, Search, ShieldAlert, ShieldCheck, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, Card } from '@/components/ui/Card'
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ChipGroup } from '@/components/ui/PageKit'
import { usePremium } from '@/hooks/usePremium'
import { db } from '@/lib/supabase'
import { formatDate, formatRupiah } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { AdminPaymentOrder, AdminWorkspaceItem, PaymentOrderStatus } from '@/lib/database.types'

type Filter = 'awaiting_verification' | 'pending' | 'paid' | 'all'
type MainTab = 'orders' | 'workspaces'

const timeFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const STATUS: Record<PaymentOrderStatus, { label: string; tone: 'gold' | 'neutral' | 'success' | 'danger' }> = {
  awaiting_verification: { label: 'Perlu dicek', tone: 'gold' },
  pending: { label: 'Belum bayar', tone: 'neutral' },
  paid: { label: 'Lunas', tone: 'success' },
  rejected: { label: 'Ditolak', tone: 'danger' },
  expired: { label: 'Kedaluwarsa', tone: 'neutral' },
  cancelled: { label: 'Dibatalkan', tone: 'neutral' },
}

/** Khusus admin aplikasi: verifikasi bukti pembayaran QRIS dan kelola hak Premium user. */
export function AdminPaymentsPage() {
  const { isAdmin, loading } = usePremium()
  const [tab, setTab] = useState<MainTab>('orders')

  if (loading) return <Skeleton className="h-64 rounded-card" />
  if (!isAdmin) return <Navigate to="/app/dashboard" replace />

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="size-4" aria-hidden />
            <span>Panel Admin Serasi</span>
          </div>
          <h1 className="mt-1 font-display text-[2.2rem] font-semibold leading-tight sm:text-[2.75rem]">
            {tab === 'orders' ? 'Verifikasi Pembayaran' : 'Kelola Akun Premium'}
          </h1>
          <p className="mt-1 max-w-2xl text-ink-muted">
            {tab === 'orders'
              ? 'Cocokkan nominal unik dengan dana masuk di aplikasi merchant QRIS, lalu tandai lunas untuk mengaktifkan Premium.'
              : 'Daftar semua workspace pernikahan dan hak akses Premium. Anda dapat mengaktifkan atau mencabut Premium secara manual.'}
          </p>
        </div>
      </header>

      {/* Tab navigasi admin */}
      <div className="flex gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors -mb-1',
            tab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          <CreditCard className="size-4" aria-hidden />
          Verifikasi Pesanan
        </button>
        <button
          type="button"
          onClick={() => setTab('workspaces')}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors -mb-1',
            tab === 'workspaces' ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          <Users className="size-4" aria-hidden />
          Daftar Akun User & Status Premium
        </button>
      </div>

      {tab === 'orders' ? <OrdersTab /> : <WorkspacesTab />}
    </div>
  )
}

function OrdersTab() {
  const [filter, setFilter] = useState<Filter>('awaiting_verification')
  const [rows, setRows] = useState<AdminPaymentOrder[] | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setFailed(false)
    const { data, error } = await db().rpc('admin_payment_orders', { p_status: filter === 'all' ? null : filter })
    if (error) return setFailed(true)
    setRows(data ?? [])
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ChipGroup<Filter>
          label="Saring status pembayaran"
          value={filter}
          onChange={(v) => {
            setRows(null)
            setFilter(v)
          }}
          options={[
            { value: 'awaiting_verification', label: 'Perlu dicek' },
            { value: 'pending', label: 'Belum bayar' },
            { value: 'paid', label: 'Lunas' },
            { value: 'all', label: 'Semua' },
          ]}
        />
        <Button variant="secondary" size="sm" onClick={() => void load()} icon={<RefreshCw className="size-3.5" aria-hidden />}>
          Muat ulang
        </Button>
      </div>

      {failed ? (
        <ErrorState message="Daftar pembayaran gagal dimuat. Pastikan migration pembayaran sudah dijalankan di Supabase." onRetry={() => void load()} />
      ) : rows == null ? (
        <Skeleton className="h-48 rounded-card" />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Inbox className="size-7" aria-hidden />} title="Tidak ada pembayaran" description="Belum ada pembayaran dengan status ini." />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {rows.map((r) => (
            <OrderRow key={r.id} row={r} onDone={load} />
          ))}
        </Card>
      )}
    </div>
  )
}

function WorkspacesTab() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<AdminWorkspaceItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setFailed(false)
    setActionError(null)
    const { data, error } = await db().rpc('admin_list_workspaces', { p_search: query.trim() || null })
    if (error) return setFailed(true)
    setItems(data ?? [])
  }, [query])

  useEffect(() => {
    void load()
  }, [load])

  const handleToggle = async (weddingId: string, currentPremium: boolean, title: string) => {
    setActionError(null)
    setActionSuccess(null)
    const nextState = !currentPremium
    const confirmed = window.confirm(
      nextState
        ? `Aktifkan paket Premium untuk workspace "${title}"?`
        : `Cabut status Premium dari workspace "${title}"?`,
    )
    if (!confirmed) return

    const { error } = await db().rpc('admin_set_wedding_premium', {
      p_wedding_id: weddingId,
      p_is_premium: nextState,
    })

    if (error) {
      setActionError(`Gagal memperbarui status: ${error.message}`)
      return
    }

    setActionSuccess(`Status Premium untuk "${title}" berhasil ${nextState ? 'diaktifkan' : 'dinonaktifkan'}.`)
    void load()
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(search)
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama pernikahan atau email pengguna…"
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <Button type="submit" variant="secondary">
          Cari
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSearch('')
            setQuery('')
          }}
        >
          Reset
        </Button>
      </form>

      {actionError && <Alert tone="danger">{actionError}</Alert>}
      {actionSuccess && <Alert tone="success">{actionSuccess}</Alert>}

      {failed ? (
        <ErrorState message="Gagal memuat daftar workspace. Pastikan migration 20261014000010_admin_evanpray.sql sudah dijalankan di Supabase." onRetry={() => void load()} />
      ) : items == null ? (
        <Skeleton className="h-48 rounded-card" />
      ) : items.length === 0 ? (
        <EmptyState icon={<Users className="size-7" aria-hidden />} title="Tidak ada workspace" description="Tidak ditemukan workspace pernikahan sesuai kriteria pencarian." />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {items.map((w) => (
            <article key={w.wedding_id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-ink text-base">{w.title}</h3>
                  <Badge tone={w.is_premium ? 'success' : 'neutral'}>
                    {w.is_premium ? 'Premium' : 'Gratis'}
                  </Badge>
                </div>
                <div className="text-xs text-ink-muted space-y-0.5">
                  <p>
                    <strong className="text-ink">Owner:</strong> {w.owner_name ?? '—'} ({w.owner_email ?? '—'})
                  </p>
                  {w.partner_email && (
                    <p>
                      <strong className="text-ink">Pasangan:</strong> {w.partner_name ?? '—'} ({w.partner_email})
                    </p>
                  )}
                  <p className="text-ink-subtle">
                    Dibuat: {formatDate(w.created_at.slice(0, 10))}
                    {w.is_premium && w.activated_at && ` · Premium aktif sejak: ${formatDate(w.activated_at.slice(0, 10))}`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant={w.is_premium ? 'danger' : 'primary'}
                  icon={w.is_premium ? <ShieldAlert className="size-4" aria-hidden /> : <Crown className="size-4" aria-hidden />}
                  onClick={() => void handleToggle(w.wedding_id, w.is_premium, w.title)}
                >
                  {w.is_premium ? 'Cabut Premium' : 'Aktifkan Premium'}
                </Button>
              </div>
            </article>
          ))}
        </Card>
      )}
    </div>
  )
}

function OrderRow({ row, onDone }: { row: AdminPaymentOrder; onDone: () => Promise<void> }) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const st = STATUS[row.status]
  const reviewable = row.status === 'awaiting_verification' || row.status === 'pending' || row.status === 'expired' || row.status === 'rejected'

  async function review(approve: boolean) {
    setBusy(true)
    setError(null)
    const { error: err } = await db().rpc('admin_review_payment', { p_order_id: row.id, p_approve: approve, p_note: note.trim() || null })
    setBusy(false)
    if (err) return setError('Gagal menyimpan. Coba lagi.')
    setMode('idle')
    await onDone()
  }

  return (
    <article className="space-y-3 p-4 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-num text-2xl font-bold text-ink tabular">{formatRupiah(row.amount)}</p>
          <p className="text-xs text-ink-subtle tabular">
            {row.code} · kode unik {row.unique_code}
          </p>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="sr-only">Workspace</dt>
          <dd className="truncate font-semibold text-ink">{row.wedding_title}</dd>
        </div>
        <div className="min-w-0">
          <dt className="sr-only">Pemesan</dt>
          <dd className="truncate text-ink-muted">{[row.user_name, row.user_email].filter(Boolean).join(' · ')}</dd>
        </div>
        <div>
          <dt className="inline text-ink-muted">Nama pembayar: </dt>
          <dd className="inline font-medium text-ink">{row.payer_name ?? '—'}</dd>
        </div>
        <div>
          <dt className="inline text-ink-muted">{row.claimed_at ? 'Konfirmasi: ' : 'Dibuat: '}</dt>
          <dd className="inline text-ink">{timeFmt.format(new Date(row.claimed_at ?? row.created_at))}</dd>
        </div>
        {row.admin_note && (
          <div className="sm:col-span-2">
            <dt className="inline text-ink-muted">Catatan: </dt>
            <dd className="inline text-ink">{row.admin_note}</dd>
          </div>
        )}
      </dl>

      {error && <Alert tone="danger">{error}</Alert>}

      {reviewable && mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setMode('approve')} icon={<Check className="size-4" aria-hidden />}>
            Tandai lunas
          </Button>
          {row.status !== 'rejected' && (
            <Button size="sm" variant="ghost" onClick={() => setMode('reject')} icon={<X className="size-4" aria-hidden />}>
              Tolak
            </Button>
          )}
        </div>
      )}

      {mode !== 'idle' && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-muted/60 p-3">
          <p className="text-sm font-semibold text-ink">
            {mode === 'approve' ? `Dana ${formatRupiah(row.amount)} sudah masuk? Premium akan langsung aktif.` : 'Tolak pembayaran ini?'}
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            aria-label="Catatan untuk pengguna"
            placeholder={mode === 'approve' ? 'Catatan (opsional)' : 'Alasan, contoh: dana tidak ditemukan'}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <div className="flex gap-2">
            <Button size="sm" variant={mode === 'approve' ? 'primary' : 'danger'} loading={busy} onClick={() => void review(mode === 'approve')}>
              {mode === 'approve' ? 'Ya, lunas' : 'Ya, tolak'}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setMode('idle')}>
              Batal
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}
