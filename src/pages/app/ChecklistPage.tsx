import { useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  ShoppingBag,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useChecklistData } from '@/hooks/usePlanningData'
import { Card, Badge, ProgressBar } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ChipGroup, ConfirmDialog, HowTo, IconButton, PageHeader, SearchInput, SelectFilter, Stat, useConfirm } from '@/components/ui/PageKit'
import { cn } from '@/lib/cn'
import { daysBetween, formatDateShort, formatRupiah, parseDateOnly, relativeDueLabel } from '@/lib/format'
import { CHECKLIST_EVENTS, type ChecklistEventKey, type ChecklistItem } from '@/lib/checklistTypes'
import { buildInitialTasks, calculateEventSummary, calculateOverallSummary, groupTasksByCategory } from '@/lib/checklistTemplates'
import { TaskModal } from './checklist/TaskModal'

const EVENT_KEYS = Object.keys(CHECKLIST_EVENTS) as ChecklistEventKey[]
const SOON_DAYS = 14

const ITEM_STATUS: Record<string, { label: string; tone: 'success' | 'gold' | 'primary' | 'neutral' | 'danger' }> = {
  belum_dicari: { label: 'Belum dicari', tone: 'neutral' },
  sudah_dipilih: { label: 'Sudah dipilih', tone: 'primary' },
  sudah_dipesan: { label: 'Sudah dipesan', tone: 'gold' },
  sudah_dibeli: { label: 'Sudah dibeli', tone: 'success' },
  siap: { label: 'Siap', tone: 'success' },
  perlu_revisi: { label: 'Perlu revisi', tone: 'danger' },
}

type View = 'event' | 'all'
type StatusFilter = 'open' | 'late' | 'done' | 'all'

function daysLeft(task: ChecklistItem): number | null {
  return task.due_date ? daysBetween(new Date(), parseDateOnly(task.due_date)) : null
}

