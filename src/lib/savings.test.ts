import { describe, expect, it } from 'vitest'
import { groupSavingsByMonth, summarizeSavings } from './savings'

const TODAY = new Date(2026, 9, 13) // 13 Okt 2026

const entries = [
  { user_id: 'a', amount: 2_000_000, saved_on: '2026-10-01', created_at: '2026-10-01T01:00:00Z' },
  { user_id: 'b', amount: 1_500_000, saved_on: '2026-10-05', created_at: '2026-10-05T01:00:00Z' },
  { user_id: 'a', amount: 1_000_000, saved_on: '2026-09-25', created_at: '2026-09-25T01:00:00Z' },
]

describe('summarizeSavings', () => {
  const wedding = { available_funds: 14_500_000, budget_target: 100_000_000, wedding_date: '2027-04-13' }

  it('menghitung total, dana awal, dan kontribusi tiap anggota', () => {
    const s = summarizeSavings(entries, wedding, TODAY)
    expect(s.totalSaved).toBe(4_500_000)
    expect(s.initialFunds).toBe(10_000_000)
    expect(s.collected).toBe(14_500_000)
    expect(s.thisMonth).toBe(3_500_000)
    expect(s.byMember.a).toEqual({ total: 3_000_000, count: 2, lastDate: '2026-10-01' })
    expect(s.byMember.b).toEqual({ total: 1_500_000, count: 1, lastDate: '2026-10-05' })
  })

  it('memperkirakan setoran per bulan sampai hari H', () => {
    const s = summarizeSavings(entries, wedding, TODAY)
    expect(s.remaining).toBe(85_500_000)
    expect(s.monthsLeft).toBe(6)
    expect(s.monthlyNeeded).toBe(14_250_000)
  })

  it('target tercapai: progres maksimal 100% dan tanpa saran per bulan', () => {
    const s = summarizeSavings(entries, { ...wedding, available_funds: 120_000_000 }, TODAY)
    expect(s.reached).toBe(true)
    expect(s.progress).toBe(1)
    expect(s.monthlyNeeded).toBeNull()
  })

  it('tanpa tanggal / tanggal lewat / tanpa target tetap aman', () => {
    expect(summarizeSavings([], { ...wedding, wedding_date: null }, TODAY).monthlyNeeded).toBeNull()
    expect(summarizeSavings([], { ...wedding, wedding_date: '2026-01-01' }, TODAY).monthlyNeeded).toBeNull()
    const none = summarizeSavings([], { available_funds: 0, budget_target: 0, wedding_date: null }, TODAY)
    expect(none.progress).toBe(0)
    expect(none.reached).toBe(false)
  })

  it('dana awal tidak pernah negatif', () => {
    expect(summarizeSavings(entries, { ...wedding, available_funds: 1_000_000 }, TODAY).initialFunds).toBe(0)
  })
})

describe('groupSavingsByMonth', () => {
  it('mengelompokkan per bulan, terbaru dulu, dengan subtotal', () => {
    const groups = groupSavingsByMonth(entries)
    expect(groups.map((g) => [g.label, g.total])).toEqual([
      ['Oktober 2026', 3_500_000],
      ['September 2026', 1_000_000],
    ])
    expect(groups[0]!.entries[0]!.saved_on).toBe('2026-10-05')
  })
})
