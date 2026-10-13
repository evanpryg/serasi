import type { MemberRole, MemberSide } from './database.types'

export type { MemberSide }

/** Label peran. CPP = calon pengantin pria, CPW = calon pengantin wanita. */
export const SIDE_LABEL: Record<MemberSide, { short: string; long: string; gender: string }> = {
  cpp: { short: 'CPP', long: 'Calon pengantin pria', gender: 'Pria' },
  cpw: { short: 'CPW', long: 'Calon pengantin wanita', gender: 'Wanita' },
}

/** Warna tetap per peran (kelas Tailwind dari token --color-cpp / --color-cpw). */
export const SIDE_TONE: Record<MemberSide, { bg: string; text: string; soft: string; border: string }> = {
  cpp: { bg: 'bg-cpp', text: 'text-cpp', soft: 'bg-cpp-soft', border: 'border-cpp/25' },
  cpw: { bg: 'bg-cpw', text: 'text-cpw', soft: 'bg-cpw-soft', border: 'border-cpw/25' },
}

/** Warna meta theme-color (bilah browser mobile) per tema. */
const THEME_COLOR: Record<MemberSide, string> = { cpp: '#1E3A6E', cpw: '#A3385E' }

const STORAGE_KEY = 'serasi:side'

export function otherSide(side: MemberSide): MemberSide {
  return side === 'cpp' ? 'cpw' : 'cpp'
}

export function isMemberSide(value: unknown): value is MemberSide {
  return value === 'cpp' || value === 'cpw'
}

/**
 * Peran anggota. Data lama (sebelum peran dipilih) memakai tebakan dari urutan
 * bergabung supaya warna tetap konsisten sampai user memilih sendiri.
 */
export function resolveSide(member: { side?: MemberSide | null; role: MemberRole }): MemberSide {
  return member.side ?? (member.role === 'owner' ? 'cpp' : 'cpw')
}

/** Urutkan pasangan: CPP lebih dulu (kiri), lalu CPW. */
export function sortCouple<T extends { side?: MemberSide | null; role: MemberRole }>(list: T[]): T[] {
  return [...list].sort((a, b) => (resolveSide(a) === 'cpp' ? -1 : 1) - (resolveSide(b) === 'cpp' ? -1 : 1))
}

/**
 * Pasang tema di <html data-side>. Disimpan di localStorage agar skrip kecil di
 * index.html bisa memasang tema sebelum React dimuat (tanpa kedip warna).
 */
export function applySideTheme(side: MemberSide | null): void {
  const root = document.documentElement
  if (side) root.dataset.side = side
  else delete root.dataset.side
  try {
    if (side) localStorage.setItem(STORAGE_KEY, side)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage bisa diblokir (mode privat); tema tetap terpasang untuk sesi ini.
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[side ?? 'cpp'])
}
