/**
 * Rumus keuangan (PRD §6.5 D). Semua nilai integer rupiah.
 *
 * Model data (mencegah hitung ganda):
 *  - `payments`  = uang untuk kontrak vendor (DP, termin, pelunasan). Hanya status `paid` yang
 *                  dihitung sebagai pengeluaran aktual; `scheduled` adalah kewajiban mendatang.
 *  - `expenses`  = pengeluaran langsung di luar kontrak vendor. `paid` = aktual, `planned` = rencana.
 *  - Kontrak vendor (`contract_amount`) adalah KOMITMEN, bukan pengeluaran. Kontrak hanya menjadi
 *    pengeluaran ketika pembayarannya tercatat sebagai `paid`.
 *  - `available_funds` = total dana yang sudah terkumpul untuk pernikahan (kumulatif).
 *    Saldo dana = dana terkumpul − yang sudah dibayarkan.
 */
import type { BudgetCategory, Expense, Payment, Wedding, WeddingVendor } from './database.types'
import { daysBetween, parseDateOnly } from './format'

export type FinanceInput = {
  wedding: Pick<Wedding, 'budget_target' | 'available_funds'>
  categories: Pick<BudgetCategory, 'id' | 'name' | 'planned_amount' | 'is_archived' | 'is_reserve'>[]
  expenses: Pick<Expense, 'category_id' | 'amount' | 'status' | 'actual_amount'>[]
  vendors: Pick<WeddingVendor, 'id' | 'category_id' | 'status' | 'contract_amount'>[]
  payments: Pick<Payment, 'id' | 'wedding_vendor_id' | 'amount' | 'status' | 'due_date'>[]
}

export type CategorySummary = {
  id: string
  name: string
  planned: number
  /** Uang yang benar-benar sudah keluar. */
  actual: number
  /** actual + kewajiban yang belum dibayar (sisa kontrak + rencana pengeluaran). */
  committed: number
  isOverBudget: boolean
}

export type FinanceSummary = {
  budgetTarget: number
  /** Jumlah anggaran kategori aktif (termasuk dana cadangan). */
  totalBudget: number
  /** Pengeluaran aktual = expenses paid + payments paid. */
  actualSpent: number
  /** Total nilai kontrak vendor berstatus "dipilih". */
  contractTotal: number
  /** Total pembayaran paid yang diterapkan ke kontrak vendor. */
  paidToVendors: number
  /** Sisa tagihan vendor = Σ max(kontrak − dibayar, 0). */
  outstandingBills: number
  /** Pengeluaran langsung berstatus planned (belum dibayar). */
  plannedExpenses: number
  /** totalBudget − actualSpent */
  remainingBudget: number
  /** Dana terkumpul (input pengguna). */
  availableFunds: number
  /** Dana terkumpul − pengeluaran aktual. */
  cashOnHand: number
  /** Saldo dana − seluruh kewajiban mendatang. Negatif = kekurangan dana. */
  unallocatedFunds: number
  /** Selisih total anggaran kategori dengan target (positif = alokasi melebihi target). */
  allocationGap: number
  categories: CategorySummary[]
}

const sum = (values: number[]) => values.reduce((acc, v) => acc + v, 0)

/**
 * Nominal yang dihitung untuk satu item: item lunas memakai realisasi (`actual_amount`)
 * bila diisi, selain itu harga rencana (`amount`).
 */
export function expenseValue(e: Pick<Expense, 'amount' | 'status' | 'actual_amount'>): number {
  return e.status === 'paid' && e.actual_amount != null ? e.actual_amount : e.amount
}

