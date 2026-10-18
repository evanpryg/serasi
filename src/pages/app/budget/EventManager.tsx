import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatDateShort } from '@/lib/format'
import { eventIcon, eventTone } from '@/lib/budgetIcons'
import type { BudgetEvent } from '@/lib/database.types'
import type { EventInput } from '@/hooks/usePlanningData'
import { EventForm } from './EventForm'

type EventManagerProps = {
  open: boolean
  events: BudgetEvent[]
  posCount: (eventId: string) => number
  onClose: () => void
  onCreate: (input: EventInput) => Promise<string>
  onUpdate: (id: string, input: EventInput) => Promise<void>
  onAskDelete: (ev: BudgetEvent) => void
}

/** Lembar "Kelola acara": tambah, ubah nama/ikon/tanggal, dan hapus acara. */
export function EventManager({ open, events, posCount, onClose, onCreate, onUpdate, onAskDelete }: EventManagerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // <dialog>.showModal(): focus trap, Esc, dan background inert bawaan browser.
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    if (!open) setEditing(null)
  }, [open])

  const names = events.map((e) => e.name)

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="kelola-acara-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none bg-transparent p-0 backdrop:bg-ink/45 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-xl"
    >
      <div className="safe-bottom animate-sheet-up flex max-h-[92dvh] flex-col rounded-t-[1.5rem] bg-surface shadow-pop sm:animate-fade-up sm:rounded-[1.5rem]">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-4 sm:px-6">
          <div>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
            <h2 id="kelola-acara-title" className="font-display text-2xl font-semibold text-ink">
              Kelola acara
            </h2>
            <p className="mt-0.5 text-sm text-ink-muted">Setiap acara punya pos sendiri, misalnya Make up lamaran dan Make up wedding.</p>
          </div>
          <button type="button" onClick={onClose} className="-mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted" aria-label="Tutup">
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 sm:px-6">
          <ul className="space-y-2">
            {events.map((ev, i) => {
              const Icon = eventIcon(ev.icon)
              const tone = eventTone(i)
              const n = posCount(ev.id)
              return (
                <li key={ev.id} className="rounded-2xl border border-border bg-surface">
                  {editing === ev.id ? (
                    <div className="p-4">
                      <EventForm
                        initial={ev}
                        existingNames={names.filter((x) => x !== ev.name)}
                        onSubmit={async (input) => {
                          await onUpdate(ev.id, input)
                          setEditing(null)
                        }}
                        onCancel={() => setEditing(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-2.5 pl-3">
                      <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', tone.tile)}>
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{ev.name}</p>
                        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                          {ev.event_date && (
                            <>
                              <CalendarDays className="size-3.5" aria-hidden />
                              {formatDateShort(ev.event_date)} ·{' '}
                            </>
                          )}
                          {n === 0 ? 'Belum ada pos' : `${n} pos`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing(ev.id)}
                        aria-label={`Ubah acara ${ev.name}`}
                        className="flex size-11 cursor-pointer items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => onAskDelete(ev)}
                        aria-label={`Hapus acara ${ev.name}`}
                        className="flex size-11 cursor-pointer items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="mt-3">
            {editing === 'new' ? (
              <div className="rounded-2xl border border-primary/25 bg-primary-soft/30 p-4">
                <EventForm
                  existingNames={names}
                  onSubmit={async (input) => {
                    await onCreate(input)
                    setEditing(null)
                  }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <Button variant="secondary" className="w-full" icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing('new')}>
                Tambah acara
              </Button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}
