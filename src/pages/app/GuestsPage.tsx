import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, Clock, Crown, Mail, MailCheck, Plus, Users, X } from 'lucide-react'
import { useWedding, useWorkspace } from '@/auth/WorkspaceProvider'
import { useGuestsData } from '@/hooks/usePlanningData'
import { Card, ProgressBar } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog, HowTo, PageHeader, SearchInput, SelectFilter, Stat, useConfirm } from '@/components/ui/PageKit'
import { cn } from '@/lib/cn'
import type { Guest, MemberSide } from '@/lib/database.types'
import { DEFAULT_CATEGORY, GUEST_SIDE_LABEL, compareCategory, tallyByCategory, type Tally } from '@/lib/guests'
import { SIDE_TONE, resolveSide } from '@/lib/side'
import { LockedPanel, premiumHref } from '@/components/premium/Premium'
import { usePremium } from '@/hooks/usePremium'
import { FREE_GUEST_LIMIT } from '@/lib/plans'
import { GuestSheet, RSVP_META } from './guests/GuestSheet'

type Rsvp = Guest['rsvp_status']
type SideFilter = 'all' | MemberSide

const RSVP_ICON: Record<Rsvp, typeof Check> = { hadir: Check, menunggu: Clock, tidak_hadir: X }
const SIDES: MemberSide[] = ['cpp', 'cpw']

