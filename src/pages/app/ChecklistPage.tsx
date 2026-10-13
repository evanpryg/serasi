import { useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronRight, ListChecks, Plus, RotateCcw, StickyNote } from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useChecklistData } from '@/hooks/usePlanningData'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog, PageHeader, useConfirm } from '@/components/ui/PageKit'
import { m } from '@/components/motion'
import { cn } from '@/lib/cn'
import { daysBetween, formatDateShort, parseDateOnly } from '@/lib/format'
import { CHECKLIST_EVENTS, type ChecklistEventKey, type ChecklistItem } from '@/lib/checklistTypes'
import { buildInitialTasks, calculateEventSummary, calculateOverallSummary } from '@/lib/checklistTemplates'
import { TaskSheet } from './checklist/TaskSheet'

const EVENT_KEYS = Object.keys(CHECKLIST_EVENTS) as ChecklistEventKey[]
/** Kategori untuk tugas yang ditambah lewat kolom cepat. */
const CUSTOM_CATEGORY = 'Tugas kami'

function daysLeft(task: ChecklistItem): number | null {
  return task.due_date ? daysBetween(new Date(), parseDateOnly(task.due_date)) : null
}

function eventOf(task: ChecklistItem): ChecklistEventKey {
  return (task.event as ChecklistEventKey) || 'pernikahan'
}

/** Kelompokkan per kategori, urutan sesuai template (tugas tambahan di paling atas). */
function groupByCategory(tasks: ChecklistItem[]) {
  const groups = new Map<string, ChecklistItem[]>()
  for (const t of [...tasks].sort((a, b) => a.sort_order - b.sort_order)) {
    const key = t.category || 'Lainnya'
    groups.set(key, [...(groups.get(key) ?? []), t])
  }
  const custom = groups.get(CUSTOM_CATEGORY)
  if (custom) {
    groups.delete(CUSTOM_CATEGORY)
    return [[CUSTOM_CATEGORY, custom] as const, ...groups.entries()]
  }
  return [...groups.entries()]
}

