import { describe, expect, it } from 'vitest'
import { calculateFinance, monthlySavingNeeded, percent, upcomingPayments, type FinanceInput } from './finance'

const base = (overrides: Partial<FinanceInput> = {}): FinanceInput => ({
  wedding: { budget_target: 100_000_000, available_funds: 40_000_000 },
  categories: [
    { id: 'venue', name: 'Venue', planned_amount: 30_000_000, is_archived: false, is_reserve: false },
    { id: 'katering', name: 'Katering', planned_amount: 50_000_000, is_archived: false, is_reserve: false },
    { id: 'cadangan', name: 'Dana cadangan', planned_amount: 20_000_000, is_archived: false, is_reserve: true },
  ],
  expenses: [],
  vendors: [],
  payments: [],
  ...overrides,
})

describe('calculateFinance', () => {
  it('menghasilkan ringkasan nol untuk workspace baru', () => {
    const s = calculateFinance(base())
    expect(s.totalBudget).toBe(100_000_000)
    expect(s.actualSpent).toBe(0)
    expect(s.outstandingBills).toBe(0)
    expect(s.remainingBudget).toBe(100_000_000)
    expect(s.cashOnHand).toBe(40_000_000)
    expect(s.unallocatedFunds).toBe(40_000_000)
    expect(s.allocationGap).toBe(0)
  })

  it('tidak menghitung kategori yang diarsipkan', () => {
    const s = calculateFinance(
      base({
        categories: [
          { id: 'a', name: 'A', planned_amount: 10, is_archived: false, is_reserve: false },
          { id: 'b', name: 'B', planned_amount: 99, is_archived: true, is_reserve: false },
        ],
      }),
    )
    expect(s.totalBudget).toBe(10)
    expect(s.categories).toHaveLength(1)
  })

  it('DP dan pelunasan atas satu kontrak tidak dihitung dua kali', () => {
    const s = calculateFinance(
      base({
        vendors: [{ id: 'v1', category_id: 'venue', status: 'dipilih', contract_amount: 30_000_000 }],
        payments: [
          { id: 'p1', wedding_vendor_id: 'v1', amount: 10_000_000, status: 'paid', due_date: null },
          { id: 'p2', wedding_vendor_id: 'v1', amount: 20_000_000, status: 'scheduled', due_date: '2027-01-01' },
        ],
      }),
    )
    // Pengeluaran aktual hanya DP yang sudah dibayar, kontrak bukan pengeluaran.
    expect(s.actualSpent).toBe(10_000_000)
    expect(s.contractTotal).toBe(30_000_000)
    expect(s.paidToVendors).toBe(10_000_000)
    // Sisa tagihan = kontrak − dibayar (jadwal pelunasan TIDAK ditambahkan lagi).
    expect(s.outstandingBills).toBe(20_000_000)
    const venue = s.categories.find((c) => c.id === 'venue')!
    expect(venue.actual).toBe(10_000_000)
    expect(venue.committed).toBe(30_000_000)
    expect(venue.isOverBudget).toBe(false)
  })

  it('kontrak lunas tidak menyisakan tagihan negatif meski ada kelebihan bayar', () => {
    const s = calculateFinance(
      base({
        vendors: [{ id: 'v1', category_id: 'venue', status: 'dipilih', contract_amount: 5_000_000 }],
        payments: [{ id: 'p1', wedding_vendor_id: 'v1', amount: 6_000_000, status: 'paid', due_date: null }],
      }),
    )
    expect(s.outstandingBills).toBe(0)
    expect(s.actualSpent).toBe(6_000_000)
  })

  it('pembayaran terjadwal dan dibatalkan bukan pengeluaran aktual', () => {
    const s = calculateFinance(
      base({
        payments: [
          { id: 'p1', wedding_vendor_id: null, amount: 1_000_000, status: 'scheduled', due_date: null },
          { id: 'p2', wedding_vendor_id: null, amount: 2_000_000, status: 'cancelled', due_date: null },
        ],
      }),
    )
    expect(s.actualSpent).toBe(0)
    expect(s.outstandingBills).toBe(1_000_000)
  })

  it('vendor dibatalkan tidak punya tagihan, tapi uang yang sudah dibayar tetap pengeluaran', () => {
    const s = calculateFinance(
      base({
        vendors: [{ id: 'v1', category_id: 'venue', status: 'dibatalkan', contract_amount: 30_000_000 }],
        payments: [
          { id: 'p1', wedding_vendor_id: 'v1', amount: 5_000_000, status: 'paid', due_date: null },
          { id: 'p2', wedding_vendor_id: 'v1', amount: 25_000_000, status: 'scheduled', due_date: null },
        ],
      }),
    )
    expect(s.outstandingBills).toBe(0)
    expect(s.actualSpent).toBe(5_000_000)
    expect(s.contractTotal).toBe(0)
  })

  it('vendor tanpa kontrak final memakai jadwal pembayaran sebagai kewajiban', () => {
    const s = calculateFinance(
      base({
        vendors: [{ id: 'v1', category_id: null, status: 'dipertimbangkan', contract_amount: null }],
        payments: [{ id: 'p1', wedding_vendor_id: 'v1', amount: 3_000_000, status: 'scheduled', due_date: null }],
      }),
    )
    expect(s.outstandingBills).toBe(3_000_000)
  })

  it('menggabungkan pengeluaran langsung dan pembayaran vendor', () => {
    const s = calculateFinance(
      base({
        expenses: [
          { category_id: 'katering', amount: 2_000_000, status: 'paid' },
          { category_id: 'katering', amount: 1_500_000, status: 'planned' },
          { category_id: 'katering', amount: 9_999_999, status: 'cancelled' },
        ],
        vendors: [{ id: 'v1', category_id: 'venue', status: 'dipilih', contract_amount: 30_000_000 }],
        payments: [{ id: 'p1', wedding_vendor_id: 'v1', amount: 10_000_000, status: 'paid', due_date: null }],
      }),
    )
    expect(s.actualSpent).toBe(12_000_000)
    expect(s.plannedExpenses).toBe(1_500_000)
    expect(s.remainingBudget).toBe(88_000_000)
    expect(s.cashOnHand).toBe(28_000_000)
    // 28jt saldo − 20jt sisa kontrak − 1,5jt rencana
    expect(s.unallocatedFunds).toBe(6_500_000)
  })

  it('memberi tanda kategori yang komitmennya melampaui anggaran', () => {
    const s = calculateFinance(
      base({
        vendors: [{ id: 'v1', category_id: 'venue', status: 'dipilih', contract_amount: 35_000_000 }],
      }),
    )
    expect(s.categories.find((c) => c.id === 'venue')!.isOverBudget).toBe(true)
    expect(s.categories.find((c) => c.id === 'katering')!.isOverBudget).toBe(false)
  })

  it('dana belum dialokasikan bisa negatif saat dana kurang', () => {
    const s = calculateFinance(
      base({
        wedding: { budget_target: 100_000_000, available_funds: 5_000_000 },
        vendors: [{ id: 'v1', category_id: 'venue', status: 'dipilih', contract_amount: 30_000_000 }],
      }),
    )
    expect(s.unallocatedFunds).toBe(-25_000_000)
  })
})

