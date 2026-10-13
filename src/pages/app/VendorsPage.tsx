import { useState } from 'react'
import { ArrowRight, ChevronDown, Phone, Plus, Store, Trash2 } from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useVendorsData } from '@/hooks/usePlanningData'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ChipGroup, ConfirmDialog, HowTo, IconButton, PageHeader, SearchInput, SelectFilter, Stat, useConfirm } from '@/components/ui/PageKit'
import { formatRupiah } from '@/lib/format'
import type { WeddingVendor, WeddingVendorStatus } from '@/lib/database.types'
import { VendorModal } from './vendors/VendorModal'

/** Urutan alur kerja vendor, dari kiri ke kanan. */
const FLOW: WeddingVendorStatus[] = ['kandidat', 'dihubungi', 'dipertimbangkan', 'dipilih']

const STATUS: Record<WeddingVendorStatus, { label: string; tone: 'success' | 'gold' | 'primary' | 'neutral' | 'danger'; hint: string }> = {
  kandidat: { label: 'Kandidat', tone: 'neutral', hint: 'Baru dicatat, belum dihubungi' },
  dihubungi: { label: 'Sudah dihubungi', tone: 'primary', hint: 'Menunggu penawaran/balasan' },
  dipertimbangkan: { label: 'Dipertimbangkan', tone: 'gold', hint: 'Sedang dibandingkan/nego' },
  dipilih: { label: 'Deal', tone: 'success', hint: 'Sudah sepakat/kontrak' },
  dibatalkan: { label: 'Dibatalkan', tone: 'danger', hint: 'Tidak jadi dipakai' },
}

const NEXT_STEP: Partial<Record<WeddingVendorStatus, { to: WeddingVendorStatus; label: string }>> = {
  kandidat: { to: 'dihubungi', label: 'Tandai sudah dihubungi' },
  dihubungi: { to: 'dipertimbangkan', label: 'Masukkan ke pertimbangan' },
  dipertimbangkan: { to: 'dipilih', label: 'Jadikan deal' },
  dibatalkan: { to: 'kandidat', label: 'Aktifkan lagi' },
}

const CATEGORY_NAMES: Record<string, string> = {
  venue: 'Venue & gedung',
  katering: 'Katering',
  dekorasi: 'Dekorasi',
  foto_video: 'Foto & video',
  mua: 'MUA & busana',
  undangan: 'Undangan & souvenir',
  hiburan: 'Musik & hiburan',
  wedding_organizer: 'Wedding organizer',
  lainnya: 'Lainnya',
}

type Filter = 'all' | WeddingVendorStatus

export function VendorsPage() {
  const wedding = useWedding()
  const { state, reload, createVendor, updateVendorStatus, deleteVendor } = useVendorsData(wedding.id)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [showVendorModal, setShowVendorModal] = useState(false)
  const confirm = useConfirm<WeddingVendor>()

  if (state.status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-28 rounded-card" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-card" />
          ))}
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return <ErrorState message="Gagal memuat daftar vendor." onRetry={() => void reload()} />
  }

  const { vendors, categories } = state.data
  const count = (s: WeddingVendorStatus) => vendors.filter((v) => v.status === s).length
  const deals = vendors.filter((v) => v.status === 'dipilih')
  const totalContract = deals.reduce((sum, v) => sum + (v.contract_amount ?? v.quoted_amount ?? 0), 0)

  const q = query.trim().toLowerCase()
  const shown = vendors.filter((v) => {
    if (filter !== 'all' && v.status !== filter) return false
    if (!q) return true
    return [v.custom_name, v.service_scope, v.notes, v.vendor_category && CATEGORY_NAMES[v.vendor_category]].some((f) => (f ?? '').toLowerCase().includes(q))
  })

  const filterOptions = [
    { value: 'all' as Filter, label: 'Semua', count: vendors.length },
    ...FLOW.map((s) => ({ value: s as Filter, label: STATUS[s].label, count: count(s) })),
    ...(count('dibatalkan') > 0 ? [{ value: 'dibatalkan' as Filter, label: STATUS.dibatalkan.label, count: count('dibatalkan') }] : []),
  ]

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Vendor"
        description="Catat semua calon vendor di satu tempat, lalu tandai progresnya sampai deal."
        actions={
          <Button onClick={() => setShowVendorModal(true)} icon={<Plus className="size-4" aria-hidden />}>
            Tambah vendor
          </Button>
        }
      />

      <HowTo
        id="vendors"
        steps={[
          <>Tambahkan vendor yang sedang kamu lirik beserta harga penawarannya.</>,
          <>Tekan tombol langkah berikutnya: <strong className="text-ink">Kandidat → Dihubungi → Dipertimbangkan → Deal</strong>.</>,
          <>Vendor berstatus <strong className="text-ink">Deal</strong> otomatis masuk ke total nilai kontrak.</>,
        ]}
      />

      <Card className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <Stat label="Sudah deal" value={`${deals.length} vendor`} hint={`dari ${vendors.length} vendor yang dicatat`} tone="success" />
        <Stat label="Total nilai kontrak" value={formatRupiah(totalContract)} hint="Jumlah harga semua vendor yang deal" />
        <Stat label="Masih dijajaki" value={`${count('dihubungi') + count('dipertimbangkan')} vendor`} hint="Sudah dihubungi atau sedang dipertimbangkan" />
      </Card>

      <div className="space-y-3">
        <ChipGroup<Filter> label="Saring berdasarkan status" value={filter} onChange={setFilter} options={filterOptions} />
        <SearchInput label="Cari vendor" value={query} onChange={setQuery} placeholder="Cari nama, kategori, atau layanan…" className="sm:max-w-sm" />
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          icon={<Store className="size-7" aria-hidden />}
          title="Belum ada vendor"
          description="Mulai dari vendor yang paling penting dulu, misalnya venue dan katering."
          action={
            <Button onClick={() => setShowVendorModal(true)} icon={<Plus className="size-4" aria-hidden />}>
              Tambah vendor pertama
            </Button>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Store className="size-7" aria-hidden />}
          title="Tidak ada vendor yang cocok"
          description="Coba kata kunci lain atau pilih status Semua."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setFilter('all')
                setQuery('')
              }}
            >
              Tampilkan semua
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onStatus={(s) => void updateVendorStatus(vendor.id, s)}
              onDelete={() => confirm.ask(vendor)}
            />
          ))}
        </div>
      )}

      <VendorModal isOpen={showVendorModal} onClose={() => setShowVendorModal(false)} categories={categories} onSubmit={createVendor} />
      <ConfirmDialog
        open={confirm.target != null}
        title="Hapus vendor ini?"
        message={
          <>
            <strong className="text-ink">{confirm.target?.custom_name}</strong> akan dihapus dari daftar. Jika hanya tidak jadi dipakai, ubah
            statusnya menjadi Dibatalkan saja.
          </>
        }
        onConfirm={() => (confirm.target ? deleteVendor(confirm.target.id) : undefined)}
        onClose={confirm.close}
      />
    </div>
  )
}

