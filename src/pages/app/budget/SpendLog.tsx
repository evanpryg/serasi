import { useEffect, useId, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Plus, Receipt, Store, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FieldShell, MoneyField, TextField, inputClass } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { formatDateShort, formatRupiah, formatRupiahShort, parseDateOnly, toDateOnly } from '@/lib/format'
import { posIcon } from '@/lib/budgetIcons'

export type LogEntry = {
  id: string
  kind: 'item' | 'vendor'
  title: string
  /** "YYYY-MM-DD" atau null bila tanggal tidak tercatat. */
  date: string | null
  /** Nominal yang benar-benar keluar. */
  value: number
  /** Harga rencana item (null untuk pembayaran vendor). */
  planned: number | null
  posName: string
  isReserve: boolean
  eventName: string | null
}

export type PosOption = { id: string; name: string; group: string }

type SpendLogProps = {
  entries: LogEntry[]
  posOptions: PosOption[]
  defaultPosId: string | null
  /** Membuka form dari luar (tombol di kepala halaman). */
  openSignal: number
  onAdd: (input: { category_id: string; title: string; amount: number; date: string }) => Promise<void>
}

const PAGE = 8

function monthLabel(date: string | null) {
  if (!date) return 'Tanpa tanggal'
  return parseDateOnly(date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

/** Catatan pengeluaran: semua uang yang sudah keluar (item lunas + pembayaran vendor), terbaru di atas. */
export function SpendLog({ entries, posOptions, defaultPosId, openSignal, onAdd }: SpendLogProps) {
  const [showAll, setShowAll] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (openSignal === 0) return
    setFormOpen(true)
    requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [openSignal])

  const sorted = [...entries].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  const visible = showAll ? sorted : sorted.slice(0, PAGE)
  const total = entries.reduce((acc, e) => acc + e.value, 0)
  const net = entries.reduce((acc, e) => acc + (e.planned != null ? e.planned - e.value : 0), 0)

  // Kelompokkan per bulan, total bulan dihitung dari semua entri (bukan hanya yang tampil).
  const monthTotals = new Map<string, number>()
  for (const e of sorted) monthTotals.set(monthLabel(e.date), (monthTotals.get(monthLabel(e.date)) ?? 0) + e.value)
  const groups: { label: string; rows: LogEntry[] }[] = []
  for (const e of visible) {
    const label = monthLabel(e.date)
    const last = groups.at(-1)
    if (last?.label === label) last.rows.push(e)
    else groups.push({ label, rows: [e] })
  }

  return (
    <section ref={sectionRef} id="catatan" aria-labelledby="catatan-heading" className="scroll-mt-24 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="catatan-heading" className="font-display text-2xl font-semibold text-ink">
            Catatan pengeluaran
          </h2>
          <p className="text-sm text-ink-muted">Uang yang sudah benar-benar keluar, terbaru di atas.</p>
        </div>
        {!formOpen && posOptions.length > 0 && (
          <Button variant="secondary" size="sm" className="h-10" icon={<Plus className="size-4" aria-hidden />} onClick={() => setFormOpen(true)}>
            Catat pengeluaran
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-surface-muted/50 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-on-primary" aria-hidden>
              <Receipt className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-xs text-ink-muted">Total keluar</p>
              <p className="font-num text-lg font-semibold text-ink">{formatRupiah(total)}</p>
            </div>
          </div>
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink tabular">{entries.length}</span> transaksi
          </p>
          {net !== 0 && (
            <p className={cn('flex items-center gap-1.5 text-sm font-semibold', net > 0 ? 'text-success' : 'text-danger')}>
              {net > 0 ? <TrendingDown className="size-4" aria-hidden /> : <TrendingUp className="size-4" aria-hidden />}
              {net > 0 ? `Hemat ${formatRupiah(net)}` : `Lebih ${formatRupiah(-net)}`} dari harga rencana
            </p>
          )}
        </div>

        {formOpen && (
          <div className="border-b border-border p-4 sm:p-5">
            <QuickSpendForm posOptions={posOptions} defaultPosId={defaultPosId} onAdd={onAdd} onClose={() => setFormOpen(false)} />
          </div>
        )}

        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-muted sm:px-5">
            Belum ada pengeluaran. Centang item yang sudah dibayar, atau tekan <strong className="text-ink">Catat pengeluaran</strong>.
          </p>
        ) : (
          <div>
            {groups.map((g) => (
              <div key={g.label}>
                <div className="flex items-baseline justify-between gap-3 bg-surface-muted/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:px-5">
                  <span>{g.label}</span>
                  <span className="tabular normal-case tracking-normal">{formatRupiah(monthTotals.get(g.label) ?? 0)}</span>
                </div>
                <ul className="divide-y divide-border">
                  {g.rows.map((e) => (
                    <LogRow key={e.id} entry={e} />
                  ))}
                </ul>
              </div>
            ))}
            {sorted.length > PAGE && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
                className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-1.5 border-t border-border text-sm font-semibold text-primary hover:bg-primary-soft/40"
              >
                {showAll ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${sorted.length})`}
                <ChevronDown className={cn('size-4 transition-transform', showAll && 'rotate-180')} aria-hidden />
              </button>
            )}
          </div>
        )}
      </Card>
    </section>
  )
}

function LogRow({ entry }: { entry: LogEntry }) {
  const Icon = entry.kind === 'vendor' ? Store : posIcon(entry.posName, entry.isReserve)
  const diff = entry.planned != null ? entry.planned - entry.value : 0
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-muted" aria-hidden>
        <Icon className="size-[1.125rem]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.95rem] font-medium text-ink">{entry.title}</p>
        <p className="truncate text-xs text-ink-subtle">
          {[entry.eventName, entry.posName, entry.date ? formatDateShort(entry.date) : null].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="shrink-0 text-right leading-tight">
        <p className="font-semibold text-ink tabular">{formatRupiah(entry.value)}</p>
        {diff !== 0 ? (
          <p className={cn('text-[0.7rem] font-semibold tabular', diff > 0 ? 'text-success' : 'text-danger')}>
            {diff > 0 ? `hemat ${formatRupiahShort(diff)}` : `lebih ${formatRupiahShort(-diff)}`}
          </p>
        ) : (
          <p className="text-[0.7rem] text-ink-subtle">{entry.kind === 'vendor' ? 'bayar vendor' : 'sesuai rencana'}</p>
        )}
      </div>
    </li>
  )
}

/** Catat cepat uang yang keluar: pilih pos, tulis untuk apa, nominal, tanggal. Form tetap terbuka untuk catatan berikutnya. */
function QuickSpendForm({
  posOptions,
  defaultPosId,
  onAdd,
  onClose,
}: {
  posOptions: PosOption[]
  defaultPosId: string | null
  onAdd: SpendLogProps['onAdd']
  onClose: () => void
}) {
  const [posId, setPosId] = useState(defaultPosId ?? posOptions[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState<number | null>(null)
  const [date, setDate] = useState(() => toDateOnly(new Date()))
  const [errors, setErrors] = useState<{ title?: string; amount?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const selectId = useId()
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(null), 4000)
    return () => clearTimeout(t)
  }, [saved])

  const groups = [...new Set(posOptions.map((p) => p.group))]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Tulis untuk apa uangnya, misalnya DP dekorasi.'
    if (!amount) next.amount = 'Isi nominal yang dibayar.'
    setErrors(next)
    if (next.title || next.amount || !posId) return
    setBusy(true)
    try {
      await onAdd({ category_id: posId, title: title.trim(), amount: amount ?? 0, date: date || toDateOnly(new Date()) })
      setSaved(`${title.trim()} · ${formatRupiah(amount ?? 0)} tersimpan`)
      setTitle('')
      setAmount(null)
      titleRef.current?.focus()
    } catch {
      setErrors({ form: 'Gagal menyimpan. Periksa koneksi lalu coba lagi.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Catat pengeluaran" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldShell id={selectId} label="Masuk ke pos">
          <select id={selectId} value={posId} onChange={(e) => setPosId(e.target.value)} className={cn(inputClass, 'cursor-pointer')}>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {posOptions
                  .filter((p) => p.group === g)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </FieldShell>
        <TextField ref={titleRef} label="Untuk apa" placeholder="Contoh: Pelunasan dekor" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={120} autoFocus />
        <MoneyField label="Nominal dibayar" value={amount} onChange={setAmount} error={errors.amount} />
        <TextField label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {errors.form && (
        <p role="alert" className="text-sm text-danger">
          {errors.form}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {saved && (
          <p role="status" className="mr-auto flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle2 className="size-4" aria-hidden />
            {saved}
          </p>
        )}
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
          {saved ? 'Selesai' : 'Tutup'}
        </Button>
        <Button type="submit" loading={busy}>
          {amount ? `Simpan ${formatRupiah(amount)}` : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
