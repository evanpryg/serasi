import { useState } from 'react'
import { Check, Mail, Plus, Trash2, Users } from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useGuestsData } from '@/hooks/usePlanningData'
import { Card, ProgressBar } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ChipGroup, ConfirmDialog, HowTo, IconButton, PageHeader, SearchInput, SelectFilter, Stat, useConfirm } from '@/components/ui/PageKit'
import { cn } from '@/lib/cn'
import type { Guest } from '@/lib/database.types'
import { GuestModal } from './guests/GuestModal'

type Rsvp = Guest['rsvp_status']
type RsvpFilter = 'all' | Rsvp

const RSVP_OPTIONS: { value: Rsvp; label: string; active: string }[] = [
  { value: 'hadir', label: 'Hadir', active: 'bg-success text-white border-success' },
  { value: 'menunggu', label: 'Belum jawab', active: 'bg-gold-soft text-gold-text border-gold' },
  { value: 'tidak_hadir', label: 'Tidak hadir', active: 'bg-danger-soft text-danger border-danger/40' },
]

export function GuestsPage() {
  const wedding = useWedding()
  const { state, reload, updateGuestRsvp, updateGuestInvitation, createGuest, deleteGuest } = useGuestsData(wedding.id)
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>('all')
  const [group, setGroup] = useState('all')
  const [query, setQuery] = useState('')
  const [showGuestModal, setShowGuestModal] = useState(false)
  const confirm = useConfirm<Guest>()

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
          <Button onClick={() => setShowGuestModal(true)} icon={<Plus className="size-4" aria-hidden />}>
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

      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Pasti hadir" value={`${people(hadir)} orang`} hint={`${hadir.length} undangan sudah konfirmasi`} tone="success" />
          <Stat label="Belum menjawab" value={`${menunggu.length} undangan`} hint={`sekitar ${people(menunggu)} orang`} tone="warning" />
          <Stat label="Tidak hadir" value={`${tidak.length} undangan`} hint={`${people(tidak)} orang`} />
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="text-ink-muted">
              Undangan terkirim: <strong className="text-ink tabular">{sent}</strong> dari {guests.length}
            </span>
            <span className="text-ink-muted">
              Siapkan katering untuk ± <strong className="text-ink tabular">{people(hadir) + people(menunggu)} orang</strong>
            </span>
          </div>
          <ProgressBar value={sentPct} label="Undangan terkirim" />
        </div>
      </Card>

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
            <Button onClick={() => setShowGuestModal(true)} icon={<Plus className="size-4" aria-hidden />}>
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
                <li key={guest.id} className="flex flex-col gap-3 p-4 sm:px-6 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{guest.name}</p>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {[guest.group_name, `${guest.guest_count} orang`, guest.notes].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <IconButton label={`Hapus ${guest.name}`} tone="danger" onClick={() => confirm.ask(guest)} className="lg:hidden">
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={isSent}
                      onClick={() => void updateGuestInvitation(guest.id, isSent ? 'belum' : 'terkirim')}
                      className={cn(
                        'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                        isSent ? 'border-primary/30 bg-primary-soft text-primary' : 'border-border-strong bg-surface text-ink-muted hover:text-ink',
                      )}
                    >
                      {isSent ? <Check className="size-4" aria-hidden /> : <Mail className="size-4" aria-hidden />}
                      {isSent ? 'Undangan terkirim' : 'Belum dikirim'}
                    </button>

                    <div role="radiogroup" aria-label={`Jawaban ${guest.name}`} className="inline-flex rounded-lg border border-border bg-surface p-0.5">
                      {RSVP_OPTIONS.map((opt) => {
                        const active = guest.rsvp_status === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => !active && void updateGuestRsvp(guest.id, opt.value)}
                            className={cn(
                              'h-8 cursor-pointer rounded-md border px-2.5 text-sm font-medium transition-colors',
                              active ? opt.active : 'border-transparent text-ink-muted hover:text-ink',
                            )}
                          >
                            {opt.label}
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
