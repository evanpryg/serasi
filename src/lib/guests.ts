import type { Guest, MemberSide } from './database.types'

/** Kategori baku tamu. Disimpan apa adanya di `guests.group_name`; kategori buatan sendiri tetap boleh. */
export const GUEST_CATEGORIES = ['Saudara', 'Teman/Sahabat', 'Rekan kerja', 'Tetangga', 'Kenalan orang tua', 'Tokoh/VIP', 'Lainnya'] as const

export const DEFAULT_CATEGORY = 'Saudara'

/** Label pihak tamu (bukan peran user): "dari pihak siapa tamu ini diundang". */
export const GUEST_SIDE_LABEL: Record<MemberSide, string> = { cpp: 'Pria', cpw: 'Wanita' }

/** Seragamkan nama kelompok lama ("Keluarga Pria", "Kolega Kantor", ...) ke kategori baku. Sama dengan migration 000011. */
export function normalizeCategory(group: string | null | undefined): string {
  const g = (group ?? '').trim()
  const l = g.toLowerCase()
  if (!g) return 'Lainnya'
  if (l.startsWith('keluarga') || l.startsWith('saudara')) return 'Saudara'
  if (l.includes('sahabat') || l.startsWith('teman') || l.startsWith('alumni')) return 'Teman/Sahabat'
  if (l.includes('kolega') || l.startsWith('rekan') || l.includes('kantor')) return 'Rekan kerja'
  if (l.startsWith('tetangga')) return 'Tetangga'
  if (l.startsWith('vip') || l.startsWith('tokoh')) return 'Tokoh/VIP'
  return g
}

/**
 * Tamu dari database atau data demo lama. Jika kolom `side` belum ada (migration 000011
 * belum dijalankan) pihak ditebak dari nama kelompok.
 */
export function normalizeGuest(raw: Guest): Guest {
  const side: MemberSide = raw.side === 'cpp' || raw.side === 'cpw' ? raw.side : /wanita/i.test(raw.group_name ?? '') ? 'cpw' : 'cpp'
  return { ...raw, side, group_name: normalizeCategory(raw.group_name) }
}

/** Urutan tampil: kategori baku dulu (sesuai daftar), lalu kategori sendiri menurut abjad. */
export function compareCategory(a: string, b: string): number {
  const ia = (GUEST_CATEGORIES as readonly string[]).indexOf(a)
  const ib = (GUEST_CATEGORIES as readonly string[]).indexOf(b)
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  return a.localeCompare(b, 'id')
}

export type Tally = { invites: number; people: number }
export type CategoryRow = { category: string; cpp: Tally; cpw: Tally; total: Tally }

const empty = (): Tally => ({ invites: 0, people: 0 })

/** Rekap jumlah undangan & orang per kategori, dipisah pihak pria dan wanita. */
export function tallyByCategory(guests: Guest[]): { rows: CategoryRow[]; cpp: Tally; cpw: Tally; total: Tally } {
  const map = new Map<string, CategoryRow>()
  const cpp = empty()
  const cpw = empty()
  for (const g of guests) {
    const category = g.group_name || 'Lainnya'
    let row = map.get(category)
    if (!row) map.set(category, (row = { category, cpp: empty(), cpw: empty(), total: empty() }))
    for (const t of [row[g.side], row.total, g.side === 'cpw' ? cpw : cpp]) {
      t.invites += 1
      t.people += g.guest_count
    }
  }
  const rows = [...map.values()].sort((a, b) => compareCategory(a.category, b.category))
  return { rows, cpp, cpw, total: { invites: cpp.invites + cpw.invites, people: cpp.people + cpw.people } }
}
