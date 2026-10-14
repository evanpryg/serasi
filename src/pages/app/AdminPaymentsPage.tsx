import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { Check, Inbox, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, Card } from '@/components/ui/Card'
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ChipGroup } from '@/components/ui/PageKit'
import { usePremium } from '@/hooks/usePremium'
import { db } from '@/lib/supabase'
import { formatRupiah } from '@/lib/format'
import type { AdminPaymentOrder, PaymentOrderStatus } from '@/lib/database.types'

type Filter = 'awaiting_verification' | 'pending' | 'paid' | 'all'

const timeFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const STATUS: Record<PaymentOrderStatus, { label: string; tone: 'gold' | 'neutral' | 'success' | 'danger' }> = {
  awaiting_verification: { label: 'Perlu dicek', tone: 'gold' },
  pending: { label: 'Belum bayar', tone: 'neutral' },
  paid: { label: 'Lunas', tone: 'success' },
  rejected: { label: 'Ditolak', tone: 'danger' },
  expired: { label: 'Kedaluwarsa', tone: 'neutral' },
  cancelled: { label: 'Dibatalkan', tone: 'neutral' },
}

/** Khusus admin aplikasi: cocokkan nominal unik dengan dana masuk di aplikasi merchant QRIS. */
export function AdminPaymentsPage() {
  const { isAdmin, loading } = usePremium()
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
    if (isAdmin) void load()
  }, [isAdmin, load])

  if (loading) return <Skeleton className="h-64 rounded-card" />
  if (!isAdmin) return <Navigate to="/app/dashboard" replace />

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.2rem] font-semibold leading-tight sm:text-[2.75rem]">Verifikasi pembayaran</h1>
          <p className="mt-1 max-w-2xl text-ink-muted">
            Cocokkan <strong className="text-ink">nominal persis</strong> dengan dana masuk di aplikasi merchant QRIS, lalu tandai lunas. Premium aktif seketika untuk pasangan tersebut.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load()} icon={<RefreshCw className="size-4" aria-hidden />}>
          Muat ulang
        </Button>
      </header>

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

      {failed ? (
        <ErrorState message="Daftar pembayaran gagal dimuat." onRetry={() => void load()} />
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