export function GuestsPage() {
  const wedding = useWedding()
  const { me } = useWorkspace()
  const { state, reload, updateGuestRsvp, updateGuestInvitation, createGuest, updateGuest, deleteGuest } = useGuestsData(wedding.id)
  const [side, setSide] = useState<SideFilter>('all')
  const [category, setCategory] = useState('all')
  const [rsvpFilter, setRsvpFilter] = useState<'all' | Rsvp>('all')
  const [query, setQuery] = useState('')
  const [sheet, setSheet] = useState<{ mode: 'add' } | { mode: 'edit'; id: string } | null>(null)
  const confirm = useConfirm<Guest>()
  const { isPremium } = usePremium()
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)

  const guests = state.status === 'ready' ? state.data : []
  const tally = useMemo(() => tallyByCategory(guests), [guests])

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-36 rounded-card" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat daftar tamu." onRetry={() => void reload()} />
  }

  const people = (list: Guest[]) => list.reduce((s, g) => s + g.guest_count, 0)
  const byRsvp = (r: Rsvp) => guests.filter((g) => g.rsvp_status === r)
  const hadir = byRsvp('hadir')
  const menunggu = byRsvp('menunggu')
  const tidak = byRsvp('tidak_hadir')
  const sent = guests.filter((g) => g.invitation_status === 'terkirim').length
  const sentPct = guests.length ? Math.round((sent / guests.length) * 100) : 0
  const categories = tally.rows.map((r) => r.category)
  const atLimit = !isPremium && guests.length >= FREE_GUEST_LIMIT
  const nearLimit = !isPremium && !atLimit && guests.length >= FREE_GUEST_LIMIT * 0.7
  const mySide: MemberSide = me ? resolveSide(me) : 'cpp'
  const addGuest = () => (atLimit ? navigate(premiumHref('tamu')) : setSheet({ mode: 'add' }))
  const editing = sheet?.mode === 'edit' ? guests.find((g) => g.id === sheet.id) : undefined

  const q = query.trim().toLowerCase()
  const shown = guests.filter((g) => {
    if (side !== 'all' && g.side !== side) return false
    if (category !== 'all' && g.group_name !== category) return false
    if (rsvpFilter !== 'all' && g.rsvp_status !== rsvpFilter) return false
    if (!q) return true
    return [g.name, g.group_name, g.notes].some((f) => (f ?? '').toLowerCase().includes(q))
  })
  const sections = Array.from(
    shown.reduce((map, g) => map.set(g.group_name || 'Lainnya', [...(map.get(g.group_name || 'Lainnya') ?? []), g]), new Map<string, Guest[]>()),
  ).sort(([a], [b]) => compareCategory(a, b))
  const filtered = side !== 'all' || category !== 'all' || rsvpFilter !== 'all' || q !== ''

  const pick = (s: SideFilter, c: string) => {
    setSide(s)
    setCategory(c)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const resetFilters = () => {
    setSide('all')
    setCategory('all')
    setRsvpFilter('all')
    setQuery('')
  }

  return (
    <div className="space-y-5 lg:space-y-8">
      <PageHeader
        title="Tamu"
        description="Daftar undangan pihak pria dan wanita, per kategori. Jumlah orang yang hadir membantu menghitung porsi katering."
        actions={
          <Button onClick={addGuest} icon={atLimit ? <Crown className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}>
            Tambah tamu
          </Button>
        }
      />

      <HowTo
        id="guests"
        steps={[
          <>Tambahkan tamu: pilih dari <strong className="text-ink">pihak pria atau wanita</strong> dan kategorinya (saudara, teman, rekan kerja…).</>,
          <>Lihat <strong className="text-ink">Rekap per kategori</strong> untuk tahu berapa undangan tiap pihak. Ketuk angkanya untuk melihat daftarnya.</>,
          <>Ketuk ikon amplop saat undangan terkirim, ketuk nama tamu untuk mengisi jawabannya.</>,
        ]}
      />

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Stat label="Hadir" value={people(hadir)} hint={`${hadir.length} undangan`} tone="success" />
          <Stat label="Belum jawab" value={menunggu.length} hint={`± ${people(menunggu)} orang`} tone="warning" />
          <Stat label="Tidak hadir" value={tidak.length} hint={`${people(tidak)} orang`} />
        </div>
        <div className="mt-4 border-t border-border pt-4 sm:mt-5">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
            <span className="text-ink-muted">
              Terkirim <strong className="text-ink tabular">{sent}</strong> dari {guests.length} undangan
            </span>
            <span className="text-ink-muted">
              Katering ± <strong className="text-ink tabular">{people(hadir) + people(menunggu)} orang</strong>
            </span>
          </div>
          <ProgressBar value={sentPct} label="Undangan terkirim" />
          {nearLimit && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
              <span>
                Paket Gratis: <strong className="text-ink tabular">{guests.length}</strong> dari {FREE_GUEST_LIMIT} undangan.
              </span>
              <button type="button" onClick={() => navigate(premiumHref('tamu'))} className="min-h-8 cursor-pointer font-semibold text-primary underline-offset-2 hover:underline">
                Tanpa batas dengan Premium
              </button>
            </p>
          )}
        </div>
      </Card>

      {guests.length > 0 && <CategoryRecap tally={tally} side={side} category={category} onPick={pick} />}

      {atLimit && (
        <LockedPanel
          source="tamu"
          title={`Batas ${FREE_GUEST_LIMIT} undangan paket Gratis tercapai`}
          description="Semua tamu yang sudah dicatat tetap aman dan bisa diubah. Upgrade untuk menambah tamu tanpa batas."
        />
      )}

      <div ref={listRef} className="scroll-mt-20 space-y-2.5 lg:scroll-mt-6">
        <div role="radiogroup" aria-label="Pihak tamu" className="grid grid-cols-3 rounded-xl border border-border bg-surface p-1">
          {(['all', ...SIDES] as SideFilter[]).map((s) => {
            const active = side === s
            const count = s === 'all' ? tally.total.invites : tally[s].invites
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSide(s)}
                className={cn(
                  'flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors',
                  active ? (s === 'all' ? 'bg-ink text-white' : cn(SIDE_TONE[s].bg, 'text-white')) : 'text-ink-muted hover:text-ink',
                )}
              >
                {s === 'all' ? 'Semua' : GUEST_SIDE_LABEL[s]}
                <span className={cn('rounded-full px-1.5 text-xs tabular', active ? 'bg-white/20' : 'bg-surface-muted')}>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <SearchInput label="Cari tamu" value={query} onChange={setQuery} placeholder="Cari nama…" className="col-span-2 sm:max-w-sm sm:flex-1" />
          <SelectFilter label="Saring kategori" value={category} onChange={setCategory} className="sm:w-48">
            <option value="all">Semua kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectFilter>
          <SelectFilter label="Saring jawaban" value={rsvpFilter} onChange={(v) => setRsvpFilter(v as 'all' | Rsvp)} className="sm:w-44">
            <option value="all">Semua jawaban</option>
            <option value="menunggu">Belum jawab ({menunggu.length})</option>
            <option value="hadir">Hadir ({hadir.length})</option>
            <option value="tidak_hadir">Tidak hadir ({tidak.length})</option>
          </SelectFilter>
        </div>
        {filtered && shown.length > 0 && (
          <p className="flex items-center justify-between gap-2 px-1 text-sm text-ink-muted">
            <span>
              <strong className="text-ink tabular">{shown.length}</strong> undangan · <span className="tabular">{people(shown)}</span> orang
            </span>
            <button type="button" onClick={resetFilters} className="min-h-10 cursor-pointer font-semibold text-primary">
              Tampilkan semua
            </button>
          </p>
        )}
      </div>

      {guests.length === 0 ? (
        <EmptyState
          icon={<Users className="size-7" aria-hidden />}
          title="Belum ada tamu"
          description="Mulai dari saudara dekat, lalu teman dan rekan kerja. Satu baris = satu undangan."
          action={
            <Button onClick={addGuest} icon={<Plus className="size-4" aria-hidden />}>
              Tambah tamu pertama
            </Button>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Users className="size-7" aria-hidden />}
          title="Tidak ada tamu yang cocok"
          description="Coba kata kunci lain atau tampilkan semua."
          action={
            <Button variant="secondary" onClick={resetFilters}>
              Tampilkan semua
            </Button>
          }
        />
      ) : (
        <Card className="overflow-clip">
          {sections.map(([name, list]) => (
            <section key={name} aria-label={name}>
              <h3 className="sticky top-16 z-10 flex h-9 items-center justify-between gap-2 border-b border-border bg-surface-muted/95 px-3.5 text-xs font-semibold text-ink-muted backdrop-blur sm:px-5 lg:top-0">
                <span className="truncate uppercase tracking-wide">{name}</span>
                <span className="shrink-0 font-medium tabular">
                  {list.length} undangan · {people(list)} org
                </span>
              </h3>
              <ul className="divide-y divide-border">
                {list.map((guest) => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    showSide={side === 'all'}
                    onOpen={() => setSheet({ mode: 'edit', id: guest.id })}
                    onToggleInvite={() => void updateGuestInvitation(guest.id, guest.invitation_status === 'terkirim' ? 'belum' : 'terkirim')}
                  />
                ))}
              </ul>
            </section>
          ))}
        </Card>
      )}

      {sheet && (sheet.mode === 'add' || editing) && (
        <GuestSheet
          key={sheet.mode === 'edit' ? sheet.id : 'add'}
          guest={editing}
          defaults={{ side: side === 'all' ? mySide : side, category: category === 'all' ? DEFAULT_CATEGORY : category }}
          categories={categories}
          onClose={() => setSheet(null)}
          onCreate={createGuest}
          onUpdate={updateGuest}
          onRsvp={(id, r) => void updateGuestRsvp(id, r)}
          onInvite={(id, s) => void updateGuestInvitation(id, s)}
          onDelete={(g) => confirm.ask(g)}
        />
      )}
      <ConfirmDialog
        open={confirm.target != null}
        title="Hapus tamu ini?"
        message={
          <>
            <strong className="text-ink">{confirm.target?.name}</strong> akan dihapus dari daftar undangan.
          </>
        }
        onConfirm={() => {
          if (!confirm.target) return
          setSheet(null)
          return deleteGuest(confirm.target.id)
        }}
        onClose={confirm.close}
      />
    </div>
  )
}