export function ChecklistPage() {
  const wedding = useWedding()
  const { state, reload, toggleTask, createTask, updateTask, deleteTask, resetToTemplates } = useChecklistData(wedding.id, wedding.wedding_date)

  const [eventTab, setEventTab] = useState<ChecklistEventKey>('pernikahan')
  const [showDone, setShowDone] = useState(false)
  const [lateOnly, setLateOnly] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [editing, setEditing] = useState<ChecklistItem | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const confirmDelete = useConfirm<ChecklistItem>()
  const addRef = useRef<HTMLInputElement>(null)

  if (state.status === 'loading') {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat checklist." onRetry={() => void reload()} />
  }

  const tasks = state.data.filter((t) => !t.is_archived)
  const overall = calculateOverallSummary(tasks)
  const perEvent = calculateEventSummary(tasks)
  const late = (t: ChecklistItem) => t.status !== 'done' && (daysLeft(t) ?? 0) < 0

  const scope = lateOnly ? tasks.filter(late) : tasks.filter((t) => eventOf(t) === eventTab)
  const visible = showDone || lateOnly ? scope : scope.filter((t) => t.status !== 'done')
  const doneHidden = lateOnly ? 0 : scope.length - visible.length
  const groups = groupByCategory(visible)

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) {
      addRef.current?.focus()
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      await createTask({ title, event: eventTab, category: CUSTOM_CATEGORY })
      setNewTitle('')
      addRef.current?.focus()
    } catch {
      setAddError('Tugas gagal ditambahkan. Periksa koneksi lalu coba lagi.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader title="Checklist" description="Centang yang sudah beres. Ketuk tugas untuk memberi tanggal atau catatan." />

      {/* Progres: satu angka + bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">Sudah beres</p>
            <p className="font-num text-[2.1rem] font-semibold leading-tight text-ink sm:text-5xl">{overall.completionPercent}%</p>
          </div>
          <p className="pb-1 text-sm text-ink-muted">
            <span className="font-semibold text-ink tabular">{overall.doneCount}</span> dari <span className="tabular">{overall.totalCount}</span> tugas
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
          <m.div
            className="h-full origin-left rounded-full bg-primary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: overall.completionPercent / 100 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        {overall.overdueCount > 0 && (
          <button
            type="button"
            onClick={() => setLateOnly((v) => !v)}
            aria-pressed={lateOnly}
            className={cn(
              'mt-3 flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-left text-sm font-medium transition-colors',
              lateOnly ? 'bg-danger text-white' : 'bg-danger-soft text-danger hover:bg-danger-soft/70',
            )}
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">{lateOnly ? 'Menampilkan tugas terlambat saja' : `${overall.overdueCount} tugas lewat target`}</span>
            <span className="font-semibold">{lateOnly ? 'Tutup' : 'Lihat'}</span>
          </button>
        )}
      </Card>

      {!lateOnly && (
        <>
          {/* Pilih bagian: geser ke samping di layar kecil */}
          <div role="group" aria-label="Pilih bagian checklist" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {EVENT_KEYS.map((key) => {
              const sum = perEvent[key]
              const active = eventTab === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setEventTab(key)}
                  className={cn(
                    'inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors',
                    active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink',
                  )}
                >
                  {CHECKLIST_EVENTS[key].shortTitle}
                  <span className={cn('rounded-full px-1.5 text-xs font-medium tabular', active ? 'bg-white/20' : 'bg-surface-muted')}>
                    {sum.doneCount}/{sum.totalCount}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tambah cepat: ketik lalu Enter */}
          <form onSubmit={quickAdd} className="flex gap-2">
            <label htmlFor="quick-task" className="sr-only">
              Tambah tugas di {CHECKLIST_EVENTS[eventTab].shortTitle}
            </label>
            <input
              id="quick-task"
              ref={addRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={`Tambah tugas di ${CHECKLIST_EVENTS[eventTab].shortTitle}…`}
              maxLength={160}
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3.5 text-[0.95rem] text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
            />
            <Button type="submit" loading={adding} aria-label="Tambah tugas" className="w-11 px-0!">
              {!adding && <Plus className="size-5" aria-hidden />}
            </Button>
          </form>
          {addError && (
            <p role="alert" className="-mt-3 text-sm text-danger">
              {addError}
            </p>
          )}
        </>
      )}

      {groups.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-7" aria-hidden />}
          title={scope.length > 0 ? 'Semua sudah beres' : 'Belum ada tugas di sini'}
          description={scope.length > 0 ? 'Mantap! Bagian ini sudah selesai semua.' : 'Ketik tugas di kolom atas lalu tekan Enter.'}
        />
      ) : (
        <div className="space-y-4">
          {groups.map(([name, items]) => {
            const doneInGroup = scope.filter((t) => (t.category || 'Lainnya') === name && t.status === 'done').length
            const totalInGroup = scope.filter((t) => (t.category || 'Lainnya') === name).length
            return (
              <section key={name} aria-label={name}>
                <h2 className="mb-1.5 flex items-baseline justify-between gap-3 px-1 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                  <span className="truncate">{name}</span>
                  {!lateOnly && (
                    <span className="shrink-0 font-medium normal-case tracking-normal tabular">
                      {doneInGroup}/{totalInGroup}
                    </span>
                  )}
                </h2>
                <Card className="overflow-hidden">
                  <ul className="divide-y divide-border">
                    {items.map((item) => (
                      <TaskRow key={item.id} item={item} showEvent={lateOnly} onToggle={() => void toggleTask(item.id)} onOpen={() => setEditing(item)} />
                    ))}
                  </ul>
                </Card>
              </section>
            )
          })}
        </div>
      )}

      {(doneHidden > 0 || (showDone && !lateOnly)) && (
        <button
          type="button"
          onClick={() => setShowDone((v) => !v)}
          className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold text-primary hover:bg-primary-soft/50"
        >
          <Check className="size-4" aria-hidden />
          {showDone ? 'Sembunyikan yang sudah beres' : `Tampilkan ${doneHidden} tugas yang sudah beres`}
        </button>
      )}

      <div className="border-t border-border pt-4">
        <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} icon={<RotateCcw className="size-4" aria-hidden />}>
          Mulai ulang dari daftar awal
        </Button>
      </div>

      {editing && (
        <TaskSheet
          task={editing}
          onClose={() => setEditing(null)}
          onSave={(draft) => updateTask(editing.id, draft)}
          onDelete={() => {
            confirmDelete.ask(editing)
            setEditing(null)
          }}
        />
      )}
      <ConfirmDialog
        open={confirmDelete.target != null}
        title="Hapus tugas ini?"
        message={
          <>
            <strong className="text-ink">{confirmDelete.target?.title}</strong> akan dihapus dari checklist.
          </>
        }
        onConfirm={() => (confirmDelete.target ? deleteTask(confirmDelete.target.id) : undefined)}
        onClose={confirmDelete.close}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Mulai ulang checklist?"
        message="Semua tugas, centang, dan perubahan akan diganti dengan daftar awal (belum ada yang dicentang). Ini tidak bisa dibatalkan."
        confirmLabel="Ya, mulai ulang"
        onConfirm={() => resetToTemplates(buildInitialTasks(wedding.id, wedding.wedding_date, { fresh: true }))}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Baris tugas: centang · judul (+ tanggal) · buka detail
