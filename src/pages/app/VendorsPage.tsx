import { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Phone,
  Plus,
  Search,
  Store,
  Trash2,
} from 'lucide-react'
import { useWedding } from '@/auth/WorkspaceProvider'
import { useVendorsData } from '@/hooks/usePlanningData'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { formatRupiah } from '@/lib/format'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { VendorModal } from './vendors/VendorModal'
import type { WeddingVendorStatus } from '@/lib/database.types'

const STATUS_LABELS: Record<WeddingVendorStatus, { label: string; tone: 'success' | 'gold' | 'primary' | 'neutral' | 'danger' }> = {
  dipilih: { label: 'Dipilih (Deal)', tone: 'success' },
  dipertimbangkan: { label: 'Dipertimbangkan', tone: 'gold' },
  dihubungi: { label: 'Sudah Dihubungi', tone: 'primary' },
  kandidat: { label: 'Kandidat', tone: 'neutral' },
  dibatalkan: { label: 'Dibatalkan', tone: 'danger' },
}

const CATEGORY_NAMES: Record<string, string> = {
  venue: 'Venue & Gedung',
  katering: 'Katering',
  dekorasi: 'Dekorasi & Ambience',
  foto_video: 'Foto & Video',
  mua: 'MUA & Busana',
  undangan: 'Undangan & Souvenir',
  hiburan: 'Musik & Hiburan',
  wedding_organizer: 'Wedding Organizer (WO)',
  lainnya: 'Vendor Lainnya',
}

