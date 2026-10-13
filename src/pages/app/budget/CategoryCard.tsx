import { useId, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, Check, ChevronDown, ExternalLink, Pencil, StickyNote, Store, Trash2 } from 'lucide-react'
import { Badge, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/PageKit'
import { AnimatePresence, m, EASE_OUT } from '@/components/motion'
import { cn } from '@/lib/cn'
import { formatDateShort, formatRupiah } from '@/lib/format'
import type { CategorySummary } from '@/lib/finance'
import type { BudgetCategory, Expense } from '@/lib/database.types'
import type { CategoryInput, ExpenseInput } from '@/hooks/usePlanningData'
import { ItemForm } from './ItemForm'
import { CategoryForm } from './CategoryForm'
import { linkLabel } from './links'

export type VendorLine = { id: string; name: string; contract: number; paid: number; outstanding: number }

type CategoryCardProps = {
  category: BudgetCategory
  summary: CategorySummary | undefined
  items: Expense[]
  vendors: VendorLine[]
  open: boolean
  /** Pos baru dibuat: langsung fokus ke kolom tambah item. */
  focusAddItem?: boolean
  onToggle: () => void
  onAddItem: (input: ExpenseInput) => Promise<void>
  onUpdateItem: (id: string, input: Partial<ExpenseInput>) => Promise<void>
  onAskDeleteItem: (item: Expense) => void
  onUpdateCategory: (input: CategoryInput) => Promise<void>
  onAskDeleteCategory: () => void
}

function share(part: number, whole: number) {
  return whole > 0 ? Math.min(1, Math.max(0, part / whole)) : part > 0 ? 1 : 0
}

export function CategoryCard({
  category,
  summary,
  items,
  vendors,
  open,
  focusAddItem,
  onToggle,
  onAddItem,
  onUpdateItem,
  onAskDeleteItem,
  onUpdateCategory,
  onAskDeleteCategory,
}: CategoryCardProps) {
  const [editingPos, setEditingPos] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const bodyId = useId()

  const planned = category.planned_amount
  const paid = summary?.actual ?? 0
  const committed = summary?.committed ?? 0
  const pending = committed - paid
  const left = planned - committed
  const over = left < 0
  const usedUp = !over && planned > 0 && left === 0
  const nearlyOut = !over && !usedUp && planned > 0 && committed / planned >= 0.9
  const itemCount = items.length + vendors.length

  return (
    <Card id={`pos-${category.id}`} className={cn('scroll-mt-24 overflow-hidden transition-shadow', open && 'ring-1 ring-primary/15')}>
      {/* Kepala pos: satu tombol besar untuk membuka rincian (pola accordion: h3 > button, isi hanya phrasing) */}
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="block w-full cursor-pointer p-4 text-left transition-colors hover:bg-surface-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:p-5"
        >
          <span className="flex items-start gap-3">
            <span className="block min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-lg font-semibold text-ink">{category.name}</span>
                {category.is_reserve && <Badge tone="gold">Dana cadangan</Badge>}
                {over && (
                  <Badge tone="danger">
                    <AlertTriangle className="size-3" aria-hidden />
                    Melebihi jatah
                  </Badge>
                )}
                {nearlyOut && <Badge tone="warning">Hampir habis</Badge>}
                {usedUp && <Badge tone="warning">Jatah habis</Badge>}
              </span>
              <span className="mt-0.5 block text-sm font-normal text-ink-muted">
                Jatah <span className="tabular">{formatRupiah(planned)}</span> · {itemCount === 0 ? 'belum ada rincian' : `${itemCount} rincian`}
              </span>
            </span>
            <span className="block shrink-0 text-right">
              <span className="block text-xs font-normal text-ink-muted">{over ? 'Lebih' : 'Sisa'}</span>
              <span className={cn('block font-display text-xl font-bold tabular sm:text-2xl', over ? 'text-danger' : 'text-ink')}>
                {formatRupiah(Math.abs(left))}
              </span>
            </span>
            <ChevronDown
              className={cn('mt-3 size-5 shrink-0 text-ink-subtle transition-transform duration-200', open && 'rotate-180')}
              aria-hidden
            />
          </span>

          {/* Bar dekoratif; angkanya dibacakan dari teks di bawahnya. */}
          <span aria-hidden className="relative mt-3 block h-2 overflow-hidden rounded-full bg-surface-muted">
            <span
              className={cn('absolute inset-y-0 left-0 w-full origin-left rounded-full transition-transform duration-500', over ? 'bg-danger/35' : 'bg-gold')}
              style={{ transform: `scaleX(${share(committed, planned)})` }}
            />
            <span
              className={cn('absolute inset-y-0 left-0 w-full origin-left rounded-full transition-transform duration-500', over ? 'bg-danger' : 'bg-primary')}
              style={{ transform: `scaleX(${share(paid, planned)})` }}
            />
          </span>
          <span className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs font-normal text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" aria-hidden />
              Sudah dibayar <strong className="font-semibold text-ink tabular">{formatRupiah(paid)}</strong>
            </span>
            {pending > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-gold" aria-hidden />
                Belum dibayar <strong className="font-semibold text-ink tabular">{formatRupiah(pending)}</strong>
              </span>
            )}
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={bodyId}
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.18 } }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
              {editingPos ? (
                <div className="py-2">
                  <CategoryForm
                    initial={category}
                    onSubmit={async (input) => {
                      await onUpdateCategory(input)
                      setEditingPos(false)
                    }}
                    onCancel={() => setEditingPos(false)}
                  />
                </div>
              ) : (
                <>
                  {category.notes && (
                    <p className="mb-2 flex items-start gap-2 rounded-lg bg-surface-muted/60 px-3 py-2 text-sm text-ink-muted">
                      <StickyNote className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span className="whitespace-pre-line">{category.notes}</span>
                    </p>
                  )}

                  {itemCount > 0 ? (
                    <ul className="divide-y divide-border" aria-label={`Rincian ${category.name}`}>
                      {items.map((item) =>
                        editingItem === item.id ? (
                          <li key={item.id} className="py-3">
                            <ItemForm
                              initial={item}
                              remainingBefore={left + (item.status === 'cancelled' ? 0 : item.amount)}
                              onSubmit={async (input) => {
                                await onUpdateItem(item.id, input)
                                setEditingItem(null)
                              }}
                              onCancel={() => setEditingItem(null)}
                              autoFocus
                            />
                          </li>
                        ) : (
                          <ItemRow
                            key={item.id}
                            item={item}
                            onTogglePaid={() => void onUpdateItem(item.id, { status: item.status === 'paid' ? 'planned' : 'paid' })}
                            onEdit={() => setEditingItem(item.id)}
                            onDelete={() => onAskDeleteItem(item)}
                          />
                        ),
                      )}
                      {vendors.map((v) => (
                        <VendorRow key={v.id} vendor={v} />
                      ))}
                    </ul>
                  ) : (
                    <p className="py-2 text-sm text-ink-muted">
                      Belum ada rincian. Tulis apa saja yang mau dibeli atau dibayar dari pos ini, lengkap dengan link tokonya.
                    </p>
                  )}

                  <div className="mt-3">
                    <ItemForm remainingBefore={left} onSubmit={onAddItem} autoFocus={focusAddItem} />
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-1 border-t border-border pt-3">
                    <Button variant="ghost" size="sm" onClick={() => setEditingPos(true)} icon={<Pencil className="size-4" aria-hidden />}>
                      Ubah pos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onAskDeleteCategory}
                      icon={<Trash2 className="size-4" aria-hidden />}
                      className="hover:bg-danger-soft hover:text-danger"
                    >
                      Hapus pos
                    </Button>
                  </div>
                </>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function ItemRow({ item, onTogglePaid, onEdit, onDelete }: { item: Expense; onTogglePaid: () => void; onEdit: () => void; onDelete: () => void }) {
  const isPaid = item.status === 'paid'
  const cancelled = item.status === 'cancelled'
  return (
    <li className="flex items-start gap-2 py-3 sm:gap-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={isPaid}
        aria-label={`${item.title} sudah dibayar`}
        onClick={onTogglePaid}
        disabled={cancelled}
        className="-ml-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors hover:bg-surface-muted disabled:cursor-not-allowed"
      >
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full border-2 transition-colors',
            isPaid ? 'border-success bg-success text-white' : 'border-border-strong bg-surface',
          )}
        >
          {isPaid && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
        </span>
      </button>

      <div className="min-w-0 flex-1 pt-2.5">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <p className={cn('min-w-0 break-words font-medium', isPaid || cancelled ? 'text-ink-muted' : 'text-ink', cancelled && 'line-through')}>
            {item.title}
          </p>
          <p className={cn('shrink-0 font-semibold tabular', isPaid ? 'text-ink-muted' : 'text-ink')}>
            {item.amount > 0 ? formatRupiah(item.amount) : <span className="text-sm font-normal text-ink-subtle">Harga belum diisi</span>}
          </p>
        </div>
        {item.notes && <p className="mt-0.5 whitespace-pre-line text-sm text-ink-muted">{item.notes}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {isPaid && (
            <span className="inline-flex items-center gap-1 text-success">
              <Check className="size-3.5" aria-hidden />
              Sudah dibayar{item.expense_date && ` · ${formatDateShort(item.expense_date)}`}
            </span>
          )}
          {cancelled && <Badge>Batal</Badge>}
          {item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 items-center gap-1 rounded-lg font-semibold text-primary underline-offset-2 hover:underline"
            >
              Buka di {linkLabel(item.link_url)}
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(tab baru)</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex shrink-0 pt-0.5">
        <IconButton label={`Ubah ${item.title}`} onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
        </IconButton>
        <IconButton label={`Hapus ${item.title}`} tone="danger" onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden />
        </IconButton>
      </div>
    </li>
  )
}

function VendorRow({ vendor }: { vendor: VendorLine }) {
  const done = vendor.outstanding === 0 && vendor.paid > 0
  return (
    <li className="flex items-start gap-2 py-3 sm:gap-3">
      <span className="-ml-2 flex size-11 shrink-0 items-center justify-center text-ink-subtle" aria-hidden>
        <Store className="size-5" />
      </span>
      <div className="min-w-0 flex-1 pt-2.5">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <p className="min-w-0 break-words font-medium text-ink">
            <span className="mr-1.5 rounded-md bg-surface-muted px-1.5 py-0.5 text-xs font-semibold text-ink-muted">Vendor</span>
            {vendor.name}
          </p>
          <p className="shrink-0 font-semibold text-ink tabular">{formatRupiah(vendor.contract || vendor.paid + vendor.outstanding)}</p>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span className={cn(done && 'text-success')}>
            {done ? 'Lunas' : `${formatRupiah(vendor.paid)} sudah dibayar · sisa ${formatRupiah(vendor.outstanding)}`}
          </span>
          <Link to="/app/vendors" className="inline-flex min-h-8 items-center font-semibold text-primary underline-offset-2 hover:underline">
            Atur di halaman Vendor
          </Link>
        </p>
      </div>
      <span className="hidden w-20 shrink-0 sm:block" aria-hidden />
    </li>
  )
}
