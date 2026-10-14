import { useId, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, Check, ChevronDown, ExternalLink, ImageIcon, ImagePlus, Link2, Loader2, Pencil, Plus, ShoppingBag, StickyNote, Store, Trash2 } from 'lucide-react'
import { Badge, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AnimatePresence, m, EASE_OUT } from '@/components/motion'
import { PremiumBadge, premiumHref } from '@/components/premium/Premium'
import { usePremium } from '@/hooks/usePremium'
import { cn } from '@/lib/cn'
import { formatDateShort, formatRupiah, formatRupiahShort } from '@/lib/format'
import type { CategorySummary } from '@/lib/finance'
import type { BudgetCategory, Expense } from '@/lib/database.types'
import type { CategoryInput, ExpenseInput } from '@/hooks/usePlanningData'
import { ItemForm } from './ItemForm'
import { CategoryForm } from './CategoryForm'
import { linkPreview } from './links'
import { PhotoImg, PhotoLightbox, usePhotoUrl } from './ItemPhoto'

export type VendorLine = { id: string; name: string; contract: number; paid: number; outstanding: number }

type CategoryCardProps = {
  category: BudgetCategory
  summary: CategorySummary | undefined
  items: Expense[]
  vendors: VendorLine[]
  open: boolean
  /** Pos baru dibuat: langsung buka form tambah item. */
  focusAddItem?: boolean
  onToggle: () => void
  onAddItem: (input: ExpenseInput) => Promise<void>
  onUpdateItem: (id: string, input: Partial<ExpenseInput>) => Promise<void>
  onAskDeleteItem: (item: Expense) => void
  onUpdateCategory: (input: CategoryInput) => Promise<void>
  onAskDeleteCategory: () => void
  uploadPhoto: (file: File) => Promise<string>
  removePhoto: (path: string | null | undefined) => Promise<void>
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
  uploadPhoto,
  removePhoto,
}: CategoryCardProps) {
  const [editingPos, setEditingPos] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [addingItem, setAddingItem] = useState(Boolean(focusAddItem))
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

  /** Simpan perubahan item; foto lama dihapus dari storage bila diganti/dihapus. */
  async function saveItem(item: Expense, input: Partial<ExpenseInput>) {
    await onUpdateItem(item.id, input)
    if (input.proof_path !== undefined && input.proof_path !== item.proof_path) void removePhoto(item.proof_path)
  }

  return (
    <Card id={`pos-${category.id}`} className={cn('scroll-mt-24 overflow-hidden transition-shadow', open && 'ring-1 ring-primary/15')}>
      {/* Kepala pos: satu tombol untuk membuka rincian (pola accordion: h3 > button, isi hanya phrasing) */}
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="block w-full cursor-pointer px-4 py-3.5 text-left transition-colors hover:bg-surface-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:p-5"
        >
          <span className="flex items-center gap-2">
            <span className="block min-w-0 flex-1 truncate font-semibold text-ink sm:text-lg">{category.name}</span>
            <ChevronDown className={cn('size-5 shrink-0 text-ink-subtle transition-transform duration-200', open && 'rotate-180')} aria-hidden />
          </span>
          <span className="mt-0.5 flex items-end justify-between gap-3">
            <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-normal text-ink-muted sm:text-sm">
              {category.is_reserve && <Badge tone="gold">Cadangan</Badge>}
              {over && (
                <Badge tone="danger">
                  <AlertTriangle className="size-3" aria-hidden />
                  Lebih
                </Badge>
              )}
              {nearlyOut && <Badge tone="warning">Hampir habis</Badge>}
              {usedUp && <Badge tone="warning">Habis</Badge>}
              <span>
                {itemCount === 0 ? 'Belum ada item' : `${itemCount} item`} · jatah{' '}
                <span className="tabular sm:hidden">{formatRupiahShort(planned)}</span>
                <span className="hidden tabular sm:inline">{formatRupiah(planned)}</span>
              </span>
            </span>
            <span className="block shrink-0 text-right leading-tight">
              <span className="mr-1.5 text-xs font-normal text-ink-subtle">{over ? 'lebih' : 'sisa'}</span>
              <span className={cn('font-num text-lg font-semibold sm:text-2xl', over ? 'text-danger' : 'text-ink')}>{formatRupiah(Math.abs(left))}</span>
            </span>
          </span>

          {/* Bar dekoratif; angkanya dibacakan dari teks di dalam rincian. */}
          <span aria-hidden className="relative mt-2.5 block h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <span
              className={cn('absolute inset-y-0 left-0 w-full origin-left rounded-full transition-transform duration-500', over ? 'bg-danger/35' : 'bg-gold')}
              style={{ transform: `scaleX(${share(committed, planned)})` }}
            />
            <span
              className={cn('absolute inset-y-0 left-0 w-full origin-left rounded-full transition-transform duration-500', over ? 'bg-danger' : 'bg-primary')}
              style={{ transform: `scaleX(${share(paid, planned)})` }}
            />
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
            <div className="border-t border-border px-4 pb-3 pt-2.5 sm:px-5 sm:pb-4">
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
                  <p className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-primary" aria-hidden />
                      Dibayar <strong className="font-semibold text-ink tabular">{formatRupiah(paid)}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-gold" aria-hidden />
                      Belum dibayar <strong className="font-semibold text-ink tabular">{formatRupiah(pending)}</strong>
                    </span>
                  </p>

                  {category.notes && (
                    <p className="mt-2 flex items-start gap-2 rounded-lg bg-surface-muted/60 px-3 py-2 text-sm text-ink-muted">
                      <StickyNote className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span className="whitespace-pre-line">{category.notes}</span>
                    </p>
                  )}

                  {itemCount > 0 && (
                    <ul className="mt-1 divide-y divide-border" aria-label={`Rincian ${category.name}`}>
                      {items.map((item) =>
                        editingItem === item.id ? (
                          <li key={item.id} className="py-2">
                            <ItemForm
                              initial={item}
                              remainingBefore={left + (item.status === 'cancelled' ? 0 : item.amount)}
                              uploadPhoto={uploadPhoto}
                              onSubmit={async (input) => {
                                await saveItem(item, input)
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
                            expanded={expandedItem === item.id}
                            onToggleExpand={() => setExpandedItem((cur) => (cur === item.id ? null : item.id))}
                            onTogglePaid={() => void onUpdateItem(item.id, { status: item.status === 'paid' ? 'planned' : 'paid' })}
                            onEdit={() => setEditingItem(item.id)}
                            onDelete={() => onAskDeleteItem(item)}
                            onAddPhoto={async (file) => saveItem(item, { proof_path: await uploadPhoto(file) })}
                          />
                        ),
                      )}
                      {vendors.map((v) => (
                        <VendorRow key={v.id} vendor={v} />
                      ))}
                    </ul>
                  )}

                  <div className="mt-2">
                    {addingItem ? (
                      <ItemForm remainingBefore={left} uploadPhoto={uploadPhoto} onSubmit={onAddItem} onCancel={() => setAddingItem(false)} autoFocus />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingItem(true)}
                        className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-soft/50"
                      >
                        <Plus className="size-4" aria-hidden />
                        {itemCount === 0 ? 'Tambah item pertama' : 'Tambah item'}
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingPos(true)} icon={<Pencil className="size-3.5" aria-hidden />}>
                      Ubah pos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onAskDeleteCategory}
                      icon={<Trash2 className="size-3.5" aria-hidden />}
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

type ItemRowProps = {
  item: Expense
  expanded: boolean
  onToggleExpand: () => void
  onTogglePaid: () => void
  onEdit: () => void
  onDelete: () => void
  onAddPhoto: (file: File) => Promise<void>
}

/** Baris ringkas: centang · foto kecil · nama + harga. Ketuk untuk melihat foto, link, catatan, dan aksi. */
function ItemRow({ item, expanded, onToggleExpand, onTogglePaid, onEdit, onDelete, onAddPhoto }: ItemRowProps) {
  const isPaid = item.status === 'paid'
  const cancelled = item.status === 'cancelled'
  const photoUrl = usePhotoUrl(item.proof_path)
  const [lightbox, setLightbox] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const { isPremium } = usePremium()
  const detailId = useId()
  const preview = item.link_url ? linkPreview(item.link_url) : null

  return (
    <li>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={isPaid}
          aria-label={`${item.title} sudah dibayar`}
          onClick={onTogglePaid}
          disabled={cancelled}
          className="-ml-2.5 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors hover:bg-surface-muted disabled:cursor-not-allowed"
        >
          <span
            className={cn(
              'flex size-[1.375rem] items-center justify-center rounded-full border-2 transition-colors',
              isPaid ? 'border-success bg-success text-white' : 'border-border-strong bg-surface',
            )}
          >
            {isPaid && <Check className="size-3" strokeWidth={3.5} aria-hidden />}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-controls={detailId}
          className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg py-2 text-left"
        >
          {item.proof_path && <PhotoImg src={photoUrl} alt="" className="size-10 shrink-0 rounded-lg" />}
          <span className="block min-w-0 flex-1">
            <span className={cn('block truncate text-[0.95rem] font-medium', isPaid || cancelled ? 'text-ink-muted' : 'text-ink', cancelled && 'line-through')}>
              {item.title}
            </span>
            <span className="flex items-center gap-2 text-xs text-ink-subtle">
              {isPaid ? (
                <span className="text-success">Lunas{item.expense_date && ` · ${formatDateShort(item.expense_date)}`}</span>
              ) : cancelled ? (
                <span>Batal</span>
              ) : (
                <span>Rencana</span>
              )}
              {item.link_url && <Link2 className="size-3.5" aria-label="ada link toko" />}
              {item.notes && <StickyNote className="size-3.5" aria-label="ada catatan" />}
              {item.proof_path && !photoUrl && <ImageIcon className="size-3.5" aria-label="ada foto" />}
            </span>
          </span>
          <span className={cn('shrink-0 text-right text-[0.95rem] font-semibold tabular', isPaid ? 'text-ink-muted' : 'text-ink')}>
            {item.amount > 0 ? formatRupiah(item.amount) : <span className="text-xs font-normal text-ink-subtle">Harga?</span>}
          </span>
          <ChevronDown className={cn('size-4 shrink-0 text-ink-subtle transition-transform', expanded && 'rotate-180')} aria-hidden />
        </button>
      </div>

      {expanded && (
        <div id={detailId} className="animate-fade-up space-y-2.5 pb-3 pl-8 sm:pl-9">
          {item.proof_path && (
            <button
              type="button"
              onClick={() => photoUrl && setLightbox(true)}
              className="block w-full cursor-zoom-in overflow-hidden rounded-xl sm:max-w-xs"
              aria-label={`Perbesar foto ${item.title}`}
            >
              <PhotoImg src={photoUrl} alt={`Foto ${item.title}`} className="aspect-[16/10] w-full rounded-xl" />
            </button>
          )}

          {preview && item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 pr-3 transition-colors hover:border-primary/40 hover:bg-primary-soft/30 sm:max-w-md"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold-text">
                <ShoppingBag className="size-5" aria-hidden />
              </span>
              <span className="block min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {preview.title ? (preview.isSearch ? `Cari “${preview.title}”` : preview.title) : `Lihat produk di ${preview.store}`}
                </span>
                <span className="block truncate text-xs text-ink-muted">
                  {preview.store}
                  {preview.shop && ` · ${preview.shop}`}
                </span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-ink-subtle group-hover:text-primary" aria-hidden />
              <span className="sr-only">(buka di tab baru)</span>
            </a>
          )}

          {item.notes && <p className="whitespace-pre-line text-sm text-ink-muted">{item.notes}</p>}

          {photoError && (
            <p role="alert" className="text-sm text-danger">
              {photoError}
            </p>
          )}

          <div className="-ml-2.5 flex flex-wrap">
            {!item.proof_path && !isPremium && (
              <Link
                to={premiumHref('foto')}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-gold-soft/50"
              >
                <ImagePlus className="size-3.5" aria-hidden />
                Tambah foto
                <PremiumBadge />
              </Link>
            )}
            {!item.proof_path && isPremium && (
              <label
                className={cn(
                  'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft focus-within:ring-2 focus-within:ring-primary/30',
                  uploading && 'pointer-events-none opacity-60',
                )}
              >
                {uploading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ImagePlus className="size-3.5" aria-hidden />}
                {uploading ? 'Mengunggah…' : 'Tambah foto'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    setUploading(true)
                    setPhotoError(null)
                    try {
                      await onAddPhoto(file)
                    } catch (err) {
                      setPhotoError(err instanceof Error && err.message.startsWith('Ukuran') ? err.message : 'Foto gagal diunggah. Coba lagi.')
                    } finally {
                      setUploading(false)
                    }
                  }}
                />
              </label>
            )}
            <Button variant="ghost" size="sm" onClick={onEdit} icon={<Pencil className="size-3.5" aria-hidden />} className="px-2.5!">
              Ubah
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} icon={<Trash2 className="size-3.5" aria-hidden />} className="px-2.5! hover:bg-danger-soft hover:text-danger">
              Hapus
            </Button>
          </div>
        </div>
      )}

      {lightbox && photoUrl && <PhotoLightbox src={photoUrl} alt={`Foto ${item.title}`} onClose={() => setLightbox(false)} />}
    </li>
  )
}

function VendorRow({ vendor }: { vendor: VendorLine }) {
  const done = vendor.outstanding === 0 && vendor.paid > 0
  return (
    <li className="flex items-center gap-1.5 py-2 sm:gap-2">
      <span className="-ml-2.5 flex size-11 shrink-0 items-center justify-center text-ink-subtle" aria-hidden>
        <Store className="size-[1.125rem]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.95rem] font-medium text-ink">{vendor.name}</p>
        <p className="text-xs text-ink-subtle">
          <span className={cn(done && 'text-success')}>{done ? 'Vendor · lunas' : `Vendor · sisa ${formatRupiah(vendor.outstanding)}`}</span>
          {' · '}
          <Link to="/app/vendors" className="font-semibold text-primary underline-offset-2 hover:underline">
            Atur
          </Link>
        </p>
      </div>
      <p className="shrink-0 pr-6 text-[0.95rem] font-semibold text-ink tabular">{formatRupiah(vendor.contract || vendor.paid + vendor.outstanding)}</p>
    </li>
  )
}
