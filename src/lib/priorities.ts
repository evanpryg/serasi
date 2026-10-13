import type { Wedding } from './database.types'
import { daysBetween, formatRupiah, parseDateOnly, relativeDueLabel } from './format'
import { upcomingPayments, type FinanceInput, type FinanceSummary } from './finance'

export type PriorityItem = {
  id: string
  kind: 'task' | 'payment' | 'budget' | 'profile'
  title: string
  detail: string
  tone: 'danger' | 'warning' | 'neutral'
  to: string
}

type Input = {
  wedding: Pick<Wedding, 'wedding_date' | 'guest_estimate'>
  summary: FinanceSummary
  tasks: { id: string; title: string; status: string; due_date: string | null }[]
  payments: FinanceInput['payments']
  vendorNames: Map<string, string>
  today?: Date
  limit?: number
}

/** Susun "Prioritas berikutnya" dari data tersimpan. Urutan: mendesak → peringatan → saran. */
export function buildPriorities({ wedding, summary, tasks, payments, vendorNames, today = new Date(), limit = 6 }: Input): PriorityItem[] {
  const items: (PriorityItem & { rank: number })[] = []

  for (const p of upcomingPayments(payments, today, 30)) {
    const vendor = p.wedding_vendor_id ? vendorNames.get(p.wedding_vendor_id) : undefined
    items.push({
      id: `payment-${p.id}`,
      kind: 'payment',
      title: `Bayar ${formatRupiah(p.amount)}${vendor ? ` ke ${vendor}` : ''}`,
      detail: `Jatuh tempo: ${relativeDueLabel(p.due_date!, today)}`,
      tone: p.daysLeft < 0 ? 'danger' : p.daysLeft <= 7 ? 'warning' : 'neutral',
      to: '/app/vendors',
      rank: p.daysLeft,
    })
  }

  for (const t of tasks) {
    if (t.status === 'done' || !t.due_date) continue
    const days = daysBetween(today, parseDateOnly(t.due_date))
    if (days > 14) continue
    items.push({
      id: `task-${t.id}`,
      kind: 'task',
      title: t.title,
      detail: `Tenggat: ${relativeDueLabel(t.due_date, today)}`,
      tone: days < 0 ? 'danger' : days <= 3 ? 'warning' : 'neutral',
      to: '/app/checklist',
      rank: days + 0.5,
    })
  }

  for (const c of summary.categories) {
    if (!c.isOverBudget) continue
    items.push({
      id: `budget-${c.id}`,
      kind: 'budget',
      title: `${c.name} melewati anggaran`,
      detail: `Lebih ${formatRupiah(c.committed - c.planned)} dari rencana`,
      tone: 'danger',
      to: '/app/budget',
      rank: 100,
    })
  }

  if (summary.unallocatedFunds < 0) {
    items.push({
      id: 'funds-shortfall',
      kind: 'budget',
      title: 'Dana belum cukup untuk kewajiban yang ada',
      detail: `Kurang ${formatRupiah(-summary.unallocatedFunds)}. Perbarui dana tersedia atau tinjau komitmen.`,
      tone: 'warning',
      to: '/app/settings',
      rank: 110,
    })
  }

  if (!wedding.wedding_date) {
    items.push({
      id: 'profile-date',
      kind: 'profile',
      title: 'Tentukan tanggal pernikahan',
      detail: 'Tenggat checklist akan dihitung otomatis dari tanggal acara.',
      tone: 'neutral',
      to: '/app/settings',
      rank: 200,
    })
  }

  if (summary.allocationGap !== 0 && summary.budgetTarget > 0) {
    items.push({
      id: 'budget-gap',
      kind: 'budget',
      title: summary.allocationGap > 0 ? 'Alokasi kategori melebihi target' : 'Sebagian target belum dialokasikan',
      detail: `Selisih ${formatRupiah(Math.abs(summary.allocationGap))} antara total kategori dan target.`,
      tone: summary.allocationGap > 0 ? 'warning' : 'neutral',
      to: '/app/budget',
      rank: 210,
    })
  }

  if (wedding.guest_estimate == null) {
    items.push({
      id: 'profile-guests',
      kind: 'profile',
      title: 'Isi perkiraan jumlah tamu',
      detail: 'Membantu memperkirakan kebutuhan porsi katering.',
      tone: 'neutral',
      to: '/app/settings',
      rank: 220,
    })
  }

  return items
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ rank: _rank, ...item }) => item)
}
