import { useState } from 'react'
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Copy,
  Edit3,
  ExternalLink,
  Layers,
  ListChecks,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  User,
} from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useChecklistData } from '@/hooks/usePlanningData'
import { Card, Badge, ProgressBar } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { formatDate, formatRupiah, relativeDueLabel } from '@/lib/format'
import {
  CHECKLIST_EVENTS,
  type ChecklistEventKey,
  type ChecklistItem,
} from '@/lib/checklistTypes'
import {
  buildInitialTasks,
  calculateEventSummary,
  calculateOverallSummary,
  groupTasksByCategory,
} from '@/lib/checklistTemplates'
import { TaskModal } from './checklist/TaskModal'
import { DeleteConfirmModal } from './checklist/DeleteConfirmModal'
import { AdatSettingsModal } from './checklist/AdatSettingsModal'
import type { TaskPriority } from '@/lib/database.types'

const PRIORITY_BADGES: Record<TaskPriority, { label: string; tone: 'danger' | 'warning' | 'neutral' }> = {
  high: { label: 'Prioritas Tinggi', tone: 'danger' },
  medium: { label: 'Sedang', tone: 'warning' },
  low: { label: 'Rendah', tone: 'neutral' },
}

const ITEM_STATUS_LABELS: Record<string, { label: string; tone: 'success' | 'gold' | 'primary' | 'neutral' | 'danger' }> = {
  belum_dicari: { label: 'Belum Dicari', tone: 'neutral' },
  sudah_dipilih: { label: 'Sudah Dipilih', tone: 'primary' },
  sudah_dipesan: { label: 'Sudah Dipesan', tone: 'gold' },
  sudah_dibeli: { label: 'Sudah Dibeli', tone: 'success' },
  siap: { label: 'Siap', tone: 'success' },
  perlu_revisi: { label: 'Perlu Revisi', tone: 'danger' },
}

