/**
 * Ringkasan tabungan bersama. Semua nilai integer rupiah.
 *
 * Setiap setoran otomatis menambah `weddings.available_funds` (trigger database), jadi:
 *  - dana terkumpul = available_funds
 *  - dana awal      = available_funds − total setoran (dana yang sudah ada sebelum mulai mencatat)
 */
import type { SavingsEntry, Wedding } from './database.types'
import { daysBetween, parseDateOnly } from './format'

export type MemberSavings = { total: number; count: number; lastDate: string | null }

export type SavingsSummary = {
  /** Jumlah semua setoran yang tercatat. */
  totalSaved: number
  /** Dana terkumpul untuk pernikahan (termasuk dana awal). */
  collected: number
  initialFunds: number
  target: number
  /** Sisa menuju target (0 jika tercapai). */
  remaining: number
  /** 0..1 */
  progress: number
  reached: boolean
  thisMonth: number
  byMember: Record<string, MemberSavings>
  /** Perkiraan setoran berdua per bulan agar target tercapai sebelum hari H; null jika tidak relevan. */
  monthlyNeeded: number | null
  monthsLeft: number | null
}

export function summarizeSavings(
  entries: Pick<SavingsEntry, 'user_id' | 'amount' | 'saved_on'>[],
  wedding: Pick<Wedding, 'available_funds' | 'budget_target' | 'wedding_date'>,
  today: Date = new Date(),
): SavingsSummary {
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const byMember: Record<string, MemberSavings> = {}
  let totalSaved = 0
  let thisMonth = 0

  for (const e of entries) {
    totalSaved += e.amount
    if (e.saved_on.startsWith(monthKey)) thisMonth += e.amount
    const m = (byMember[e.user_id] ??= { total: 0, count: 0, lastDate: null })
    m.total += e.amount
    m.count++
    if (!m.lastDate || e.saved_on > m.lastDate) m.lastDate = e.saved_on
  }

  const collected = wedding.available_funds
  const target = wedding.budget_target
  const remaining = Math.max(target - collected, 0)
  const reached = target > 0 && remaining === 0

  let monthsLeft: number | null = null
  let monthlyNeeded: number | null = null
  if (wedding.wedding_date && remaining > 0) {
    const days = daysBetween(today, parseDateOnly(wedding.wedding_date))
    if (days > 0) {
      monthsLeft = Math.max(1, Math.ceil(days / 30.44))
      monthlyNeeded = Math.ceil(remaining / monthsLeft)
    }
  }

  return {
    totalSaved,
    collected,
    initialFunds: Math.max(collected - totalSaved, 0),
    target,
    remaining,
    progress: target > 0 ? Math.min(collected / target, 1) : 0,
    reached,
    thisMonth,
    byMember,
    monthlyNeeded,
    monthsLeft,
  }
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export type SavingsMonth<T> = { key: string; label: string; total: number; entries: T[] }

/** Kelompokkan setoran per bulan, terbaru dulu. */
export function groupSavingsByMonth<T extends Pick<SavingsEntry, 'amount' | 'saved_on' | 'created_at'>>(entries: T[]): SavingsMonth<T>[] {
  const sorted = [...entries].sort((a, b) => b.saved_on.localeCompare(a.saved_on) || b.created_at.localeCompare(a.created_at))
  const groups: SavingsMonth<T>[] = []
  for (const e of sorted) {
    const key = e.saved_on.slice(0, 7)
    let g = groups[groups.length - 1]
    if (!g || g.key !== key) {
      const [y, m] = key.split('-').map(Number)
      g = { key, label: `${MONTHS[(m ?? 1) - 1]} ${y}`, total: 0, entries: [] }
      groups.push(g)
    }
    g.total += e.amount
    g.entries.push(e)
  }
  return groups
}
