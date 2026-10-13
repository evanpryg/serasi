import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { CalendarDays, CheckCircle2, Pencil, PiggyBank, Plus, RotateCcw, Sparkles, Trash2, TrendingUp } from 'lucide-react'
import { firstName, useWedding, useWorkspace, type Member } from '@/auth/WorkspaceProvider'
import { useSavingsData, type SavingsInput } from '@/hooks/useSavingsData'
import { MemberAvatar } from '@/components/couple/Cover'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MoneyField, TextField } from '@/components/ui/Field'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ChipGroup, ConfirmDialog, HowTo, IconButton, PageHeader, useConfirm } from '@/components/ui/PageKit'
import { AnimatePresence, CountUp, EASE_OUT, m } from '@/components/motion'
import { cn } from '@/lib/cn'
import { formatDate, formatDateShort, formatRupiah, formatRupiahShort, toDateOnly } from '@/lib/format'
import { groupSavingsByMonth, summarizeSavings, type SavingsSummary } from '@/lib/savings'
import type { SavingsEntry } from '@/lib/database.types'

const AMOUNT_FIELD_ID = 'tabungan-jumlah'
const QUICK_AMOUNTS = [100_000, 500_000, 1_000_000, 5_000_000]
const NOTE_MAX = 200

export function SavingsPage() {
  const wedding = useWedding()
  const { me, members } = useWorkspace()
  const { state, reload, addEntry, updateEntry, deleteEntry } = useSavingsData(wedding.id)
  const location = useLocation()

  // Tautan langsung /app/tabungan#catat → kursor siap di kolom jumlah.
  useEffect(() => {
    if (location.hash === '#catat' && state.status === 'ready') focusAmountField()
  }, [location.hash, state.status])

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-80 rounded-card" />
        </div>
      </div>
    )
  }
  if (state.status === 'error') {
    return <ErrorState message="Catatan tabungan gagal dimuat." onRetry={() => void reload()} />
  }
  if (!me) return null

  const entries = state.data
  const summary = summarizeSavings(entries, wedding)
  const lastMine = entries.filter((e) => e.user_id === me.userId).sort((a, b) => b.saved_on.localeCompare(a.saved_on) || b.created_at.localeCompare(a.created_at))[0]

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Tabungan bersama"
        description="Catat setiap kali kalian menabung untuk pernikahan. Dana terkumpul di Anggaran dan Dashboard ikut bertambah otomatis."
        actions={
          <Button className="xl:hidden" onClick={focusAmountField} icon={<Plus className="size-4" aria-hidden />}>
            Catat tabungan
          </Button>
        }
      />

      <HowTo
        id="savings"
        steps={[
          <>Isi <strong className="text-ink">jumlah</strong> yang baru kamu tabung. Tanggal otomatis hari ini, bisa diganti.</>,
          <>Tekan <strong className="text-ink">Simpan</strong>. Pasanganmu mencatat tabungannya sendiri dari akunnya.</>,
          <>Pantau <strong className="text-ink">progres menuju target</strong> dan siapa menabung berapa di riwayat.</>,
        ]}
      />

      {/* Satu form saja. Urutan DOM (ringkasan → form → riwayat) = urutan di ponsel;
          layar lebar memindahkan form ke kolom kanan yang menempel saat digulir. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0 xl:col-start-1 xl:row-start-1">
          <SummaryCard summary={summary} members={members} weddingDate={wedding.wedding_date} />
        </div>
        <div className="xl:sticky xl:top-6 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start">
          <QuickAddCard me={me} lastMine={lastMine} onAdd={addEntry} />
        </div>
        <div className="min-w-0 xl:col-start-1 xl:row-start-2">
          <History entries={entries} members={members} me={me} onUpdate={updateEntry} onDelete={deleteEntry} />
        </div>
      </div>
    </div>
  )
}

function focusAmountField() {
  const field = document.getElementById(AMOUNT_FIELD_ID)
  if (!field) return
  field.scrollIntoView({ behavior: 'smooth', block: 'center' })
  field.focus({ preventScroll: true })
}

// ---------------------------------------------------------------------------
// Ringkasan
// ---------------------------------------------------------------------------
function SummaryCard({ summary, members, weddingDate }: { summary: SavingsSummary; members: Member[]; weddingDate: string | null }) {
  const owner = members.find((mb) => mb.role === 'owner')
  const partner = members.find((mb) => mb.role === 'partner')
  const ownerTotal = owner ? (summary.byMember[owner.userId]?.total ?? 0) : 0
  const partnerTotal = partner ? (summary.byMember[partner.userId]?.total ?? 0) : 0
  const scale = Math.max(summary.target, summary.collected, 1)

  // Lapisan bertumpuk memakai scaleX (bukan width): kumulatif, yang terpanjang di bawah.
  const layers = [
    { key: 'partner', value: summary.initialFunds + ownerTotal + partnerTotal, className: 'bg-rose' },
    { key: 'owner', value: summary.initialFunds + ownerTotal, className: 'bg-primary' },
    { key: 'initial', value: summary.initialFunds, className: 'bg-gold' },
  ]

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <div>
          <p className="text-sm text-ink-muted">Dana terkumpul untuk pernikahan</p>
          <CountUp value={summary.collected} format={formatRupiah} className="block whitespace-nowrap font-display text-4xl font-bold text-ink tabular sm:text-5xl" />
        </div>
        {summary.target > 0 ? (
          <p className="text-sm text-ink-muted">
            dari target <strong className="text-ink tabular">{formatRupiah(summary.target)}</strong>
            <span className="ml-1.5 font-semibold text-primary tabular">({Math.round(summary.progress * 100)}%)</span>
          </p>
        ) : (
          <Link to="/app/settings" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Atur target anggaran
          </Link>
        )}
      </div>

      <div
        role="img"
        aria-label={`Dana awal ${formatRupiah(summary.initialFunds)}, tabungan ${owner?.name ?? ''} ${formatRupiah(ownerTotal)}, tabungan ${partner?.name ?? 'pasangan'} ${formatRupiah(partnerTotal)}, target ${formatRupiah(summary.target)}`}
        className="relative mt-5 h-3.5 overflow-hidden rounded-full bg-surface-muted"
      >
        {layers.map((l) => (
          <m.div
            key={l.key}
            className={cn('absolute inset-y-0 left-0 w-full origin-left rounded-full', l.className)}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.min(1, l.value / scale) }}
            transition={{ duration: 0.9, ease: EASE_OUT }}
          />
        ))}
      </div>

      <ul className="mt-4 divide-y divide-border">
        <LegendItem dot="bg-gold" label="Dana awal" value={summary.initialFunds} hint="Sebelum mulai mencatat" />
        {owner && <MemberLegend member={owner} stats={summary.byMember[owner.userId]} />}
        {partner ? (
          <MemberLegend member={partner} stats={summary.byMember[partner.userId]} />
        ) : (
          <li className="py-3 text-sm text-ink-muted">
            Pasangan belum bergabung.{' '}
            <Link to="/app/kita" className="font-semibold text-primary underline-offset-4 hover:underline">
              Undang sekarang
            </Link>
          </li>
        )}
      </ul>

      <div className="mt-5 border-t border-border pt-4">
        {summary.reached ? (
          <p className="flex items-start gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            Target tercapai! Tabungan berikutnya menambah dana cadangan kalian.
          </p>
        ) : summary.monthlyNeeded != null && summary.monthsLeft != null ? (
          <p className="flex items-start gap-2 text-sm text-ink-muted">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-gold-text" aria-hidden />
            <span>
              Kurang <strong className="text-ink tabular">{formatRupiah(summary.remaining)}</strong>. Sisihkan sekitar{' '}
              <strong className="text-ink tabular">{formatRupiahShort(summary.monthlyNeeded)}/bulan</strong> berdua
              {partner ? <> (±{formatRupiahShort(Math.ceil(summary.monthlyNeeded / 2))} per orang)</> : null} selama{' '}
              {summary.monthsLeft} bulan sampai {formatDate(weddingDate)}.
            </span>
          </p>
        ) : summary.target > 0 ? (
          <p className="flex items-start gap-2 text-sm text-ink-muted">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-gold-text" aria-hidden />
            <span>
              Kurang <strong className="text-ink tabular">{formatRupiah(summary.remaining)}</strong> lagi menuju target.
            </span>
          </p>
        ) : null}
        {summary.thisMonth > 0 && (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
            <Sparkles className="size-4 shrink-0 text-gold-text" aria-hidden />
            <span>
              Bulan ini kalian sudah menabung <strong className="text-ink tabular">{formatRupiah(summary.thisMonth)}</strong>.
            </span>
          </p>
        )}
      </div>
    </Card>
  )
}

function LegendItem({ dot, label, value, hint }: { dot: string; label: string; value: number; hint: string }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center" aria-hidden>
        <span className={cn('size-3 rounded-full', dot)} />
      </span>
      <LegendText label={label} hint={hint} value={value} />
    </li>
  )
}

function MemberLegend({ member, stats }: { member: Member; stats?: { total: number; count: number; lastDate: string | null } }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <MemberAvatar member={member} size="sm" />
      <LegendText
        label={member.isMe ? 'Tabunganmu' : `Tabungan ${firstName(member.name)}`}
        hint={stats ? `${stats.count}× setor · terakhir ${formatDateShort(stats.lastDate)}` : 'Belum ada setoran'}
        value={stats?.total ?? 0}
      />
    </li>
  )
}

function LegendText({ label, hint, value }: { label: string; hint: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-subtle">{hint}</p>
      </div>
      <p className="shrink-0 font-semibold text-ink tabular">{formatRupiah(value)}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form cepat: jumlah → Simpan. Tanggal default hari ini, catatan opsional.
// ---------------------------------------------------------------------------
function QuickAddCard({ me, lastMine, onAdd }: { me: Member; lastMine?: SavingsEntry; onAdd: (input: SavingsInput) => Promise<SavingsEntry> }) {
  const today = toDateOnly(new Date())
  const [amount, setAmount] = useState<number | null>(null)
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<{ amount: number; key: number } | null>(null)
  const headingId = useId()

  useEffect(() => {
    if (!saved) return
    const t = window.setTimeout(() => setSaved(null), 4000)
    return () => window.clearTimeout(t)
  }, [saved])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!amount || amount <= 0) return setError('Isi jumlah yang ditabung.')
    if (!date) return setError('Pilih tanggal menabung.')
    setError(null)
    setSaving(true)
    try {
      await onAdd({ amount, saved_on: date, note: note.trim() || null })
      setSaved({ amount, key: Date.now() })
      setAmount(null)
      setNote('')
    } catch {
      setError('Tabungan gagal disimpan. Periksa koneksi lalu coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <form onSubmit={(e) => void submit(e)} aria-labelledby={headingId} noValidate className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gold-soft text-gold-text">
            <PiggyBank className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id={headingId} className="font-semibold text-ink">
              Catat tabungan
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              atas nama <MemberAvatar member={me} size="sm" className="size-5 text-[0.6rem] ring-1" /> {firstName(me.name)}
            </p>
          </div>
        </div>

        <div>
          <MoneyField
            id={AMOUNT_FIELD_ID}
            label="Jumlah ditabung"
            value={amount}
            onChange={(v) => {
              setAmount(v)
              setError(null)
            }}
            error={error && !amount ? error : undefined}
          />
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Tambah cepat">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => { setAmount((a) => (a ?? 0) + q); setError(null) }}
                className="inline-flex min-h-10 cursor-pointer items-center rounded-full border border-border bg-surface px-3.5 text-sm font-semibold text-ink-muted transition-colors hover:border-primary hover:text-primary active:scale-[0.97]"
              >
                +{formatRupiahShort(q).replace('Rp ', '')}
              </button>
            ))}
            {lastMine && (
              <button
                type="button"
                onClick={() => { setAmount(lastMine.amount); setNote(lastMine.note ?? ''); setError(null) }}
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-gold/50 bg-gold-soft/60 px-3.5 text-sm font-semibold text-gold-text transition-colors hover:bg-gold-soft active:scale-[0.97]"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Sama seperti terakhir ({formatRupiahShort(lastMine.amount)})
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <TextField
            label="Tanggal menabung"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            hint={date === today ? 'Hari ini' : formatDate(date)}
          />
          <TextField
            label="Catatan"
            optional
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Gaji Oktober"
          />
        </div>

        {error && amount ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" loading={saving} className="w-full" icon={<Plus className="size-4" aria-hidden />}>
          {amount ? `Simpan ${formatRupiah(amount)}` : 'Simpan tabungan'}
        </Button>

        <div aria-live="polite" className="min-h-0">
          <AnimatePresence>
            {saved && (
              <m.p
                key={saved.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success"
              >
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                {formatRupiah(saved.amount)} tersimpan. Terus semangat!
              </m.p>
            )}
          </AnimatePresence>
        </div>
      </form>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Riwayat per bulan
// ---------------------------------------------------------------------------
function History({
  entries,
  members,
  me,
  onUpdate,
  onDelete,
}: {
  entries: SavingsEntry[]
  members: Member[]
  me: Member
  onUpdate: (id: string, input: SavingsInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [who, setWho] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const confirm = useConfirm<SavingsEntry>()

  const filtered = useMemo(() => (who === 'all' ? entries : entries.filter((e) => e.user_id === who)), [entries, who])
  const months = useMemo(() => groupSavingsByMonth(filtered), [filtered])
  const memberOf = (userId: string) => members.find((mb) => mb.userId === userId)

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<PiggyBank className="size-7" aria-hidden />}
        title="Belum ada catatan tabungan"
        description="Mulai dari setoran pertamamu hari ini, sekecil apa pun. Pasanganmu bisa ikut mencatat dari akunnya."
      />
    )
  }

  const options = [
    { value: 'all', label: 'Semua', count: entries.length },
    ...members.map((mb) => ({
      value: mb.userId,
      label: mb.isMe ? 'Punyaku' : firstName(mb.name),
      count: entries.filter((e) => e.user_id === mb.userId).length,
    })),
  ]

  return (
    <section aria-labelledby="riwayat-tabungan" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="riwayat-tabungan" className="font-display text-2xl font-semibold text-ink">
          Riwayat tabungan
        </h2>
        {members.length > 1 && <ChipGroup label="Tampilkan tabungan milik" options={options} value={who} onChange={setWho} />}
      </div>

      {months.map((month) => (
        <Card key={month.key} className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-muted/50 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <CalendarDays className="size-4 text-ink-subtle" aria-hidden />
              {month.label}
            </h3>
            <p className="text-sm font-semibold text-primary tabular">+{formatRupiah(month.total)}</p>
          </div>
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {month.entries.map((entry) => {
                const owner = memberOf(entry.user_id)
                const mine = entry.user_id === me.userId
                return (
                  <m.li
                    key={entry.id}
                    layout="position"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="px-5 py-3.5"
                  >
                    {editingId === entry.id ? (
                      <EditRow
                        entry={entry}
                        onCancel={() => setEditingId(null)}
                        onSave={async (input) => {
                          await onUpdate(entry.id, input)
                          setEditingId(null)
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        {owner ? <MemberAvatar member={owner} size="sm" /> : <span className="size-8 shrink-0 rounded-full bg-surface-muted" aria-hidden />}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink tabular">{formatRupiah(entry.amount)}</p>
                          <p className="truncate text-sm text-ink-muted">{entry.note || 'Tanpa catatan'}</p>
                          <p className="text-xs text-ink-subtle">
                            {owner ? (owner.isMe ? 'Kamu' : firstName(owner.name)) : 'Mantan anggota'} · {formatDateShort(entry.saved_on)}
                          </p>
                        </div>
                        {mine && (
                          <div className="flex shrink-0 items-center">
                            <IconButton label={`Ubah tabungan ${formatRupiah(entry.amount)}`} onClick={() => setEditingId(entry.id)}>
                              <Pencil className="size-4" aria-hidden />
                            </IconButton>
                            <IconButton label={`Hapus tabungan ${formatRupiah(entry.amount)}`} tone="danger" onClick={() => confirm.ask(entry)}>
                              <Trash2 className="size-4" aria-hidden />
                            </IconButton>
                          </div>
                        )}
                      </div>
                    )}
                  </m.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </Card>
      ))}

      {months.length === 0 && <p className="rounded-card border border-dashed border-border-strong p-6 text-center text-sm text-ink-muted">Belum ada setoran untuk pilihan ini.</p>}

      <ConfirmDialog
        open={confirm.target != null}
        title="Hapus catatan tabungan?"
        message={
          confirm.target && (
            <>
              Setoran <strong className="text-ink">{formatRupiah(confirm.target.amount)}</strong> tanggal {formatDate(confirm.target.saved_on)} akan dihapus,
              dan dana terkumpul ikut berkurang.
            </>
          )
        }
        onConfirm={async () => {
          if (confirm.target) await onDelete(confirm.target.id)
        }}
        onClose={confirm.close}
      />
    </section>
  )
}

function EditRow({ entry, onCancel, onSave }: { entry: SavingsEntry; onCancel: () => void; onSave: (input: SavingsInput) => Promise<void> }) {
  const today = toDateOnly(new Date())
  const [amount, setAmount] = useState<number | null>(entry.amount)
  const [date, setDate] = useState(entry.saved_on)
  const [note, setNote] = useState(entry.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!amount || amount <= 0) return setError('Jumlah harus lebih dari 0.')
    if (!date) return setError('Pilih tanggal.')
    setSaving(true)
    try {
      await onSave({ amount, saved_on: date, note: note.trim() || null })
    } catch {
      setError('Perubahan gagal disimpan. Coba lagi.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="space-y-3" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="grid gap-3 sm:grid-cols-3">
        <MoneyField label="Jumlah" value={amount} onChange={setAmount} autoFocus />
        <TextField label="Tanggal" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        <TextField label="Catatan" optional value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" loading={saving}>
          Simpan
        </Button>
      </div>
    </form>
  )
}
