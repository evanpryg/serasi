import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, Crown, Mail, Plus, Trash2, Users } from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useGuestsData } from '@/hooks/usePlanningData'
import { Card, ProgressBar } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ChipGroup, ConfirmDialog, HowTo, IconButton, PageHeader, SearchInput, SelectFilter, Stat, useConfirm } from '@/components/ui/PageKit'
import { cn } from '@/lib/cn'
import type { Guest } from '@/lib/database.types'
import { LockedPanel, premiumHref } from '@/components/premium/Premium'
import { usePremium } from '@/hooks/usePremium'
import { FREE_GUEST_LIMIT } from '@/lib/plans'
import { GuestModal } from './guests/GuestModal'

type Rsvp = Guest['rsvp_status']
type RsvpFilter = 'all' | Rsvp

const RSVP_OPTIONS: { value: Rsvp; label: string; short: string; active: string }[] = [
  { value: 'hadir', label: 'Hadir', short: 'Hadir', active: 'bg-success text-white border-success' },
  { value: 'menunggu', label: 'Belum jawab', short: 'Belum', active: 'bg-gold-soft text-gold-text border-gold' },
  { value: 'tidak_hadir', label: 'Tidak hadir', short: 'Tidak', active: 'bg-danger-soft text-danger border-danger/40' },
]