export function VendorsPage() {
  const wedding = useWedding()
  const { state, reload, createVendor, updateVendorStatus, deleteVendor } = useVendorsData(wedding.id)
  const isDemo = Boolean(getCurrentDemoAccount())
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showVendorModal, setShowVendorModal] = useState(false)

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
    return <ErrorState message="Gagal memuat daftar vendor." onRetry={() => void reload()} />
  }

  const { vendors, categories } = state.data

  // Stats
  const chosenVendors = vendors.filter((v) => v.status === 'dipilih')
  const totalContract = chosenVendors.reduce((sum, v) => sum + (v.contract_amount ?? 0), 0)

  // Filtered
  const filteredVendors = vendors.filter((v) => {
    if (selectedStatus !== 'all' && v.status !== selectedStatus) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const name = (v.custom_name ?? '').toLowerCase()
      const scope = (v.service_scope ?? '').toLowerCase()
      const notes = (v.notes ?? '').toLowerCase()
      return name.includes(q) || scope.includes(q) || notes.includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[2.4rem] font-semibold leading-tight sm:text-5xl">Vendor Pernikahan</h1>
            {isDemo && (
              <Badge tone="gold" className="self-center">
                Akun Demo Interaktif
              </Badge>
            )}
          </div>
          <p className="mt-1 text-ink-muted">
            Katalog vendor, rincian kontrak kerja, ruang lingkup layanan, dan kontak PIC tim pendukung hari H.
          </p>
        </div>

        <Button
          onClick={() => setShowVendorModal(true)}
          icon={<Plus className="size-4" />}
        >
          Tambah Vendor
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Vendor Dipilih (Deal)</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-success-soft text-success">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">
            {chosenVendors.length} <span className="text-sm font-normal text-ink-muted">dari {vendors.length} vendor</span>
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Vendor resmi yang sudah mengikat kontrak</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Total Komitmen Kontrak</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Building2 className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-primary">{formatRupiah(totalContract)}</p>
          <p className="mt-1 text-xs text-ink-subtle">Akumulasi nilai seluruh vendor terpilih</p>
        </Card>

        <Card className="p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-muted">Dalam Penjajakan</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-gold-soft text-gold-text">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">
            {vendors.filter((v) => v.status === 'dipertimbangkan' || v.status === 'dihubungi').length}{' '}
            <span className="text-sm font-normal text-ink-muted">vendor</span>
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Sedang dinegosiasi atau menunggu penawaran</p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface border border-border text-ink-muted hover:bg-surface-muted hover:text-ink'
            }`}
          >
            Semua ({vendors.length})
          </button>
          {(['dipilih', 'dipertimbangkan', 'dihubungi', 'kandidat'] as WeddingVendorStatus[]).map((status) => {
            const count = vendors.filter((v) => v.status === status).length
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  selectedStatus === status
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface border border-border text-ink-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                {STATUS_LABELS[status].label} ({count})
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Cari nama atau layanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center">
            <Store className="mx-auto size-10 text-ink-subtle" />
            <p className="mt-3 font-semibold text-ink">Tidak ada vendor ditemukan</p>
            <p className="text-sm text-ink-muted">Coba ubah kata kunci pencarian atau filter status.</p>
          </div>
        ) : (
          filteredVendors.map((vendor) => {
            const statusConfig = STATUS_LABELS[vendor.status] ?? STATUS_LABELS.kandidat
            const catLabel = vendor.vendor_category ? CATEGORY_NAMES[vendor.vendor_category] ?? vendor.vendor_category : 'Vendor'

            return (
              <Card key={vendor.id} className="flex flex-col justify-between overflow-hidden p-6 transition-shadow hover:shadow-pop">
                <div>
                  {/* Top Bar: Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">{catLabel}</span>
                      <h3 className="mt-0.5 text-lg font-bold text-ink">{vendor.custom_name ?? 'Nama Vendor'}</h3>
                    </div>
                    <Badge tone={statusConfig.tone}>{statusConfig.label}</Badge>
                  </div>

                  {/* Financial / Contract amount */}
                  <div className="mt-4 rounded-xl bg-surface-muted/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-muted">
                        {vendor.contract_amount ? 'Nilai Kontrak Deal' : 'Estimasi Penawaran'}
                      </span>
                      <span className="font-display text-base font-bold text-ink tabular">
                        {vendor.contract_amount
                          ? formatRupiah(vendor.contract_amount)
                          : vendor.quoted_amount
                            ? formatRupiah(vendor.quoted_amount)
                            : 'Belum ada harga'}
                      </span>
                    </div>
                    {vendor.extra_costs_note && (
                      <p className="mt-1 text-xs text-ink-subtle italic">Info biaya: {vendor.extra_costs_note}</p>
                    )}
                  </div>

                  {/* Service Scope */}
                  {vendor.service_scope && (
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                        <FileText className="size-3.5" />
                        <span>Ruang Lingkup Layanan:</span>
                      </div>
                      <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-line">{vendor.service_scope}</p>
                    </div>
                  )}

                  {/* Contact Note */}
                  {vendor.contact_note && (
                    <div className="mt-3 flex items-start gap-2 text-xs text-ink-muted">
                      <Phone className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>{vendor.contact_note}</span>
                    </div>
                  )}

                  {/* Personal Notes */}
                  {vendor.notes && (
                    <div className="mt-3 rounded-lg border border-border/80 bg-surface/50 p-2.5 text-xs text-ink-muted">
                      <strong>Catatan khusus:</strong> {vendor.notes}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted font-medium">Ubah Status:</span>
                    <select
                      value={vendor.status}
                      onChange={(e) => void updateVendorStatus(vendor.id, e.target.value as WeddingVendorStatus)}
                      className="rounded-lg border border-border bg-canvas px-2 py-1 text-xs text-ink focus:border-primary"
                    >
                      <option value="kandidat">Kandidat</option>
                      <option value="dihubungi">Dihubungi</option>
                      <option value="dipertimbangkan">Dipertimbangkan</option>
                      <option value="dipilih">Dipilih (Deal)</option>
                      <option value="dibatalkan">Dibatalkan</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus vendor "${vendor.custom_name}"?`)) {
                        void deleteVendor(vendor.id)
                      }
                    }}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-subtle hover:bg-danger-soft hover:text-danger transition-colors"
                    title="Hapus Vendor"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Vendor Modal */}
      <VendorModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        categories={categories}
        onSubmit={async (data) => {
          await createVendor(data)
        }}
      />
    </div>
  )
}
