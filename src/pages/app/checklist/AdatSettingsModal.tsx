import { useState } from 'react'
import { Check, Compass, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Card'

export type AdatTraditionOption = {
  key: string
  title: string
  description: string
  defaultEnabled: boolean
}

export const ADAT_TRADITIONS: AdatTraditionOption[] = [
  {
    key: 'slametan',
    title: 'Slametan / Syukuran Pra-Nikah',
    description: 'Doa bersama tetangga & keluarga terdekat dengan tumpeng dan berkat nasi kotak.',
    defaultEnabled: true,
  },
  {
    key: 'pengajian',
    title: 'Pengajian Pra-Nikah',
    description: 'Khataman Al-Quran, pembacaan doa istighotsah, dan ceramah bekal pernikahan.',
    defaultEnabled: true,
  },
  {
    key: 'siraman',
    title: 'Upacara Siraman / Ngebakan',
    description: 'Pembersihan lahir batin dengan air 7 sumber dan kembang 7 rupa wangi.',
    defaultEnabled: true,
  },
  {
    key: 'midodareni',
    title: 'Malam Midodareni / Malam Bainai',
    description: 'Malam penantian bidadari (Jawa) atau pemakaian inai/pacar di kuku (Minang/Melayu).',
    defaultEnabled: false,
  },
  {
    key: 'panggih',
    title: 'Temu Manten / Panggih / Saweran Sunda',
    description: 'Upacara adat temu pengantin hari H: balangan suruh, ngidak endhog, kacar-kucur, atau sawer beras kuning.',
    defaultEnabled: true,
  },
  {
    key: 'lainnya',
    title: 'Tradisi Keluarga Kustom',
    description: 'Prosesi adat khusus keluarga (Martumpol Batak, Mappacci Bugis, dll).',
    defaultEnabled: false,
  },
]

type AdatSettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  enabledTraditions: string[]
  onSave: (enabledKeys: string[]) => void
}

export function AdatSettingsModal({ isOpen, onClose, enabledTraditions, onSave }: AdatSettingsModalProps) {
  const [selected, setSelected] = useState<string[]>(enabledTraditions)

  if (!isOpen) return null

  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-pop p-6 sm:p-7">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-warning-soft text-warning">
              <Compass className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Pengaturan Acara Adat & Tradisi</h2>
              <p className="text-xs text-ink-muted">Pilih tradisi yang akan diselenggarakan oleh keluargamu.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
            aria-label="Tutup"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="my-4 flex items-start gap-2.5 rounded-xl border border-warning/20 bg-warning-soft/30 p-3 text-xs text-ink-muted leading-relaxed">
          <Info className="size-4 shrink-0 text-warning mt-0.5" />
          <span>
            Tradisi adat bersifat opsional. Menonaktifkan tradisi yang tidak diadakan akan menyederhanakan
            checklist dan tidak membebani progres persiapanmu.
          </span>
        </div>

        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {ADAT_TRADITIONS.map((trad) => {
            const isChecked = selected.includes(trad.key)
            return (
              <div
                key={trad.key}
                onClick={() => toggle(trad.key)}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  isChecked
                    ? 'border-primary/50 bg-primary-soft/20'
                    : 'border-border bg-surface hover:bg-surface-muted/30'
                }`}
              >
                <div
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    isChecked ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-surface'
                  }`}
                >
                  {isChecked && <Check className="size-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{trad.title}</p>
                    {isChecked ? (
                      <Badge tone="success" className="text-[0.65rem]">Aktif</Badge>
                    ) : (
                      <Badge tone="neutral" className="text-[0.65rem]">Nonaktif</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">{trad.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() => {
              onSave(selected)
              onClose()
            }}
          >
            Simpan Pilihan Adat
          </Button>
        </div>
      </div>
    </div>
  )
}