/** Satu baris ringkas (±56px): pihak · nama · jumlah orang · jawaban · tombol amplop. */
function GuestRow({ guest, showSide, onOpen, onToggleInvite }: { guest: Guest; showSide: boolean; onOpen: () => void; onToggleInvite: () => void }) {
  const isSent = guest.invitation_status === 'terkirim'
  const rsvp = RSVP_META[guest.rsvp_status]
  const RsvpIcon = RSVP_ICON[guest.rsvp_status]
  return (
    <li className="flex items-center">
      <button type="button" onClick={onOpen} className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-2 pl-3.5 pr-1 text-left hover:bg-surface-muted/60 sm:pl-5">
        {showSide && (
          <span
            title={`Pihak ${GUEST_SIDE_LABEL[guest.side].toLowerCase()}`}
            className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold', SIDE_TONE[guest.side].soft, SIDE_TONE[guest.side].text)}
          >
            <span aria-hidden>{GUEST_SIDE_LABEL[guest.side][0]}</span>
            <span className="sr-only">Pihak {GUEST_SIDE_LABEL[guest.side].toLowerCase()}</span>
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.95rem] font-medium text-ink">{guest.name}</span>
          <span className="block truncate text-xs text-ink-muted">{[`${guest.guest_count} orang`, guest.notes].filter(Boolean).join(' · ')}</span>
        </span>
        <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold', rsvp.badge)}>
          <RsvpIcon className="size-3.5" aria-hidden />
          {rsvp.short}
        </span>
      </button>
      <button
        type="button"
        aria-pressed={isSent}
        aria-label={isSent ? `Undangan ${guest.name} sudah terkirim, ketuk untuk batalkan` : `Tandai undangan ${guest.name} terkirim`}
        title={isSent ? 'Undangan terkirim' : 'Belum dikirim'}
        onClick={onToggleInvite}
        className={cn(
          'mr-1.5 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors sm:mr-3',
          isSent ? 'text-primary hover:bg-primary-soft' : 'text-ink-subtle hover:bg-surface-muted hover:text-ink',
        )}
      >
        {isSent ? <MailCheck className="size-5" aria-hidden /> : <Mail className="size-5" aria-hidden />}
      </button>
    </li>
  )
}

/** Tabel rekap: kategori × pihak. Setiap angka bisa diketuk untuk menyaring daftar. */
function CategoryRecap({
  tally,
  side,
  category,
  onPick,
}: {
  tally: ReturnType<typeof tallyByCategory>
  side: SideFilter
  category: string
  onPick: (side: SideFilter, category: string) => void
}) {
  const cols: SideFilter[] = ['cpp', 'cpw', 'all']
  const cell = (t: Tally, s: SideFilter, c: string, label: string) => {
    // Sorot hanya saat daftar sedang disaring (sel "Semua · Total" = tampilan bawaan).
    const active = side === s && category === c && !(s === 'all' && c === 'all')
    return (
      <td key={s} className="p-0.5">
        <button
          type="button"
          disabled={t.invites === 0}
          aria-pressed={active}
          aria-label={`${label}: ${t.invites} undangan, ${t.people} orang`}
          onClick={() => onPick(s, c)}
          className={cn(
            'flex min-h-11 w-full cursor-pointer flex-col items-end justify-center rounded-lg px-2 py-1 text-right transition-colors disabled:cursor-default',
            active ? 'bg-primary-soft ring-1 ring-primary/30' : 'enabled:hover:bg-surface-muted',
          )}
        >
          <span className={cn('font-num text-[0.95rem] font-semibold leading-tight', t.invites ? 'text-ink' : 'text-ink-subtle')}>{t.invites}</span>
          <span className="text-[0.7rem] leading-tight text-ink-muted tabular">{t.people} org</span>
        </button>
      </td>
    )
  }
  const sideName = (s: SideFilter) => (s === 'all' ? 'Total' : `Pihak ${GUEST_SIDE_LABEL[s].toLowerCase()}`)

  return (
    <Card className="p-3 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 px-1.5 pb-1">
        <h2 className="font-semibold text-ink">Rekap per kategori</h2>
        <span className="text-xs text-ink-muted">undangan · orang</span>
      </div>
      <table className="w-full table-fixed border-collapse text-sm">
        <caption className="sr-only">Jumlah undangan dan orang per kategori untuk pihak pria dan wanita</caption>
        <colgroup>
          <col />
          <col className="w-[22%] sm:w-28" />
          <col className="w-[22%] sm:w-28" />
          <col className="w-[22%] sm:w-28" />
        </colgroup>
        <thead>
          <tr className="text-xs text-ink-muted">
            <th scope="col" className="px-1.5 py-1.5 text-left font-medium">
              Kategori
            </th>
            {cols.map((s) => (
              <th key={s} scope="col" className="px-2.5 py-1.5 text-right font-semibold">
                <span className="inline-flex items-center justify-end gap-1">
                  {s !== 'all' && <span aria-hidden className={cn('size-2 rounded-full', SIDE_TONE[s].bg)} />}
                  <span className={s === 'all' ? 'text-ink' : SIDE_TONE[s].text}>{s === 'all' ? 'Total' : GUEST_SIDE_LABEL[s]}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="border-t border-border">
          {tally.rows.map((row) => (
            <tr key={row.category} className="border-b border-border/70">
              <th scope="row" className="px-1.5 py-1 text-left text-[0.85rem] font-medium leading-tight text-ink break-words">
                {/* Boleh pindah baris setelah "/" (Teman/Sahabat) tanpa memotong kata. */}
                {row.category.replaceAll('/', '/​')}
              </th>
              {cols.map((s) => cell(s === 'all' ? row.total : row[s], s, row.category, `${row.category}, ${sideName(s)}`))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="px-1.5 text-left font-semibold text-ink">
              Semua
            </th>
            {cols.map((s) => cell(s === 'all' ? tally.total : tally[s], s, 'all', `Semua kategori, ${sideName(s)}`))}
          </tr>
        </tfoot>
      </table>
    </Card>
  )
}
