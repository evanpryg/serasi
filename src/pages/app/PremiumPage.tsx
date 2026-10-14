import { useEffect, useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Download,
  Hourglass,
  MessageCircle,
  Minus,
  QrCode as QrIcon,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { m } from '@/components/motion'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert, Skeleton } from '@/components/ui/Feedback'
import { PremiumBadge } from '@/components/premium/Premium'
import { QrCode, qrPngBlob } from '@/components/premium/QrCode'
import { firstName, useWorkspace } from '@/auth/WorkspaceProvider'
import { isOrderPayable, usePremium } from '@/hooks/usePremium'
import { PAYMENT_WHATSAPP, QRIS_PAYLOAD } from '@/lib/config'
import { cn } from '@/lib/cn'
import { formatDate, formatRupiah } from '@/lib/format'
import { PLAN_ROWS, PREMIUM_HIGHLIGHTS, UPGRADE_REASON, isUpgradeSource, type PlanRow } from '@/lib/plans'
import { merchantName, withAmount } from '@/lib/qris'
import type { PaymentOrder } from '@/lib/database.types'

const timeFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const MERCHANT = merchantName(QRIS_PAYLOAD) ?? 'merchant QRIS'

export function PremiumPage() {
  const premium = usePremium()
  const [params] = useSearchParams()
  const source = params.get('dari')
  const reason = isUpgradeSource(source) ? UPGRADE_REASON[source] : null
  const { order } = premium

  // Saat menunggu verifikasi: cek ulang berkala selama tab terlihat.
  const waiting = order?.status === 'awaiting_verification' && !premium.isPremium
  useEffect(() => {
    if (!waiting) return
    const tick = () => document.visibilityState === 'visible' && void premium.refresh()
    const id = window.setInterval(tick, 20_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [waiting, premium])

  if (premium.loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <header>
        <h1 className="flex flex-wrap items-center gap-3 font-display text-[2.2rem] font-semibold leading-tight sm:text-[2.75rem]">
          Premium {premium.isPremium && <PremiumBadge label="Aktif" className="text-sm" />}
        </h1>
        <p className="mt-1 max-w-2xl text-ink-muted">Sekali bayar untuk berdua. Tanpa langganan, tanpa tagihan bulanan.</p>
      </header>

      {premium.isPremium ? (
        <ActiveState />
      ) : waiting ? (
        <WaitingState order={order} />
      ) : isOrderPayable(order) ? (
        <CheckoutState order={order} />
      ) : (
        <OfferState reason={reason} />
      )}

      {premium.isAdmin && (
        <Link
          to="/app/admin/pembayaran"
          className="flex min-h-14 items-center justify-between gap-3 rounded-card border border-dashed border-border-strong bg-surface px-5 text-sm font-semibold text-ink hover:bg-surface-muted"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" aria-hidden /> Verifikasi pembayaran (admin)
          </span>
          <ArrowRight className="size-4 text-ink-subtle" aria-hidden />
        </Link>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Penawaran */

function OfferState({ reason }: { reason: string | null }) {
  const { price, order, startOrder, isDemo, paymentsReady } = usePremium()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      await startOrder()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kode pembayaran gagal dibuat.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {reason && (
        <p className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold-soft/60 px-4 py-3 text-sm font-medium text-ink">
          <Crown className="size-4 shrink-0 text-gold-text" aria-hidden /> {reason}
        </p>
      )}
      {order?.status === 'rejected' && (
        <Alert tone="danger" title="Pembayaran sebelumnya belum bisa kami verifikasi">
          {order.admin_note ?? 'Dana dengan nominal tersebut tidak kami temukan.'} Jika kamu sudah membayar, hubungi kami dengan kode {order.code}.
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* Kartu harga — paling atas di mobile */}
        <Card className="overflow-hidden lg:order-2 lg:sticky lg:top-6">
          <div className="bg-primary px-5 py-6 text-on-primary sm:px-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-gold-on-dark">
              <Crown className="size-4" aria-hidden /> Serasi Premium
            </p>
            <p className="mt-2 font-num text-[2.6rem] font-bold leading-none tabular">{formatRupiah(price)}</p>
            <p className="mt-2 text-sm text-on-primary/80">Sekali bayar · untuk berdua · aktif selamanya</p>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <ul className="space-y-2.5">
              {PREMIUM_HIGHLIGHTS.map((h) => (
                <li key={h.title} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  <span>
                    <strong className="font-semibold text-ink">{h.title}.</strong> <span className="text-ink-muted">{h.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            {error && <Alert tone="danger">{error}</Alert>}
            {isDemo ? (
              <div className="space-y-2">
                <Alert tone="info">Ini akun demo, jadi pembayaran tidak diproses. Daftar akun untuk upgrade sungguhan.</Alert>
                <ButtonLink to="/register" size="lg" className="w-full">
                  Daftar gratis
                </ButtonLink>
              </div>
            ) : !paymentsReady ? (
              <Alert tone="warning">Pembayaran sedang disiapkan. Coba lagi beberapa saat lagi.</Alert>
            ) : (
              <Button size="lg" className="w-full" loading={busy} onClick={() => void start()} icon={<QrIcon className="size-4" aria-hidden />}>
                Bayar dengan QRIS
              </Button>
            )}
            <p className="flex items-start gap-2 text-xs text-ink-muted">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-ink-subtle" aria-hidden />
              Bisa dibayar dari semua e-wallet & m-banking (GoPay, OVO, DANA, ShopeePay, BCA, dll.). Aktif setelah pembayaran kami verifikasi.
            </p>
          </div>
        </Card>

        <div className="space-y-5 lg:order-1">
          <ComparisonTable />
          <Faq />
        </div>
      </div>
    </>
  )
}

function Cell({ value, premium }: { value: PlanRow['free']; premium?: boolean }) {
  if (value === true)
    return (
      <>
        <Check className={cn('mx-auto size-5', premium ? 'text-success' : 'text-ink-muted')} aria-hidden />
        <span className="sr-only">Termasuk</span>
      </>
    )
  if (value === false)
    return (
      <>
        <Minus className="mx-auto size-5 text-ink-subtle" aria-hidden />
        <span className="sr-only">Tidak termasuk</span>
      </>
    )
  return <span className={cn('text-sm', premium ? 'font-semibold text-ink' : 'text-ink-muted')}>{value}</span>
}

function ComparisonTable() {
  return (
    <Card className="overflow-hidden">
      <table className="w-full table-fixed text-left">
        <caption className="sr-only">Perbandingan paket Gratis dan Premium</caption>
        <thead>
          <tr className="border-b border-border bg-surface-muted/60 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <th scope="col" className="w-[46%] px-4 py-3 sm:px-5">
              Fitur
            </th>
            <th scope="col" className="px-2 py-3 text-center">
              Gratis
            </th>
            <th scope="col" className="px-2 py-3 text-center text-gold-text">
              Premium
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {PLAN_ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="px-4 py-3 text-sm font-medium text-ink sm:px-5">
                {row.label}
              </th>
              <td className="px-2 py-3 text-center">
                <Cell value={row.free} />
              </td>
              <td className="bg-gold-soft/30 px-2 py-3 text-center">
                <Cell value={row.premium} premium />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

const FAQ = [
  {
    q: 'Kenapa sekali bayar, bukan langganan?',
    a: 'Persiapan pernikahan punya akhir. Kalian cukup bayar sekali, Premium aktif untuk kalian berdua dan tidak pernah ditagih lagi.',
  },
  {
    q: 'Bagaimana kalau sudah bayar tapi belum aktif?',
    a: 'Pembayaran dicocokkan dari nominal unik, biasanya kurang dari 1×24 jam. Premium otomatis aktif di akun kalian berdua. Jika lebih lama, hubungi kami dengan kode pembayaran.',
  },
  {
    q: 'Apakah data saya hilang jika tidak upgrade?',
    a: 'Tidak. Semua fitur perencanaan inti tetap gratis dan datamu selalu bisa diunduh dari Pengaturan.',
  },
]

function Faq() {
  return (
    <div className="divide-y divide-border rounded-card border border-border bg-surface">
      {FAQ.map((f) => (
        <details key={f.q} className="group px-4 sm:px-5">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-ink">
            {f.q}
            <span aria-hidden className="text-lg leading-none text-ink-subtle transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="pb-4 text-sm text-ink-muted">{f.a}</p>
        </details>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ Checkout */

function CheckoutState({ order }: { order: PaymentOrder }) {
  const { claimOrder, cancelOrder } = usePremium()
  const payload = withAmount(QRIS_PAYLOAD, order.amount)
  const nameId = useId()
  const [payer, setPayer] = useState('')
  const [busy, setBusy] = useState<'claim' | 'cancel' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function copyAmount() {
    try {
      await navigator.clipboard.writeText(String(order.amount))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard tidak tersedia: nominal tetap terlihat */
    }
  }

  async function saveQr() {
    const blob = await qrPngBlob(payload, formatRupiah(order.amount), `Serasi Premium · ${order.code}`)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `serasi-qris-${order.code}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function run(kind: 'claim' | 'cancel') {
    setBusy(kind)
    setError(null)
    try {
      if (kind === 'claim') await claimOrder(payer)
      else await cancelOrder()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="mx-auto max-w-xl overflow-hidden">
      <ol className="grid grid-cols-3 border-b border-border text-center text-xs font-semibold text-ink-muted">
        {['Pindai QRIS', 'Bayar', 'Konfirmasi'].map((s, i) => (
          <li key={s} className={cn('flex flex-col items-center gap-1 py-3', i < 2 && 'border-r border-border')}>
            <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-primary tabular">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="text-center">
          <p className="text-sm text-ink-muted">Total bayar</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <p className="font-num text-[2.4rem] font-bold leading-none text-ink tabular">{formatRupiah(order.amount)}</p>
            <button
              type="button"
              onClick={() => void copyAmount()}
              aria-label="Salin nominal"
              title="Salin nominal"
              className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink-subtle hover:bg-surface-muted hover:text-ink"
            >
              {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-subtle tabular">
            {formatRupiah(order.base_amount)} − kode unik {formatRupiah(order.unique_code)}
          </p>
          <p role="status" className="sr-only">
            {copied ? 'Nominal tersalin' : ''}
          </p>
        </div>

        <div className="mx-auto w-full max-w-[17rem] rounded-2xl border border-border bg-white p-2 shadow-card">
          <QrCode value={payload} label={`Kode QRIS untuk membayar ${formatRupiah(order.amount)}`} className="aspect-square w-full" />
        </div>
        <p className="text-center text-sm text-ink-muted">
          Nominal sudah terisi otomatis. Nama merchant yang muncul: <strong className="text-ink">{MERCHANT}</strong>.
        </p>

        <div className="flex gap-3 rounded-xl bg-surface-muted/70 p-3.5 text-sm text-ink-muted">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p>
              <strong className="text-ink">Bayar dari HP ini?</strong> Simpan gambar QR, lalu di aplikasi pembayaran pilih <em>Scan</em> → <em>Galeri</em>.
            </p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => void saveQr()} icon={<Download className="size-4" aria-hidden />}>
              Simpan gambar QR
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <label htmlFor={nameId} className="text-sm font-semibold text-ink">
            Nama di aplikasi pembayaranmu <span className="font-normal text-ink-subtle">(opsional)</span>
          </label>
          <input
            id={nameId}
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            maxLength={80}
            autoComplete="name"
            placeholder="Contoh: ANDI WIJAYA"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-canvas px-3.5 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <p className="mt-1 text-xs text-ink-subtle">Membantu kami mencocokkan pembayaran lebih cepat.</p>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        <div className="space-y-2">
          <Button size="lg" className="w-full" loading={busy === 'claim'} disabled={busy !== null} onClick={() => void run('claim')} icon={<CheckCircle2 className="size-4" aria-hidden />}>
            Saya sudah bayar
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-subtle">
            <span>
              Kode {order.code} · berlaku sampai {timeFmt.format(new Date(order.expires_at))}
            </span>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void run('cancel')}
              className="min-h-10 cursor-pointer rounded-lg px-2 font-semibold text-ink-muted hover:text-ink disabled:opacity-50"
            >
              Batalkan
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ Menunggu verifikasi */

function WaitingState({ order }: { order: PaymentOrder | null }) {
  const { refresh } = usePremium()
  const [checking, setChecking] = useState(false)
  if (!order) return null

  const wa = PAYMENT_WHATSAPP
    ? `https://wa.me/${PAYMENT_WHATSAPP}?text=${encodeURIComponent(
        `Halo, saya sudah membayar Serasi Premium.\nKode: ${order.code}\nNominal: ${formatRupiah(order.amount)}\n(Bukti transfer saya lampirkan)`,
      )}`
    : null

  return (
    <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
      <m.span
        className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gold-soft text-gold-text"
        animate={{ rotate: [0, 180, 180, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', times: [0, 0.4, 0.6, 1] }}
      >
        <Hourglass className="size-7" aria-hidden />
      </m.span>
      <div role="status">
        <h2 className="mt-4 font-display text-3xl font-semibold">Pembayaran sedang diverifikasi</h2>
        <p className="mt-2 text-ink-muted">
          Premium otomatis aktif di akun kalian berdua setelah dana kami terima, biasanya kurang dari 1×24 jam. Halaman ini memeriksa sendiri.
        </p>
      </div>
      <dl className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3 rounded-xl bg-surface-muted/70 p-4 text-left text-sm">
        <div>
          <dt className="text-xs text-ink-muted">Kode</dt>
          <dd className="font-semibold text-ink tabular">{order.code}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Nominal</dt>
          <dd className="font-semibold text-ink tabular">{formatRupiah(order.amount)}</dd>
        </div>
        {order.claimed_at && (
          <div className="col-span-2">
            <dt className="text-xs text-ink-muted">Dikonfirmasi</dt>
            <dd className="text-ink">{timeFmt.format(new Date(order.claimed_at))}</dd>
          </div>
        )}
      </dl>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variant="secondary"
          loading={checking}
          onClick={async () => {
            setChecking(true)
            await refresh()
            setChecking(false)
          }}
          icon={<RefreshCw className="size-4" aria-hidden />}
        >
          Cek status
        </Button>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-success px-5 text-[0.95rem] font-semibold text-white hover:brightness-110">
            <MessageCircle className="size-4" aria-hidden /> Kirim bukti via WhatsApp
          </a>
        )}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ Aktif */

function ActiveState() {
  const { entitlement, isDemo } = usePremium()
  const { couple } = useWorkspace()
  const names = couple.map((c) => firstName(c.name)).join(' & ')
  const links = [
    { to: '/app/guests', label: 'Daftar tamu tanpa batas' },
    { to: '/app/kita/kepribadian', label: 'Analisis kepribadian lengkap' },
    { to: '/app/kita/deeptalk', label: 'Semua pertanyaan deep talk' },
    { to: '/app/budget', label: 'Foto barang & bukti di anggaran' },
  ]
  return (
    <div className="space-y-5">
      <m.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[1.75rem] bg-primary p-6 text-on-primary sm:p-8"
      >
        <svg aria-hidden className="absolute -right-20 -top-20 size-80 opacity-20" viewBox="0 0 200 200">
          <circle cx="80" cy="100" r="60" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
          <circle cx="120" cy="100" r="60" fill="none" stroke="var(--color-partner-light)" strokeWidth="0.8" />
        </svg>
        <div className="relative">
          <Crown className="size-8 text-gold-on-dark" aria-hidden />
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Premium aktif{names ? ` untuk ${names}` : ''}</h2>
          <p className="mt-2 text-on-primary/80">
            {isDemo
              ? 'Akun demo Premium: semua fitur terbuka untuk dicoba.'
              : `Aktif sejak ${formatDate(entitlement?.activated_at?.slice(0, 10))} · berlaku selamanya.`}
          </p>
        </div>
      </m.div>
      <Card className="divide-y divide-border">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="flex min-h-14 items-center justify-between gap-3 px-5 text-sm font-semibold text-ink hover:bg-surface-muted/60">
            <span className="flex items-center gap-2.5">
              <Check className="size-4 text-success" aria-hidden />
              {l.label}
            </span>
            <ArrowRight className="size-4 text-ink-subtle" aria-hidden />
          </Link>
        ))}
      </Card>
    </div>
  )
}