describe('upcomingPayments', () => {
  const today = new Date(2026, 9, 13)
  it('mengurutkan dan memfilter jatuh tempo', () => {
    const result = upcomingPayments(
      [
        { id: 'late', wedding_vendor_id: null, amount: 1, status: 'scheduled', due_date: '2026-10-10' },
        { id: 'soon', wedding_vendor_id: null, amount: 1, status: 'scheduled', due_date: '2026-10-20' },
        { id: 'far', wedding_vendor_id: null, amount: 1, status: 'scheduled', due_date: '2027-03-01' },
        { id: 'paid', wedding_vendor_id: null, amount: 1, status: 'paid', due_date: '2026-10-14' },
        { id: 'nodate', wedding_vendor_id: null, amount: 1, status: 'scheduled', due_date: null },
      ],
      today,
    )
    expect(result.map((p) => p.id)).toEqual(['late', 'soon'])
    expect(result[0]!.daysLeft).toBe(-3)
  })
})

describe('helper', () => {
  it('percent aman terhadap pembagi nol dan nilai di luar rentang', () => {
    expect(percent(5, 0)).toBe(0)
    expect(percent(1, 3)).toBe(33)
    expect(percent(10, 5)).toBe(100)
    expect(percent(-1, 5)).toBe(0)
  })

  it('monthlySavingNeeded membagi kekurangan per bulan', () => {
    const today = new Date(2026, 0, 1)
    expect(monthlySavingNeeded(12_000_000, '2026-12-27', today)).toBe(1_000_000)
    expect(monthlySavingNeeded(0, '2026-12-27', today)).toBeNull()
    expect(monthlySavingNeeded(1_000, null, today)).toBeNull()
    expect(monthlySavingNeeded(1_000, '2025-01-01', today)).toBeNull()
  })
})