export function GuestsPage() {
  const wedding = useWedding()
  const { state, reload, updateGuestRsvp, updateGuestInvitation, createGuest, deleteGuest } = useGuestsData(wedding.id)
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>('all')
  const [group, setGroup] = useState('all')
  const [query, setQuery] = useState('')
  const [showGuestModal, setShowGuestModal] = useState(false)
  const confirm = useConfirm<Guest>()
  const { isPremium } = usePremium()
  const navigate = useNavigate()

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

  const guests = state.data
  const people = (list: Guest[]) => list.reduce((s, g) => s + g.guest_count, 0)
  const byRsvp = (r: Rsvp) => guests.filter((g) => g.rsvp_status === r)
  const hadir = byRsvp('hadir')
  const menunggu = byRsvp('menunggu')
  const tidak = byRsvp('tidak_hadir')
  const sent = guests.filter((g) => g.invitation_status === 'terkirim').length
  const sentPct = guests.length ? Math.round((sent / guests.length) * 100) : 0
  const groups = Array.from(new Set(guests.map((g) => g.group_name).filter(Boolean))) as string[]
  const atLimit = !isPremium && guests.length >= FREE_GUEST_LIMIT
  const nearLimit = !isPremium && !atLimit && guests.length >= FREE_GUEST_LIMIT * 0.7
  const addGuest = () => (atLimit ? navigate(premiumHref('tamu')) : setShowGuestModal(true))

  const q = query.trim().toLowerCase()
  const shown = guests.filter((g) => {
    if (rsvpFilter !== 'all' && g.rsvp_status !== rsvpFilter) return false
    if (group !== 'all' && g.group_name !== group) return false
    if (!q) return true
    return [g.name, g.group_name, g.notes].some((f) => (f ?? '').toLowerCase().includes(q))
  })

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Tamu"
        description="Daftar undangan dan konfirmasi kehadiran. Jumlah orang yang hadir membantu menghitung porsi katering."
        actions={
          <Button onClick={addGuest} icon={atLimit ? <Crown className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}>
            Tambah tamu
          </Button>
        }
      />

      <HowTo
        id="guests"
        steps={[
          <>Tambahkan tamu per undangan, isi berapa orang yang ikut datang.</>,
          <>Setelah undangan dikirim, tekan <strong className="text-ink">Belum dikirim</strong> agar berubah jadi terkirim.</>,
          <>Saat tamu membalas, pilih <strong className="text-ink">Hadir</strong> atau <strong className="text-ink">Tidak hadir</strong>.</>,
        ]}
      />

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Stat label="Hadir" value={people(hadir)} hint={`${hadir.length} undangan`} tone="success" />
          <Stat label="Belum jawab" value={menunggu.length} hint={`± ${people(menunggu)} orang`} tone="warning" />
          <Stat label="Tidak hadir" value={tidak.length} hint={`${people(tidak)} orang`} />
        </div>
        <div className="mt-4 border-t border-border pt-4 sm:mt-5">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="text-ink-muted">
              Undangan terkirim: <strong className="text-ink tabular">{sent}</strong> dari {guests.length}
            </span>
            <span className="text-ink-muted">
              Siapkan katering untuk ± <strong className="text-ink tabular">{people(hadir) + people(menunggu)} orang</strong>
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

      {atLimit && (
        <LockedPanel
          source="tamu"
          title={`Batas ${FREE_GUEST_LIMIT} undangan paket Gratis tercapai`}
          description="Semua tamu yang sudah dicatat tetap aman dan bisa diubah. Upgrade untuk menambah tamu tanpa batas."
        />
      )}

      <div className="space-y-3">
        <ChipGroup<RsvpFilter>
          label="Saring berdasarkan jawaban"
          value={rsvpFilter}
          onChange={setRsvpFilter}
          options={[
            { value: 'all', label: 'Semua', count: guests.length },
            { value: 'menunggu', label: 'Belum jawab', count: menunggu.length },
            { value: 'hadir', label: 'Hadir', count: hadir.length },
            { value: 'tidak_hadir', label: 'Tidak hadir', count: tidak.length },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput label="Cari tamu" value={query} onChange={setQuery} placeholder="Cari nama tamu…" className="sm:max-w-sm sm:flex-1" />
          {groups.length > 0 && (
            <SelectFilter label="Saring berdasarkan kelompok" value={group} onChange={setGroup} className="sm:w-56">
              <option value="all">Semua kelompok</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </SelectFilter>
          )}
        </div>
      </div>

      {guests.length === 0 ? (
        <EmptyState
          icon={<Users className="size-7" aria-hidden />}
          title="Belum ada tamu"
          description="Mulai dari keluarga inti, lalu teman dan kolega. Satu baris = satu undangan."
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
          description="Coba kata kunci lain atau pilih Semua."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setRsvpFilter('all')
                setGroup('all')
                setQuery('')
              }}
            >
              Tampilkan semua
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {shown.map((guest) => {
              const isSent = guest.invitation_status === 'terkirim'
              return (
                <li key={guest.id} className="flex flex-col gap-2.5 p-3.5 sm:gap-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:gap-3">
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{guest.name}</p>
                      <p className="mt-0.5 truncate text-sm text-ink-muted">
                        {[guest.group_name, `${guest.guest_count} orang`, guest.notes].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <IconButton label={`Hapus ${guest.name}`} tone="danger" onClick={() => confirm.ask(guest)} className="-mr-1 lg:hidden">
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  </div>

                  <div className="flex items-center gap-2 lg:flex-wrap">
                    <button
                      type="button"
                      aria-pressed={isSent}
                      aria-label={isSent ? `Undangan ${guest.name} sudah terkirim, ketuk untuk batalkan` : `Tandai undangan ${guest.name} terkirim`}
                      title={isSent ? 'Undangan terkirim' : 'Belum dikirim'}
                      onClick={() => void updateGuestInvitation(guest.id, isSent ? 'belum' : 'terkirim')}
                      className={cn(
                        'inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors sm:h-9 sm:px-3',
                        isSent ? 'border-primary/30 bg-primary-soft text-primary' : 'border-border-strong bg-surface text-ink-muted hover:text-ink',
                      )}
                    >
                      {isSent ? <Check className="size-4 shrink-0" aria-hidden /> : <Mail className="size-4 shrink-0" aria-hidden />}
                      <span className="hidden sm:inline">{isSent ? 'Undangan terkirim' : 'Belum dikirim'}</span>
                    </button>

                    <div role="radiogroup" aria-label={`Jawaban ${guest.name}`} className="flex flex-1 rounded-lg border border-border bg-surface p-0.5 lg:flex-none">
                      {RSVP_OPTIONS.map((opt) => {
                        const active = guest.rsvp_status === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={opt.label}
                            onClick={() => !active && void updateGuestRsvp(guest.id, opt.value)}
                            className={cn(
                              'h-9 flex-1 cursor-pointer rounded-md border px-1 text-sm font-medium transition-colors sm:h-8 sm:px-2.5 lg:flex-none',
                              active ? opt.active : 'border-transparent text-ink-muted hover:text-ink',
                            )}
                          >
                            <span className="sm:hidden">{opt.short}</span>
                            <span className="hidden sm:inline">{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    <IconButton label={`Hapus ${guest.name}`} tone="danger" onClick={() => confirm.ask(guest)} className="hidden lg:inline-flex">
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <GuestModal isOpen={showGuestModal} onClose={() => setShowGuestModal(false)} existingGroups={groups} onSubmit={createGuest} />
      <ConfirmDialog
        open={confirm.target != null}
        title="Hapus tamu ini?"
        message={
          <>
            <strong className="text-ink">{confirm.target?.name}</strong> akan dihapus dari daftar undangan.
          </>
        }
        onConfirm={() => (confirm.target ? deleteGuest(confirm.target.id) : undefined)}
        onClose={confirm.close}
      />
    </div>
  )
}