function VendorCard({ vendor, onStatus, onDelete }: { vendor: WeddingVendor; onStatus: (s: WeddingVendorStatus) => void; onDelete: () => void }) {
  const status = STATUS[vendor.status] ?? STATUS.kandidat
  const next = NEXT_STEP[vendor.status]
  const price = vendor.contract_amount ?? vendor.quoted_amount
  const stepIndex = FLOW.indexOf(vendor.status)
  const hasDetail = Boolean(vendor.service_scope || vendor.notes || vendor.extra_costs_note)

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {vendor.vendor_category ? CATEGORY_NAMES[vendor.vendor_category] ?? vendor.vendor_category : 'Vendor'}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold text-ink">{vendor.custom_name ?? 'Tanpa nama'}</h3>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {/* Progres alur: 4 titik */}
      {stepIndex >= 0 && (
        <div className="mt-3 flex items-center gap-1.5" aria-label={`Tahap ${stepIndex + 1} dari 4: ${status.hint}`} role="img">
          {FLOW.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-surface-muted'}`} />
          ))}
        </div>
      )}
      <p className="mt-1.5 text-xs text-ink-subtle">{status.hint}</p>

      <div className="mt-4 flex items-baseline justify-between gap-3 rounded-xl bg-surface-muted/60 px-4 py-3">
        <span className="text-sm text-ink-muted">{vendor.contract_amount ? 'Harga deal' : 'Harga penawaran'}</span>
        <span className="font-semibold text-ink tabular">{price ? formatRupiah(price) : 'Belum ada'}</span>
      </div>

      {vendor.contact_note && (
        <p className="mt-3 flex items-start gap-2 text-sm text-ink-muted">
          <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {vendor.contact_note}
        </p>
      )}

      {hasDetail && (
        <details className="group mt-3">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            Lihat detail layanan & catatan
          </summary>
          <div className="space-y-2 pb-1 text-sm text-ink-muted">
            {vendor.service_scope && <p className="whitespace-pre-line">{vendor.service_scope}</p>}
            {vendor.extra_costs_note && <p>Biaya tambahan: {vendor.extra_costs_note}</p>}
            {vendor.notes && <p>Catatan: {vendor.notes}</p>}
          </div>
        </details>
      )}

      <div className="flex-1" />
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {next && (
          <Button size="sm" variant={next.to === 'dipilih' ? 'primary' : 'secondary'} className="w-full sm:w-auto" onClick={() => onStatus(next.to)} icon={<ArrowRight className="size-4" aria-hidden />}>
            {next.label}
          </Button>
        )}
        <SelectFilter label={`Ubah status ${vendor.custom_name ?? 'vendor'}`} value={vendor.status} onChange={(v) => onStatus(v as WeddingVendorStatus)} className="min-w-0 flex-1 sm:ml-auto sm:w-44 sm:flex-none [&_select]:h-9">
          {[...FLOW, 'dibatalkan' as const].map((s) => (
            <option key={s} value={s}>
              {STATUS[s].label}
            </option>
          ))}
        </SelectFilter>
        <IconButton label={`Hapus ${vendor.custom_name ?? 'vendor'}`} tone="danger" onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden />
        </IconButton>
      </div>
    </Card>
  )
}