export function calculateFinance(input: FinanceInput): FinanceSummary {
  const { wedding, categories, expenses, vendors, payments } = input
  const activeCategories = categories.filter((c) => !c.is_archived)

  const paidPayments = payments.filter((p) => p.status === 'paid')
  const paidExpenses = expenses.filter((e) => e.status === 'paid')
  const plannedExpenseRows = expenses.filter((e) => e.status === 'planned')

  const paidByVendor = new Map<string, number>()
  const scheduledByVendor = new Map<string, number>()
  for (const p of payments) {
    if (!p.wedding_vendor_id) continue
    if (p.status === 'paid') paidByVendor.set(p.wedding_vendor_id, (paidByVendor.get(p.wedding_vendor_id) ?? 0) + p.amount)
    if (p.status === 'scheduled')
      scheduledByVendor.set(p.wedding_vendor_id, (scheduledByVendor.get(p.wedding_vendor_id) ?? 0) + p.amount)
  }

  /** Sisa kewajiban satu vendor, tanpa menghitung ganda jadwal pembayaran dan kontrak. */
  const vendorOutstanding = (v: FinanceInput['vendors'][number]): number => {
    if (v.status === 'dibatalkan') return 0
    const paid = paidByVendor.get(v.id) ?? 0
    if (v.status === 'dipilih' && v.contract_amount != null) return Math.max(v.contract_amount - paid, 0)
    // Belum ada kontrak final: kewajiban = jadwal pembayaran yang sudah dibuat.
    return scheduledByVendor.get(v.id) ?? 0
  }

  const chosenVendors = vendors.filter((v) => v.status === 'dipilih')
  const contractTotal = sum(chosenVendors.map((v) => v.contract_amount ?? 0))
  const paidToVendors = sum(chosenVendors.map((v) => paidByVendor.get(v.id) ?? 0))
  const vendorBills = sum(vendors.map(vendorOutstanding))
  // Jadwal pembayaran yang tidak terhubung ke vendor tetap kewajiban.
  const unlinkedScheduled = sum(payments.filter((p) => p.status === 'scheduled' && !p.wedding_vendor_id).map((p) => p.amount))
  const outstandingBills = vendorBills + unlinkedScheduled

  const actualSpent = sum(paidExpenses.map(expenseValue)) + sum(paidPayments.map((p) => p.amount))
  const plannedExpenses = sum(plannedExpenseRows.map((e) => e.amount))
  const totalBudget = sum(activeCategories.map((c) => c.planned_amount))
  const cashOnHand = wedding.available_funds - actualSpent

  const categorySummaries: CategorySummary[] = activeCategories.map((c) => {
    const catVendors = vendors.filter((v) => v.category_id === c.id)
    const catVendorIds = new Set(catVendors.map((v) => v.id))
    const actual =
      sum(paidExpenses.filter((e) => e.category_id === c.id).map(expenseValue)) +
      sum(paidPayments.filter((p) => p.wedding_vendor_id && catVendorIds.has(p.wedding_vendor_id)).map((p) => p.amount))
    const committed =
      actual +
      sum(catVendors.map(vendorOutstanding)) +
      sum(plannedExpenseRows.filter((e) => e.category_id === c.id).map((e) => e.amount))
    return { id: c.id, name: c.name, planned: c.planned_amount, actual, committed, isOverBudget: committed > c.planned_amount }
  })

  return {
    budgetTarget: wedding.budget_target,
    totalBudget,
    actualSpent,
    contractTotal,
    paidToVendors,
    outstandingBills,
    plannedExpenses,
    remainingBudget: totalBudget - actualSpent,
    availableFunds: wedding.available_funds,
    cashOnHand,
    unallocatedFunds: cashOnHand - outstandingBills - plannedExpenses,
    allocationGap: totalBudget - wedding.budget_target,
    categories: categorySummaries,
  }
}

export type DuePayment = Pick<Payment, 'id' | 'amount' | 'due_date' | 'wedding_vendor_id'> & { daysLeft: number }

/** Pembayaran terjadwal yang jatuh tempo dalam `withinDays` hari (termasuk yang terlambat). */
export function upcomingPayments(
  payments: FinanceInput['payments'],
  today: Date = new Date(),
  withinDays = 30,
): DuePayment[] {
  return payments
    .filter((p): p is typeof p & { due_date: string } => p.status === 'scheduled' && p.due_date != null)
    .map((p) => ({ ...p, daysLeft: daysBetween(today, parseDateOnly(p.due_date)) }))
    .filter((p) => p.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

/** Persentase aman untuk progress bar (0–100). */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)))
}

/** Kebutuhan tabungan per bulan untuk menutup kekurangan dana sebelum tanggal acara. */
export function monthlySavingNeeded(shortfall: number, weddingDate: string | null, today: Date = new Date()): number | null {
  if (shortfall <= 0 || !weddingDate) return null
  const days = daysBetween(today, parseDateOnly(weddingDate))
  if (days <= 0) return null
  const months = Math.max(1, Math.ceil(days / 30))
  return Math.ceil(shortfall / months)
}
