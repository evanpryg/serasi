const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

/** Format integer rupiah: 12500000 → "Rp 12.500.000". */
export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(Math.round(amount)).replace(/ /g, ' ')
}

/** Format ringkas untuk ruang sempit: 12500000 → "Rp 12,5 jt". */
export function formatRupiahShort(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  const fmt = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 })
  if (abs >= 1_000_000_000) return `${sign}Rp ${fmt(abs / 1_000_000_000)} M`
  if (abs >= 1_000_000) return `${sign}Rp ${fmt(abs / 1_000_000)} jt`
  if (abs >= 1_000) return `${sign}Rp ${fmt(abs / 1_000)} rb`
  return `${sign}Rp ${abs}`
}

/** Format angka tanpa simbol: 12500000 → "12.500.000" (dipakai di input nominal). */
export function formatNumber(amount: number): string {
  return numberFormatter.format(amount)
}

/**
 * Parse input nominal pengguna menjadi integer rupiah.
 * Titik = pemisah ribuan (format Indonesia). Bagian desimal (setelah koma) diabaikan.
 * "12.500.000" → 12500000, "Rp 5.000" → 5000, "" → null
 */
export function parseRupiahInput(raw: string): number | null {
  const integerPart = raw.split(',')[0] ?? ''
  const digits = integerPart.replace(/\D/g, '')
  if (digits === '') return null
  const value = Number(digits)
  return Number.isSafeInteger(value) ? value : null
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** Parse "YYYY-MM-DD" sebagai tanggal lokal (bukan UTC) agar hari tidak bergeser. */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function toDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "2026-10-13" → "13 Oktober 2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parseDateOnly(value)
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** "2026-10-13" → "13 Okt 2026" */
export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parseDateOnly(value)
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

/** Selisih hari kalender dari `from` ke `to` (positif = di masa depan). */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / 86_400_000)
}

/** Label tenggat: "Hari ini", "Besok", "3 hari lagi", "Terlambat 2 hari". */
export function relativeDueLabel(due: string, today: Date = new Date()): string {
  const diff = daysBetween(today, parseDateOnly(due))
  if (diff === 0) return 'Hari ini'
  if (diff === 1) return 'Besok'
  if (diff < 0) return `Terlambat ${-diff} hari`
  return `${diff} hari lagi`
}