export function ChecklistPage() {
  const wedding = useWedding()
  const { state, reload, toggleTask, createTask, updateTask, deleteTask, duplicateTask, resetToTemplates } = useChecklistData(
    wedding.id,
    wedding.wedding_date,
  )

  const [view, setView] = useState<View>('event')
  const [eventTab, setEventTab] = useState<ChecklistEventKey>('pernikahan')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
  const [eventFilter, setEventFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ChecklistItem | null>(null)
  const [modalEvent, setModalEvent] = useState<ChecklistEventKey>('pernikahan')
  const confirmDelete = useConfirm<ChecklistItem>()
  const [confirmReset, setConfirmReset] = useState(false)

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
    return <ErrorState message="Gagal memuat checklist." onRetry={() => void reload()} />
  }

  const tasks = state.data.filter((t) => !t.is_archived)
  const overall = calculateOverallSummary(tasks)
  const perEvent = calculateEventSummary(tasks)
  const groups = groupTasksByCategory(tasks, eventTab)

  // Tugas yang perlu perhatian: terlambat atau jatuh tempo ≤ 14 hari, belum selesai.
  const attention = tasks
    .filter((t) => t.status !== 'done' && (daysLeft(t) ?? Infinity) <= SOON_DAYS)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
  const dueSoonCount = attention.length - overall.overdueCount

  const q = query.trim().toLowerCase()
  const listTasks = tasks
    .filter((t) => {
      if (eventFilter !== 'all' && t.event !== eventFilter) return false
      if (statusFilter === 'open' && t.status === 'done') return false
      if (statusFilter === 'done' && t.status !== 'done') return false
      if (statusFilter === 'late' && (t.status === 'done' || (daysLeft(t) ?? 0) >= 0)) return false
      if (!q) return true
      return [t.title, t.category, t.subcategory, t.vendor_store_name, t.notes, t.assignee].some((f) => (f ?? '').toLowerCase().includes(q))
    })
    .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))

  function openCreate(ev: ChecklistEventKey = eventTab) {
    setEditing(null)
    setModalEvent(ev)
    setModalOpen(true)
  }

  function openEdit(task: ChecklistItem) {
    setEditing(task)
    setModalOpen(true)
  }

  const rowProps = (item: ChecklistItem) => ({
    item,
    onToggle: () => void toggleTask(item.id),
    onEdit: () => openEdit(item),
    onDuplicate: () => void duplicateTask(item.id),
    onDelete: () => confirmDelete.ask(item),
  })

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Checklist"
        description="Semua yang perlu disiapkan, dikelompokkan per acara. Centang tugas yang sudah beres."
        actions={
          <Button onClick={() => openCreate()} icon={<Plus className="size-4" aria-hidden />}>
            Tambah tugas
          </Button>
        }
      />

      <HowTo
        id="checklist"
        steps={[
          <>Pilih acara di bawah: Lamaran, Pernikahan, Adat, Berkas KUA, atau Hari H.</>,
          <>Tekan <strong className="text-ink">kotak centang</strong> di kiri tugas saat tugas itu sudah beres.</>,
          <>Tekan <strong className="text-ink">judul tugas</strong> untuk mengisi tanggal, biaya, atau PIC.</>,
        ]}
      />

      {/* Progres keseluruhan */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-ink-muted">Progres persiapan</p>
            <p className="font-display text-4xl font-bold text-ink tabular">{overall.completionPercent}%</p>
          </div>
          <p className="text-sm text-ink-muted">
            <strong className="text-ink tabular">{overall.doneCount}</strong> dari {overall.totalCount} tugas selesai
          </p>
        </div>
        <div className="mt-4">
          <ProgressBar value={overall.completionPercent} label="Progres persiapan" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <Stat label="Terlambat" value={overall.overdueCount} tone={overall.overdueCount ? 'danger' : 'ink'} />
          <Stat label={`${SOON_DAYS} hari ke depan`} value={dueSoonCount} tone={dueSoonCount ? 'warning' : 'ink'} />
          <Stat label="Belum selesai" value={overall.pendingCount} />
          <Stat
            label="Perkiraan biaya"
            value={formatRupiah(overall.totalEstimatedCost)}
            hint={overall.totalActualCost ? `Sudah keluar ${formatRupiah(overall.totalActualCost)}` : undefined}
          />
        </div>
      </Card>

      {/* Fokus: yang harus dikerjakan sekarang */}
      {attention.length > 0 && (
        <section aria-labelledby="attention-title">
          <h2 id="attention-title" className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            Kerjakan dulu
            <span className="text-sm font-normal text-ink-muted">— terlambat atau jatuh tempo dalam {SOON_DAYS} hari</span>
          </h2>
          <div className="space-y-2">
            {attention.slice(0, 5).map((item) => (
              <TaskRow key={item.id} {...rowProps(item)} showEvent />
            ))}
          </div>
          {attention.length > 5 && (
            <button
              type="button"
              onClick={() => {
                setView('all')
                setStatusFilter('open')
                setEventFilter('all')
              }}
              className="mt-2 min-h-10 cursor-pointer text-sm font-semibold text-primary hover:underline"
            >
              Lihat {attention.length - 5} tugas mendesak lainnya
            </button>
          )}
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-ink">Semua tugas</h2>
        <ChipGroup<View>
          label="Cara menampilkan tugas"
          value={view}
          onChange={setView}
          options={[
            { value: 'event', label: 'Per acara' },
            { value: 'all', label: 'Daftar lengkap' },
          ]}
        />
      </div>

      {view === 'event' && (
        <div className="space-y-4">
          <div role="group" aria-label="Pilih acara" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
                    'cursor-pointer rounded-xl border p-3 text-left transition-colors',
                    active ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-border-strong',
                  )}
                >
                  <span className={cn('block text-sm font-semibold', active ? 'text-primary' : 'text-ink')}>{CHECKLIST_EVENTS[key].shortTitle}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted tabular">
                    {sum.doneCount}/{sum.totalCount} selesai
                    {sum.overdueCount > 0 && <span className="text-danger"> · {sum.overdueCount} terlambat</span>}
                  </span>
                  <span className="mt-2 block h-1 overflow-hidden rounded-full bg-surface-muted">
                    <span className="block h-full origin-left rounded-full bg-primary" style={{ transform: `scaleX(${sum.completionPercent / 100})` }} />
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-muted">
              {CHECKLIST_EVENTS[eventTab].description}
              {CHECKLIST_EVENTS[eventTab].isOptional && ' Bagian ini opsional: hapus tugas tradisi yang tidak kalian adakan.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => openCreate(eventTab)} icon={<Plus className="size-4" aria-hidden />}>
              Tambah di {CHECKLIST_EVENTS[eventTab].shortTitle}
            </Button>
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="size-7" aria-hidden />}
              title="Belum ada tugas di sini"
              description={`Tambahkan tugas pertama untuk ${CHECKLIST_EVENTS[eventTab].shortTitle}.`}
              action={
                <Button onClick={() => openCreate(eventTab)} icon={<Plus className="size-4" aria-hidden />}>
                  Tambah tugas
                </Button>
              }
            />
          ) : (
            groups.map((group) => {
              const isCollapsed = Boolean(collapsed[group.name])
              const all = [...group.subcategories.flatMap((s) => s.items), ...group.uncategorizedItems]
              return (
                <Card key={group.name} className="overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={!isCollapsed}
                    onClick={() => setCollapsed((p) => ({ ...p, [group.name]: !p[group.name] }))}
                    className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:bg-surface-muted/40 sm:px-5"
                  >
                    <ChevronDown className={cn('size-5 shrink-0 text-ink-muted transition-transform', isCollapsed && '-rotate-90')} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{group.name}</span>
                      <span className="block text-sm text-ink-muted tabular">
                        {group.doneItems} dari {group.totalItems} selesai
                      </span>
                    </span>
                    {group.completionPercent === 100 ? (
                      <Badge tone="success">
                        <Check className="size-3" aria-hidden />
                        Beres
                      </Badge>
                    ) : (
                      <span className="hidden w-24 sm:block">
                        <ProgressBar value={group.completionPercent} label={`Progres ${group.name}`} />
                      </span>
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-2 border-t border-border bg-canvas/40 p-3 sm:p-4">
                      {group.subcategories.length > 0
                        ? group.subcategories.map((sub) => (
                            <div key={sub.name} className="space-y-2">
                              <h4 className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{sub.name}</h4>
                              {sub.items.map((item) => (
                                <TaskRow key={item.id} {...rowProps(item)} />
                              ))}
                            </div>
                          ))
                        : null}
                      {group.uncategorizedItems.length > 0 && (
                        <div className="space-y-2">
                          {group.subcategories.length > 0 && <h4 className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Lainnya</h4>}
                          {group.uncategorizedItems.map((item) => (
                            <TaskRow key={item.id} {...rowProps(item)} />
                          ))}
                        </div>
                      )}
                      {all.length === 0 && <p className="p-2 text-sm text-ink-muted">Kosong.</p>}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {view === 'all' && (
        <div className="space-y-4">
          <ChipGroup<StatusFilter>
            label="Saring berdasarkan status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'open', label: 'Belum selesai', count: overall.pendingCount },
              { value: 'late', label: 'Terlambat', count: overall.overdueCount },
              { value: 'done', label: 'Selesai', count: overall.doneCount },
              { value: 'all', label: 'Semua', count: overall.totalCount },
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput label="Cari tugas" value={query} onChange={setQuery} placeholder="Cari tugas, toko, atau PIC…" className="sm:max-w-sm sm:flex-1" />
            <SelectFilter label="Saring berdasarkan acara" value={eventFilter} onChange={setEventFilter} className="sm:w-52">
              <option value="all">Semua acara</option>
              {EVENT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {CHECKLIST_EVENTS[k].shortTitle}
                </option>
              ))}
            </SelectFilter>
          </div>

          {listTasks.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="size-7" aria-hidden />}
              title={statusFilter === 'late' ? 'Tidak ada tugas terlambat' : 'Tidak ada tugas yang cocok'}
              description={statusFilter === 'late' ? 'Bagus, semua tugas masih sesuai jadwal.' : 'Coba kata kunci lain atau ubah saringan.'}
            />
          ) : (
            <div className="space-y-2">
              {listTasks.map((item) => (
                <TaskRow key={item.id} {...rowProps(item)} showEvent />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border pt-6">
        <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} icon={<RotateCcw className="size-4" aria-hidden />}>
          Mulai ulang dari template
        </Button>
      </div>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={async (data) => {
          if (editing) await updateTask(editing.id, data)
          else await createTask(data)
        }}
        initialTask={editing}
        defaultEvent={modalEvent}
      />
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
        message="Semua tugas, centang, dan perubahan yang kamu buat akan diganti dengan daftar template awal. Ini tidak bisa dibatalkan."
        confirmLabel="Ya, mulai ulang"
        onConfirm={() => resetToTemplates(buildInitialTasks(wedding.id, wedding.wedding_date))}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Baris tugas
// ---------------------------------------------------------------------------
type TaskRowProps = {
  item: ChecklistItem
  showEvent?: boolean
  onToggle: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function TaskRow({ item, showEvent, onToggle, onEdit, onDuplicate, onDelete }: TaskRowProps) {
  const done = item.status === 'done'
  const left = daysLeft(item)
  const itemStatus = item.item_status ? ITEM_STATUS[item.item_status] : null
  const event = item.event ? CHECKLIST_EVENTS[item.event as ChecklistEventKey] : null

  const meta: React.ReactNode[] = []
  if (item.assignee)
    meta.push(
      <span key="pic" className="inline-flex items-center gap-1">
        <UserRound className="size-3.5" aria-hidden />
        {item.assignee}
      </span>,
    )
  if (item.quantity)
    meta.push(
      <span key="qty" className="inline-flex items-center gap-1">
        <ShoppingBag className="size-3.5" aria-hidden />
        {item.quantity} {item.unit || 'item'}
      </span>,
    )
  if (item.estimated_cost != null || item.actual_cost != null)
    meta.push(
      <span key="cost" className="tabular">
        {item.actual_cost != null ? `Bayar ${formatRupiah(item.actual_cost)}` : `± ${formatRupiah(item.estimated_cost ?? 0)}`}
      </span>,
    )
  if (item.product_url)
    meta.push(
      <a
        key="url"
        href={item.product_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
      >
        <ExternalLink className="size-3.5" aria-hidden />
        {item.vendor_store_name || 'Lihat produk'}
      </a>,
    )
  else if (item.vendor_store_name) meta.push(<span key="store">{item.vendor_store_name}</span>)

  return (
    <div className={cn('flex items-start gap-2 rounded-xl border bg-surface p-2 pr-1 sm:gap-3 sm:p-3', done ? 'border-border/70' : 'border-border shadow-card')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`${done ? 'Batalkan centang' : 'Centang'}: ${item.title}`}
        onClick={onToggle}
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg"
      >
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-md border-2 transition-colors',
            done ? 'border-success bg-success text-white' : 'border-border-strong bg-surface hover:border-primary',
          )}
        >
          {done && <Check className="size-4" strokeWidth={3} aria-hidden />}
        </span>
      </button>

      <div className="min-w-0 flex-1 py-1.5">
        <button
          type="button"
          onClick={onEdit}
          className={cn('cursor-pointer text-left font-medium leading-snug hover:underline', done ? 'text-ink-muted line-through' : 'text-ink')}
        >
          {item.title}
        </button>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {showEvent && event && <Badge>{event.shortTitle}</Badge>}
          {!done && left != null && (
            <Badge tone={left < 0 ? 'danger' : left <= 7 ? 'warning' : 'neutral'}>
              <CalendarDays className="size-3" aria-hidden />
              {left < 0 || left <= SOON_DAYS ? relativeDueLabel(item.due_date!) : formatDateShort(item.due_date)}
            </Badge>
          )}
          {!done && item.priority === 'high' && <Badge tone="danger">Penting</Badge>}
          {!done && item.status === 'in_progress' && <Badge tone="primary">Sedang dikerjakan</Badge>}
          {itemStatus && <Badge tone={itemStatus.tone}>{itemStatus.label}</Badge>}
          {item.notes?.includes('[Kondisional]') && <Badge tone="warning">Jika diperlukan KUA</Badge>}
        </div>

        {meta.length > 0 && <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">{meta}</div>}
        {item.notes && !done && <p className="mt-1.5 line-clamp-2 text-sm text-ink-subtle">{item.notes.replace('[Kondisional]', '').trim()}</p>}
      </div>

      <div className="flex shrink-0 flex-col sm:flex-row">
        <IconButton label={`Ubah ${item.title}`} onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
        </IconButton>
        <IconButton label={`Duplikat ${item.title}`} onClick={onDuplicate} className="hidden sm:inline-flex">
          <Copy className="size-4" aria-hidden />
        </IconButton>
        <IconButton label={`Hapus ${item.title}`} tone="danger" onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden />
        </IconButton>
      </div>
    </div>
  )
}