// ---------------------------------------------------------------------------
function TaskRow({ item, showEvent, onToggle, onOpen }: { item: ChecklistItem; showEvent?: boolean; onToggle: () => void; onOpen: () => void }) {
  const done = item.status === 'done'
  const left = daysLeft(item)
  const isLate = !done && left != null && left < 0
  const isSoon = !done && left != null && left >= 0 && left <= 7
  const note = item.notes?.replace('[Kondisional]', '').trim()

  let dueText: string | null = null
  if (!done && item.due_date && left != null) {
    dueText = isLate ? `Lewat ${-left} hari` : left === 0 ? 'Hari ini' : isSoon ? `${left} hari lagi` : formatDateShort(item.due_date)
  }

  return (
    <li className="flex items-center gap-1 pr-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`${done ? 'Batalkan centang' : 'Centang'}: ${item.title}`}
        onClick={onToggle}
        className="flex size-12 shrink-0 cursor-pointer items-center justify-center"
      >
        <span
          className={cn(
            'flex size-[1.375rem] items-center justify-center rounded-full border-2 transition-colors duration-200',
            done ? 'border-success bg-success text-white' : 'border-border-strong bg-surface hover:border-primary',
          )}
        >
          {done && <Check className="size-3" strokeWidth={3.5} aria-hidden />}
        </span>
      </button>

      <button type="button" onClick={onOpen} className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 text-left">
        <span className="block min-w-0 flex-1">
          <span className={cn('block text-[0.95rem] leading-snug', done ? 'text-ink-subtle line-through' : 'text-ink')}>{item.title}</span>
          {(dueText || showEvent || note) && (
            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-ink-subtle">
              {dueText && (
                <span className={cn('shrink-0 font-medium tabular', isLate ? 'text-danger' : isSoon ? 'text-warning' : 'text-ink-subtle')}>{dueText}</span>
              )}
              {showEvent && (
                <>
                  {dueText && <span aria-hidden>·</span>}
                  <span className="shrink-0">{CHECKLIST_EVENTS[eventOf(item)].shortTitle}</span>
                </>
              )}
              {note && (
                <>
                  {(dueText || showEvent) && <span aria-hidden>·</span>}
                  <StickyNote className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{note}</span>
                </>
              )}
            </span>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-subtle/70" aria-hidden />
      </button>
    </li>
  )
}
