import { AlertTriangle, CalendarClock, MapPin, Plus, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useRundownData } from '@/hooks/usePlanningData'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog, HowTo, IconButton, PageHeader, Stat, useConfirm } from '@/components/ui/PageKit'
import { formatDate } from '@/lib/format'
import type { RundownItem } from '@/lib/database.types'
import { RundownModal } from './rundown/RundownModal'

function timeOf(iso: string | null): string {
  if (!iso) return '--:--'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function minutesBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null
  const diff = (new Date(b).getTime() - new Date(a).getTime()) / 60000
  return Number.isFinite(diff) && diff > 0 ? Math.round(diff) : null
}

function durationLabel(min: number | null): string | null {
  if (min == null) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  return [h && `${h} jam`, m && `${m} menit`].filter(Boolean).join(' ')
}

export function RundownPage() {
  const wedding = useWedding()
  const { state, reload, createRundownItem, deleteRundownItem } = useRundownData(wedding.id)
  const [showRundownModal, setShowRundownModal] = useState(false)
  const confirm = useConfirm<RundownItem>()

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-28 rounded-card" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat rundown acara." onRetry={() => void reload()} />
  }

  // Urutkan berdasarkan jam mulai; item tanpa jam tetap di urutan aslinya di akhir.
  const items = [...state.data].sort((a, b) => {
    if (a.starts_at && b.starts_at) return a.starts_at.localeCompare(b.starts_at)
    if (a.starts_at) return -1
    if (b.starts_at) return 1
    return a.sort_order - b.sort_order
  })
  const timed = items.filter((i) => i.starts_at)
  const first = timed[0]
  const lastEnd = timed.reduce<string | null>((max, i) => (i.ends_at && (!max || i.ends_at > max) ? i.ends_at : max), null)
  const clashes = new Set(
    items.filter((item, idx) => {
      const prev = items[idx - 1]
      return idx > 0 && prev?.ends_at && item.starts_at && item.starts_at < prev.ends_at
    }).map((i) => i.id),
  )

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Rundown hari H"
        description="Urutan acara di hari pernikahan: jam berapa, di mana, dan siapa yang bertanggung jawab."
        actions={
          <Button onClick={() => setShowRundownModal(true)} icon={<Plus className="size-4" aria-hidden />}>
            Tambah sesi
          </Button>
        }
      />

      <HowTo
        id="rundown"
        steps={[
          <>Tambahkan setiap sesi acara lengkap dengan jam mulai dan selesai.</>,
          <>Isi lokasi dan <strong className="text-ink">PIC</strong> (orang yang bertanggung jawab) agar tidak ada yang bingung.</>,
          <>Bagikan halaman ini ke WO, MC, dan koordinator keluarga sebelum hari H.</>,
        ]}
      />

      <Card className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <Stat label="Tanggal acara" value={wedding.wedding_date ? formatDate(wedding.wedding_date) : 'Belum ditentukan'} hint={wedding.city} />
        <Stat label="Jam acara" value={first ? `${timeOf(first.starts_at)}–${timeOf(lastEnd)}` : '—'} hint="Waktu setempat" />
        <Stat
          label="Jumlah sesi"
          value={`${items.length} sesi`}
          hint={
            clashes.size > 0 ? (
              <span className="inline-flex items-center gap-1 text-danger">
                <AlertTriangle className="size-3.5" aria-hidden />
                {clashes.size} sesi jamnya bentrok
              </span>
            ) : (
              'Tidak ada jadwal bentrok'
            )
          }
        />
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="size-7" aria-hidden />}
          title="Rundown masih kosong"
          description="Mulai dari sesi utama, misalnya akad nikah, lalu resepsi, foto keluarga, dan makan bersama."
          action={
            <Button onClick={() => setShowRundownModal(true)} icon={<Plus className="size-4" aria-hidden />}>
              Tambah sesi pertama
            </Button>
          }
        />
      ) : (
        <ol className="space-y-3">
          {items.map((item) => {
            const duration = durationLabel(minutesBetween(item.starts_at, item.ends_at))
            const clash = clashes.has(item.id)
            return (
              <li key={item.id} className="grid grid-cols-[4.25rem_1fr] gap-3 sm:grid-cols-[5.5rem_1fr] sm:gap-4">
                <div className="pt-4 text-right">
                  <p className="font-display text-xl font-bold leading-none text-ink tabular sm:text-2xl">{timeOf(item.starts_at)}</p>
                  {item.ends_at && <p className="mt-1 text-xs text-ink-subtle tabular">s.d. {timeOf(item.ends_at)}</p>}
                </div>
                <Card className={clash ? 'border-danger/40 p-4 sm:p-5' : 'p-4 sm:p-5'}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink">{item.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {duration && <Badge>{duration}</Badge>}
                        {clash && (
                          <Badge tone="danger">
                            <AlertTriangle className="size-3" aria-hidden />
                            Bentrok dengan sesi sebelumnya
                          </Badge>
                        )}
                      </div>
                    </div>
                    <IconButton label={`Hapus sesi ${item.title}`} tone="danger" onClick={() => confirm.ask(item)} className="-mr-2 -mt-2">
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  </div>
                  {(item.location || item.person_in_charge) && (
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-muted">
                      {item.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-4 text-primary" aria-hidden />
                          {item.location}
                        </span>
                      )}
                      {item.person_in_charge && (
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="size-4 text-gold-text" aria-hidden />
                          PIC: <strong className="font-semibold text-ink">{item.person_in_charge}</strong>
                        </span>
                      )}
                    </div>
                  )}
                  {item.notes && <p className="mt-3 rounded-xl bg-surface-muted/60 p-3 text-sm text-ink-muted">{item.notes}</p>}
                </Card>
              </li>
            )
          })}
        </ol>
      )}

      <RundownModal
        isOpen={showRundownModal}
        onClose={() => setShowRundownModal(false)}
        weddingDateStr={wedding.wedding_date}
        onSubmit={createRundownItem}
      />
      <ConfirmDialog
        open={confirm.target != null}
        title="Hapus sesi ini?"
        message={
          <>
            Sesi <strong className="text-ink">{confirm.target?.title}</strong> akan dihapus dari rundown.
          </>
        }
        onConfirm={() => (confirm.target ? deleteRundownItem(confirm.target.id) : undefined)}
        onClose={confirm.close}
      />
    </div>
  )
}