export function ChecklistPage() {
  const wedding = useWedding()
  const {
    state,
    reload,
    toggleTask,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    resetToTemplates,
  } = useChecklistData(wedding.id, wedding.wedding_date)

  // View state: 'categories' (hierarchical) vs 'list' (flat quick list)
  const [viewMode, setViewMode] = useState<'categories' | 'list'>('categories')
  const [activeEventTab, setActiveEventTab] = useState<ChecklistEventKey>('pernikahan')

  // Filters for list view
  const [filterEvent, setFilterEvent] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'done'>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Collapsed categories state in category view
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ChecklistItem | null>(null)
  const [taskModalDefaultEvent, setTaskModalDefaultEvent] = useState<ChecklistEventKey>('pernikahan')

  const [deletingTask, setDeletingTask] = useState<ChecklistItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isAdatModalOpen, setIsAdatModalOpen] = useState(false)
  const [enabledTraditions, setEnabledTraditions] = useState<string[]>([
    'slametan',
    'pengajian',
    'siraman',
    'panggih',
  ])

  // Reset confirmation state
  const [isResetConfirming, setIsResetConfirming] = useState(false)

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <header>
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-2 h-5 w-96" />
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat checklist persiapan pernikahan." onRetry={() => void reload()} />
  }

  const tasks = state.data

  // Summaries
  const overall = calculateOverallSummary(tasks)
  const eventSummaries = calculateEventSummary(tasks)

  // Category view groups for active tab
  const categoryGroups = groupTasksByCategory(tasks, activeEventTab)

  // Flat list filtered tasks
  const filteredListTasks = tasks.filter((t) => {
    if (t.is_archived) return false
    if (filterEvent !== 'all' && t.event !== filterEvent) return false
    if (filterStatus === 'pending' && t.status === 'done') return false
    if (filterStatus === 'in_progress' && t.status !== 'in_progress') return false
    if (filterStatus === 'done' && t.status !== 'done') return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const title = t.title.toLowerCase()
      const cat = (t.category || '').toLowerCase()
      const sub = (t.subcategory || '').toLowerCase()
      const store = (t.vendor_store_name || '').toLowerCase()
      const notes = (t.notes || '').toLowerCase()
      const pic = (t.assignee || '').toLowerCase()
      return title.includes(q) || cat.includes(q) || sub.includes(q) || store.includes(q) || notes.includes(q) || pic.includes(q)
    }
    return true
  })

  function toggleCategoryCollapse(catName: string) {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }))
  }

  function handleOpenCreateModal(evKey: ChecklistEventKey = activeEventTab) {
    setEditingTask(null)
    setTaskModalDefaultEvent(evKey)
    setIsTaskModalOpen(true)
  }

  function handleOpenEditModal(task: ChecklistItem) {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingTask) return
    setIsDeleting(true)
    try {
      await deleteTask(deletingTask.id)
      setDeletingTask(null)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleResetTemplate() {
    setIsResetConfirming(false)
    const freshTasks = buildInitialTasks(wedding.id, wedding.wedding_date)
    await resetToTemplates(freshTasks)
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[2.4rem] font-semibold leading-tight sm:text-5xl">
            Checklist Persiapan Pernikahan
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Pusat pengelolaan seluruh persiapan: lamaran, pernikahan, acara adat, berkas KUA, anggaran belanja, hingga hari H.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdatModalOpen(true)}
            icon={<Compass className="size-4" />}
          >
            Pengaturan Adat
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenCreateModal(activeEventTab)}
            icon={<Plus className="size-4" />}
          >
            Tambah Tugas
          </Button>
        </div>
      </header>

      {/* OVERALL PROGRESS & METRICS */}
      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Progres Keseluruhan</span>
            <p className="mt-1 font-display text-2xl font-bold text-ink">
              {overall.doneCount} dari {overall.totalCount} tugas selesai ({overall.completionPercent}%)
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {overall.overdueCount > 0 && (
              <Badge tone="danger">
                {overall.overdueCount} Tugas Terlambat
              </Badge>
            )}
            <Badge tone="primary">{overall.pendingCount} Tugas Tersisa</Badge>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={overall.completionPercent} label="Progres Keseluruhan" tone="primary" />
        </div>

        {/* Financial Mini-Summary from Checklist */}
        {(overall.totalEstimatedCost > 0 || overall.totalActualCost > 0) && (
          <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl bg-surface-muted/50 p-3">
              <span className="text-ink-muted">Total Estimasi Checklist:</span>
              <p className="font-display text-sm font-bold text-ink mt-0.5 tabular">
                {formatRupiah(overall.totalEstimatedCost)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted/50 p-3">
              <span className="text-ink-muted">Realisasi Biaya Aktual:</span>
              <p className="font-display text-sm font-bold text-success mt-0.5 tabular">
                {formatRupiah(overall.totalActualCost)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted/50 p-3">
              <span className="text-ink-muted">
                {overall.costVariance >= 0 ? 'Selisih Hemat Estimasi:' : 'Selisih Melebihi Estimasi:'}
              </span>
              <p
                className={`font-display text-sm font-bold mt-0.5 tabular ${
                  overall.costVariance >= 0 ? 'text-primary' : 'text-danger'
                }`}
              >
                {formatRupiah(Math.abs(overall.costVariance))}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* 5 EVENT PROGRESS CARDS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(Object.keys(CHECKLIST_EVENTS) as ChecklistEventKey[]).map((evKey) => {
          const cfg = CHECKLIST_EVENTS[evKey]
          const sum = eventSummaries[evKey]
          const isActive = viewMode === 'categories' && activeEventTab === evKey

          return (
            <div
              key={evKey}
              onClick={() => {
                setActiveEventTab(evKey)
                setViewMode('categories')
              }}
              className={`flex flex-col justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                isActive
                  ? 'border-primary bg-primary-soft/30 shadow-card'
                  : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-muted/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink truncate">{cfg.shortTitle}</span>
                  <Badge tone={cfg.badgeTone} className="text-[0.65rem]">
                    {sum.completionPercent}%
                  </Badge>
                </div>
                <p className="mt-2 font-display text-lg font-bold text-ink">
                  {sum.doneCount}/{sum.totalCount}
                </p>
                <p className="text-[0.7rem] text-ink-muted truncate">{cfg.description}</p>
              </div>

              <div className="mt-3">
                <ProgressBar value={sum.completionPercent} label={cfg.shortTitle} tone="primary" />
              </div>
            </div>
          )
        })}
      </div>

      {/* VIEW SWITCHER & SEARCH BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        {/* Switcher */}
        <div className="flex rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setViewMode('categories')}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'categories' ? 'bg-primary text-on-primary' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Layers className="size-3.5" />
            Tampilan Kategori
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ListChecks className="size-3.5" />
            Daftar Cepat ({filteredListTasks.length})
          </button>
        </div>

        {/* Action reset to templates */}
        <div className="flex items-center gap-2">
          {!isResetConfirming ? (
            <button
              type="button"
              onClick={() => setIsResetConfirming(true)}
              className="text-xs text-ink-subtle hover:text-ink flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset checklist ke template awal lengkap Indonesia"
            >
              <RotateCcw className="size-3.5" />
              <span>Pulihkan Template</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-2.5 py-1 text-xs">
              <span className="text-danger font-medium">Reset semua tugas?</span>
              <button
                type="button"
                onClick={() => void handleResetTemplate()}
                className="font-bold text-danger hover:underline cursor-pointer"
              >
                Ya
              </button>
              <button
                type="button"
                onClick={() => setIsResetConfirming(false)}
                className="text-ink-muted hover:underline cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. TAMPILAN KATEGORI & SUBKATEGORI BERJENJANG                       */}
      {/* =================================================================== */}
      {viewMode === 'categories' && (
        <div className="space-y-6">
          {/* Event Sub-Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-muted/50 p-3 rounded-2xl border border-border">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CHECKLIST_EVENTS) as ChecklistEventKey[]).map((evKey) => {
                const cfg = CHECKLIST_EVENTS[evKey]
                const count = tasks.filter((t) => !t.is_archived && t.event === evKey).length
                const isActive = activeEventTab === evKey

                return (
                  <button
                    key={evKey}
                    type="button"
                    onClick={() => setActiveEventTab(evKey)}
                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface text-ink-muted hover:text-ink'
                    }`}
                  >
                    {cfg.shortTitle} ({count})
                  </button>
                )
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenCreateModal(activeEventTab)}
              icon={<Plus className="size-3.5" />}
            >
              Tambah ke {CHECKLIST_EVENTS[activeEventTab].shortTitle}
            </Button>
          </div>

          {/* Category Groups List */}
          {categoryGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <ListChecks className="mx-auto size-10 text-ink-subtle" />
              <p className="mt-3 font-semibold text-ink">
                Belum ada kategori tugas di bagian {CHECKLIST_EVENTS[activeEventTab].title}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Gunakan tombol "Tambah ke {CHECKLIST_EVENTS[activeEventTab].shortTitle}" untuk membuat tugas baru.
              </p>
            </div>
          ) : (
            categoryGroups.map((group) => {
              const isCollapsed = Boolean(collapsedCategories[group.name])

              return (
                <Card key={group.name} className="overflow-hidden">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategoryCollapse(group.name)}
                    className="flex cursor-pointer items-center justify-between border-b border-border bg-surface-muted/30 p-4 transition-colors hover:bg-surface-muted/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-surface border border-border text-ink-muted">
                        {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-ink">{group.name}</h3>
                        <p className="text-[0.7rem] text-ink-muted">
                          {group.doneItems} dari {group.totalItems} selesai ({group.completionPercent}%)
                          {group.totalEstimated > 0 && ` · Est. ${formatRupiah(group.totalEstimated)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block w-28">
                        <ProgressBar value={group.completionPercent} label={group.name} tone="primary" />
                      </div>
                      <Badge tone={group.completionPercent === 100 ? 'success' : 'primary'} className="text-[0.65rem]">
                        {group.completionPercent}%
                      </Badge>
                    </div>
                  </div>

                  {/* Category Items Body */}
                  {!isCollapsed && (
                    <div className="p-4 sm:p-5 space-y-6">
                      {/* Subcategories */}
                      {group.subcategories.map((sub) => (
                        <div key={sub.name} className="space-y-2.5">
                          <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
                            <span className="size-1.5 rounded-full bg-primary" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                              {sub.name} ({sub.items.length})
                            </h4>
                          </div>

                          <div className="space-y-2">
                            {sub.items.map((item) => (
                              <TaskItemRow
                                key={item.id}
                                item={item}
                                onToggle={() => void toggleTask(item.id)}
                                onEdit={() => handleOpenEditModal(item)}
                                onDuplicate={() => void duplicateTask(item.id)}
                                onDelete={() => setDeletingTask(item)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Uncategorized items under category */}
                      {group.uncategorizedItems.length > 0 && (
                        <div className="space-y-2">
                          {group.subcategories.length > 0 && (
                            <h4 className="text-xs font-semibold text-ink-subtle">Lainnya</h4>
                          )}
                          {group.uncategorizedItems.map((item) => (
                            <TaskItemRow
                              key={item.id}
                              item={item}
                              onToggle={() => void toggleTask(item.id)}
                              onEdit={() => handleOpenEditModal(item)}
                              onDuplicate={() => void duplicateTask(item.id)}
                              onDelete={() => setDeletingTask(item)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. TAMPILAN DAFTAR CEPAT (QUICK TASK LIST)                          */}
      {/* =================================================================== */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40 p-3.5 rounded-2xl border border-border">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Event Filter */}
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 font-semibold text-ink focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Acara</option>
                {(Object.keys(CHECKLIST_EVENTS) as ChecklistEventKey[]).map((k) => (
                  <option key={k} value={k}>
                    {CHECKLIST_EVENTS[k].shortTitle}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 font-semibold text-ink focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Belum Selesai</option>
                <option value="in_progress">Sedang Dikerjakan</option>
                <option value="done">Selesai</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 font-semibold text-ink focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Prioritas</option>
                <option value="high">Prioritas Tinggi</option>
                <option value="medium">Prioritas Sedang</option>
                <option value="low">Prioritas Rendah</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Cari tugas, toko, PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* List Results */}
          <div className="space-y-2.5">
            {filteredListTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <ListChecks className="mx-auto size-10 text-ink-subtle" />
                <p className="mt-3 font-semibold text-ink">Tidak ada tugas yang cocok dengan filter</p>
                <p className="text-xs text-ink-muted mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter status.</p>
              </div>
            ) : (
              filteredListTasks.map((item) => (
                <TaskItemRow
                  key={item.id}
                  item={item}
                  showEventBadge
                  onToggle={() => void toggleTask(item.id)}
                  onEdit={() => handleOpenEditModal(item)}
                  onDuplicate={() => void duplicateTask(item.id)}
                  onDelete={() => setDeletingTask(item)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setEditingTask(null)
        }}
        onSave={async (taskData) => {
          if (editingTask) {
            await updateTask(editingTask.id, taskData)
          } else {
            await createTask(taskData)
          }
        }}
        initialTask={editingTask}
        defaultEvent={taskModalDefaultEvent}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingTask)}
        task={deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <AdatSettingsModal
        isOpen={isAdatModalOpen}
        onClose={() => setIsAdatModalOpen(false)}
        enabledTraditions={enabledTraditions}
        onSave={setEnabledTraditions}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// TASK ITEM ROW COMPONENT
// ---------------------------------------------------------------------------
type TaskItemRowProps = {
  item: ChecklistItem
  showEventBadge?: boolean
  onToggle: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function TaskItemRow({
  item,
  showEventBadge,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
}: TaskItemRowProps) {
  const isDone = item.status === 'done'
  const priorityConfig = PRIORITY_BADGES[item.priority] ?? PRIORITY_BADGES.medium
  const itemStatusConfig = item.item_status ? ITEM_STATUS_LABELS[item.item_status] : null
  const eventConfig = item.event ? CHECKLIST_EVENTS[item.event as ChecklistEventKey] : null

  return (
    <div
      className={`group flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4 transition-all ${
        isDone
          ? 'border-border/60 bg-surface/50 opacity-75 hover:opacity-100'
          : 'border-border bg-surface shadow-card hover:border-primary/40'
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
          isDone
            ? 'border-success bg-success text-white'
            : 'border-border-strong bg-surface hover:border-primary'
        }`}
      >
        {isDone && <Check className="size-3.5" />}
      </button>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {showEventBadge && eventConfig && (
            <Badge tone={eventConfig.badgeTone} className="text-[0.65rem]">
              {eventConfig.shortTitle}
            </Badge>
          )}

          <p
            onClick={onToggle}
            className={`font-semibold text-sm cursor-pointer transition-colors ${
              isDone ? 'line-through text-ink-muted' : 'text-ink hover:text-primary'
            }`}
          >
            {item.title}
          </p>

          <Badge tone={priorityConfig.tone} className="text-[0.65rem]">
            {priorityConfig.label}
          </Badge>

          {itemStatusConfig && (
            <Badge tone={itemStatusConfig.tone} className="text-[0.65rem]">
              {itemStatusConfig.label}
            </Badge>
          )}

          {/* Conditional Legal Doc Badge */}
          {item.notes?.includes('[Kondisional]') && (
            <Badge tone="warning" className="text-[0.65rem]">
              Kondisional / Konfirmasi KUA
            </Badge>
          )}
        </div>

        {/* Notes */}
        {item.notes && <p className="mt-1 text-xs text-ink-muted leading-relaxed">{item.notes}</p>}

        {/* Extended Metadata: Quantity, Price, Product URL, Due Date, PIC */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-subtle">
          {item.category && !showEventBadge && (
            <span className="rounded bg-surface-muted px-2 py-0.5 text-[0.7rem] font-medium text-ink-muted">
              {item.category}
              {item.subcategory && ` / ${item.subcategory}`}
            </span>
          )}

          {/* Quantity & Unit */}
          {item.quantity && (
            <span className="flex items-center gap-1 text-ink-muted font-medium">
              <ShoppingBag className="size-3.5 text-primary" />
              {item.quantity} {item.unit || 'item'}
            </span>
          )}

          {/* Product link & store */}
          {item.product_url && (
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-primary-soft/60 px-2 py-0.5 font-semibold text-primary hover:bg-primary-soft hover:underline"
              title="Buka tautan produk di tab baru"
            >
              <ExternalLink className="size-3" />
              <span>Buka Produk</span>
              {item.vendor_store_name && <span className="font-normal text-ink-subtle">({item.vendor_store_name})</span>}
            </a>
          )}

          {!item.product_url && item.vendor_store_name && (
            <span className="flex items-center gap-1 text-ink-muted">
              <Store className="size-3 text-ink-subtle" />
              {item.vendor_store_name}
            </span>
          )}

          {/* Cost: Estimated & Actual */}
          {item.estimated_cost != null && (
            <span className="tabular text-ink-muted">
              Est: <strong className="text-ink">{formatRupiah(item.estimated_cost)}</strong>
              {item.actual_cost != null && (
                <> · Aktual: <strong className="text-success">{formatRupiah(item.actual_cost)}</strong></>
              )}
            </span>
          )}

          {/* Due date */}
          {item.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-primary" />
              {formatDate(item.due_date)} ({relativeDueLabel(item.due_date)})
            </span>
          )}

          {/* PIC */}
          {item.assignee && (
            <span className="flex items-center gap-1">
              <User className="size-3.5" />
              PIC: <strong className="text-ink-muted">{item.assignee}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Row Action Buttons */}
      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onEdit}
          className="flex size-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
          title="Edit rincian tugas"
        >
          <Edit3 className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={onDuplicate}
          className="flex size-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
          title="Duplikasi tugas"
        >
          <Copy className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex size-7 items-center justify-center rounded-lg text-ink-muted hover:bg-danger-soft hover:text-danger cursor-pointer"
          title="Hapus tugas"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
