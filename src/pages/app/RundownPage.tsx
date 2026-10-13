import { useState } from 'react'
import {
  CalendarClock,
  Clock,
  MapPin,
  Plus,
  Trash2,
  User,
} from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useRundownData } from '@/hooks/usePlanningData'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { formatDate } from '@/lib/format'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { RundownModal } from './rundown/RundownModal'

function formatTimeOnly(isoString: string | null): string {
  if (!isoString) return '--:--'
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return '--:--'
  }
}

export function RundownPage() {
  const wedding = useWedding()
  const { state, reload, createRundownItem, deleteRundownItem } = useRundownData(wedding.id)
  const isDemo = Boolean(getCurrentDemoAccount())
  const [showRundownModal, setShowRundownModal] = useState(false)

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <header>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-2 h-5 w-80" />
        </header>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat rundown acara." onRetry={() => void reload()} />
  }

  const items = state.data
  const firstItem = items[0]
  const lastItem = items[items.length - 1]

  const startTime = firstItem ? formatTimeOnly(firstItem.starts_at) : '--:--'
  const endTime = lastItem ? formatTimeOnly(lastItem.ends_at) : '--:--'

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[2.4rem] font-semibold leading-tight sm:text-5xl">Rundown Hari H</h1>
            {isDemo && (
              <Badge tone="gold" className="self-center">
                Akun Demo Interaktif
              </Badge>
            )}
          </div>
          <p className="mt-1 text-ink-muted">
            Susunan jadwal acara per menit, PIC penanggung jawab, dan lokasi ruangan agar seluruh panitia kompak.
          </p>
        </div>

        <Button
          onClick={() => setShowRundownModal(true)}
          icon={<Plus className="size-4" />}
        >
          Tambah Sesi Acara
        </Button>
      </header>

      {/* Ringkasan Acara */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Hari Pernikahan</span>
            <p className="mt-0.5 font-display text-xl font-bold text-ink">
              {wedding.wedding_date ? formatDate(wedding.wedding_date) : 'Tanggal belum ditetapkan'} · {wedding.city}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
              {items.length} Rangkaian Sesi
            </div>
            <div className="rounded-xl bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink-muted">
              Pukul {startTime} – {endTime} WIB
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-subtle">
          💡 <strong>Tips Hari H:</strong> Bagikan halaman rundown ini kepada ketua WO, saksi nikah, MC, dan koordinator keluarga agar tidak terjadi miskomunikasi.
        </p>
      </Card>

      {/* Timeline List */}
      <div className="relative pl-6 sm:pl-8">
        {/* Continuous Line */}
        <div className="absolute bottom-4 left-2.5 top-4 w-0.5 bg-border sm:left-3" />

        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <CalendarClock className="mx-auto size-10 text-ink-subtle" />
              <p className="mt-3 font-semibold text-ink">Belum ada jadwal rundown</p>
              <p className="text-sm text-ink-muted">Susunan acara hari H akan tampil di sini.</p>
            </div>
          ) : (
            items.map((item, index) => {
              const startFmt = formatTimeOnly(item.starts_at)
              const endFmt = formatTimeOnly(item.ends_at)

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Bullet Node */}
                  <div className="absolute -left-6 top-3 flex size-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-primary bg-surface sm:-left-8">
                    <div className="size-2 rounded-full bg-primary" />
                  </div>

                  {/* Card Event Content */}
                  <Card className="p-5 transition-shadow hover:shadow-pop">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        {/* Time tag */}
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2.5 py-1 font-mono text-xs font-bold text-primary">
                            <Clock className="size-3" />
                            {startFmt} – {endFmt} WIB
                          </span>
                          <span className="text-xs font-medium text-ink-subtle">Sesi #{index + 1}</span>
                        </div>

                        {/* Title */}
                        <h3 className="mt-2 text-base font-bold text-ink">{item.title}</h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus sesi acara "${item.title}"?`)) {
                            void deleteRundownItem(item.id)
                          }
                        }}
                        className="self-end sm:self-start inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-subtle hover:bg-danger-soft hover:text-danger transition-colors"
                        title="Hapus Sesi Acara"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Metadata: Location & PIC */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
                      {item.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      {item.person_in_charge && (
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5 text-gold-text" />
                          <span>
                            PIC: <strong>{item.person_in_charge}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Technical Notes */}
                    {item.notes && (
                      <div className="mt-3 rounded-xl bg-surface-muted/60 p-3 text-xs leading-relaxed text-ink/90">
                        <strong>Catatan Pelaksanaan:</strong> {item.notes}
                      </div>
                    )}
                  </Card>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Rundown Modal */}
      <RundownModal
        isOpen={showRundownModal}
        onClose={() => setShowRundownModal(false)}
        weddingDateStr={wedding.wedding_date}
        onSubmit={async (data) => {
          await createRundownItem(data)
        }}
      />
    </div>
  )
}
