import { useState } from 'react'
import {
  Clock,
  MailCheck,
  Plus,
  Search,
  Trash2,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useGuestsData } from '@/hooks/usePlanningData'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { GuestModal } from './guests/GuestModal'
import type { Guest } from '@/lib/database.types'

export function GuestsPage() {
  const wedding = useWedding()
  const { state, reload, updateGuestRsvp, updateGuestInvitation, createGuest, deleteGuest } = useGuestsData(wedding.id)
  const isDemo = Boolean(getCurrentDemoAccount())
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedRsvp, setSelectedRsvp] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showGuestModal, setShowGuestModal] = useState(false)

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <header>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-2 h-5 w-80" />
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat daftar tamu." onRetry={() => void reload()} />
  }

  const guests = state.data

  // Stats
  const totalGuests = guests.length
  const hadirGuests = guests.filter((g) => g.rsvp_status === 'hadir')
  const hadirPax = hadirGuests.reduce((sum, g) => sum + g.guest_count, 0)
  const menungguGuests = guests.filter((g) => g.rsvp_status === 'menunggu')
  const tidakHadirGuests = guests.filter((g) => g.rsvp_status === 'tidak_hadir')
  const terkirimCount = guests.filter((g) => g.invitation_status === 'terkirim').length

  // Available groups
  const groups = Array.from(new Set(guests.map((g) => g.group_name).filter(Boolean))) as string[]

  // Filtered
  const filteredGuests = guests.filter((g) => {
    if (selectedGroup !== 'all' && g.group_name !== selectedGroup) return false
    if (selectedRsvp !== 'all' && g.rsvp_status !== selectedRsvp) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const name = g.name.toLowerCase()
      const grp = (g.group_name ?? '').toLowerCase()
      const notes = (g.notes ?? '').toLowerCase()
      return name.includes(q) || grp.includes(q) || notes.includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[2.4rem] font-semibold leading-tight sm:text-5xl">Daftar Tamu & RSVP</h1>
            {isDemo && (
              <Badge tone="gold" className="self-center">
                Akun Demo Interaktif
              </Badge>
            )}
          </div>
          <p className="mt-1 text-ink-muted">
            Kelola undangan keluarga, kolega, dan VIP serta pantau konfirmasi kehadiran untuk persiapan katering.
          </p>
        </div>

        <Button
          onClick={() => setShowGuestModal(true)}
          icon={<Plus className="size-4" />}
        >
          Tambah Tamu
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Estimasi vs Terkonfirmasi */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Terkonfirmasi Hadir</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-success-soft text-success">
              <UserCheck className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-success">
            {hadirPax} <span className="text-sm font-normal text-ink-muted">pax</span>
          </p>
          <p className="mt-1 text-xs text-ink-subtle">{hadirGuests.length} undangan keluarga/tamu</p>
        </Card>

        {/* Menunggu Konfirmasi */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Menunggu RSVP</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-gold-soft text-gold-text">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">
            {menungguGuests.length} <span className="text-sm font-normal text-ink-muted">undangan</span>
          </p>
          <p className="mt-1 text-xs text-ink-subtle">
            {menungguGuests.reduce((s, g) => s + g.guest_count, 0)} estimasi pax
          </p>
        </Card>

        {/* Tidak Hadir */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Tidak Dapat Hadir</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <XCircle className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">
            {tidakHadirGuests.length} <span className="text-sm font-normal text-ink-muted">undangan</span>
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Sudah mengirim kabar berhalangan</p>
        </Card>

        {/* Undangan Terkirim */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Undangan Terkirim</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <MailCheck className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-primary">
            {terkirimCount} <span className="text-sm font-normal text-ink-muted">dari {totalGuests}</span>
          </p>
          <p className="mt-1 text-xs text-ink-subtle">
            {Math.round((terkirimCount / Math.max(1, totalGuests)) * 100)}% undangan didistribusikan
          </p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedGroup('all')}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedGroup === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface border border-border text-ink-muted hover:bg-surface-muted hover:text-ink'
            }`}
          >
            Semua Grup ({totalGuests})
          </button>
          {groups.map((group) => {
            const count = guests.filter((g) => g.group_name === group).length
            return (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  selectedGroup === group
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface border border-border text-ink-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                {group} ({count})
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRsvp}
            onChange={(e) => setSelectedRsvp(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink focus:border-primary focus:outline-none"
          >
            <option value="all">Semua RSVP</option>
            <option value="hadir">Hadir</option>
            <option value="menunggu">Menunggu</option>
            <option value="tidak_hadir">Tidak Hadir</option>
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Cari nama tamu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Guest Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs font-semibold uppercase text-ink-muted">
              <tr>
                <th className="px-5 py-3.5">Nama Tamu & Undangan</th>
                <th className="px-5 py-3.5">Kelompok</th>
                <th className="px-5 py-3.5 text-center">Pax</th>
                <th className="px-5 py-3.5 text-center">Undangan</th>
                <th className="px-5 py-3.5 text-center">Status RSVP</th>
                <th className="px-5 py-3.5">Catatan</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-muted">
                    Tidak ada tamu yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="transition-colors hover:bg-surface-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{guest.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      {guest.group_name ? (
                        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                          {guest.group_name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-ink tabular">{guest.guest_count}</td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          void updateGuestInvitation(guest.id, guest.invitation_status === 'terkirim' ? 'belum' : 'terkirim')
                        }
                        className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 ${
                          guest.invitation_status === 'terkirim'
                            ? 'bg-primary-soft text-primary'
                            : 'bg-surface-muted text-ink-muted'
                        }`}
                        title="Klik untuk mengubah status undangan"
                      >
                        {guest.invitation_status === 'terkirim' ? '✓ Terkirim' : 'Belum'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <select
                        value={guest.rsvp_status}
                        onChange={(e) => void updateGuestRsvp(guest.id, e.target.value as Guest['rsvp_status'])}
                        className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                          guest.rsvp_status === 'hadir'
                            ? 'bg-success-soft text-success'
                            : guest.rsvp_status === 'menunggu'
                              ? 'bg-gold-soft text-gold-text'
                              : 'bg-danger-soft text-danger'
                        }`}
                      >
                        <option value="hadir">Hadir</option>
                        <option value="menunggu">Menunggu</option>
                        <option value="tidak_hadir">Tidak Hadir</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-muted">{guest.notes ?? '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus tamu "${guest.name}"?`)) {
                            void deleteGuest(guest.id)
                          }
                        }}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-subtle hover:bg-danger-soft hover:text-danger transition-colors"
                        title="Hapus Tamu"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Guest Modal */}
      <GuestModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        existingGroups={groups}
        onSubmit={async (data) => {
          await createGuest(data)
        }}
      />
    </div>
  )
}
