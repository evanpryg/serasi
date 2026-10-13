import { describe, expect, it } from 'vitest'
import { buildPriorities } from './priorities'
import { calculateFinance } from './finance'

const today = new Date(2026, 9, 13)
const summary = (overrides: Partial<Parameters<typeof calculateFinance>[0]> = {}) =>
  calculateFinance({
    wedding: { budget_target: 10_000_000, available_funds: 10_000_000 },
    categories: [{ id: 'c1', name: 'Venue', planned_amount: 10_000_000, is_archived: false, is_reserve: false }],
    expenses: [],
    vendors: [],
    payments: [],
    ...overrides,
  })

describe('buildPriorities', () => {
  it('mendahulukan pembayaran terlambat, lalu tugas dekat tenggat', () => {
    const payments = [{ id: 'p1', wedding_vendor_id: 'v1', amount: 2_000_000, status: 'scheduled' as const, due_date: '2026-10-10' }]
    const items = buildPriorities({
      wedding: { wedding_date: '2027-05-01', guest_estimate: 200 },
      summary: summary({ payments }),
      tasks: [
        { id: 't1', title: 'Pilih venue', status: 'todo', due_date: '2026-10-15' },
        { id: 't2', title: 'Selesai', status: 'done', due_date: '2026-10-14' },
        { id: 't3', title: 'Jauh', status: 'todo', due_date: '2027-01-01' },
      ],
      payments,
      vendorNames: new Map([['v1', 'Gedung Serbaguna']]),
      today,
    })
    expect(items.map((i) => i.id)).toEqual(['payment-p1', 'task-t1'])
    expect(items[0]!.title).toBe('Bayar Rp 2.000.000 ke Gedung Serbaguna')
    expect(items[0]!.tone).toBe('danger')
  })

  it('menyarankan melengkapi profil untuk workspace baru', () => {
    const items = buildPriorities({
      wedding: { wedding_date: null, guest_estimate: null },
      summary: summary(),
      tasks: [],
      payments: [],
      vendorNames: new Map(),
      today,
    })
    expect(items.map((i) => i.id)).toEqual(['profile-date', 'profile-guests'])
  })

  it('memperingatkan kategori yang melampaui anggaran', () => {
    const items = buildPriorities({
      wedding: { wedding_date: '2027-05-01', guest_estimate: 100 },
      summary: summary({ vendors: [{ id: 'v1', category_id: 'c1', status: 'dipilih', contract_amount: 12_000_000 }] }),
      tasks: [],
      payments: [],
      vendorNames: new Map(),
      today,
    })
    expect(items.some((i) => i.id === 'budget-c1' && i.tone === 'danger')).toBe(true)
    expect(items.some((i) => i.id === 'funds-shortfall')).toBe(true)
  })
})
