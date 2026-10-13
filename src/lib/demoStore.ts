import type {
  BudgetCategory,
  DeepTalkAnswer,
  Expense,
  Guest,
  Payment,
  PersonalityResult,
  RundownItem,
  Task,
  Wedding,
  WeddingVendor,
} from './database.types'
import { DEMO_ACCOUNTS, type DemoAccountId } from './demoData'
import type { DashboardData } from '@/hooks/useDashboardData'

// Keys untuk localStorage
const keyWedding = (id: DemoAccountId) => `serasi:demo_wedding_${id}`
const keyBudget = (id: DemoAccountId) => `serasi:demo_budget_${id}`
const keyVendors = (id: DemoAccountId) => `serasi:demo_vendors_${id}`
const keyGuests = (id: DemoAccountId) => `serasi:demo_guests_${id}`
const keyRundown = (id: DemoAccountId) => `serasi:demo_rundown_${id}`
const keyPersonality = (id: DemoAccountId) => `serasi:demo_personality_${id}`
const keyDeepTalk = (id: DemoAccountId) => `serasi:demo_deeptalk_${id}`
const keyTasks = (id: DemoAccountId) => `serasi:checklist_${id}`

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// 1. WEDDING PROFILE
// ---------------------------------------------------------------------------
export function getDemoWedding(demoId: DemoAccountId): Wedding {
  const initial = DEMO_ACCOUNTS[demoId]?.wedding
  return getStored<Wedding>(keyWedding(demoId), initial)
}

export function updateDemoWedding(demoId: DemoAccountId, updates: Partial<Wedding>): Wedding {
  const curr = getDemoWedding(demoId)
  const next: Wedding = { ...curr, ...updates, updated_at: new Date().toISOString() }
  setStored(keyWedding(demoId), next)
  return next
}

// ---------------------------------------------------------------------------
// 2. BUDGET (Categories, Expenses, Payments)
// ---------------------------------------------------------------------------
type BudgetStore = {
  categories: BudgetCategory[]
  expenses: Expense[]
  payments: Payment[]
}

export function getDemoBudget(demoId: DemoAccountId): BudgetStore {
  const account = DEMO_ACCOUNTS[demoId]
  const initial: BudgetStore = {
    categories: account?.categories ?? [],
    expenses: account?.expenses ?? [],
    payments: account?.payments ?? [],
  }
  return getStored<BudgetStore>(keyBudget(demoId), initial)
}

export function saveDemoBudget(demoId: DemoAccountId, store: BudgetStore): void {
  setStored(keyBudget(demoId), store)
}

export function addDemoCategory(demoId: DemoAccountId, cat: Omit<BudgetCategory, 'id' | 'created_at' | 'updated_at'>): BudgetCategory {
  const current = getDemoBudget(demoId)
  const newCat: BudgetCategory = {
    ...cat,
    id: `cat_demo_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const next = { ...current, categories: [...current.categories, newCat] }
  saveDemoBudget(demoId, next)
  return newCat
}

export function addDemoExpense(demoId: DemoAccountId, exp: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Expense {
  const current = getDemoBudget(demoId)
  const newExp: Expense = {
    ...exp,
    id: `exp_demo_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const next = { ...current, expenses: [newExp, ...current.expenses] }
  saveDemoBudget(demoId, next)
  return newExp
}

export function deleteDemoExpense(demoId: DemoAccountId, expId: string): void {
  const current = getDemoBudget(demoId)
  const next = { ...current, expenses: current.expenses.filter((e) => e.id !== expId) }
  saveDemoBudget(demoId, next)
}

// ---------------------------------------------------------------------------
// 3. VENDORS
// ---------------------------------------------------------------------------
export function getDemoVendors(demoId: DemoAccountId): WeddingVendor[] {
  const initial = DEMO_ACCOUNTS[demoId]?.vendors ?? []
  return getStored<WeddingVendor[]>(keyVendors(demoId), initial)
}

export function saveDemoVendors(demoId: DemoAccountId, list: WeddingVendor[]): void {
  setStored(keyVendors(demoId), list)
}

export function addDemoVendor(demoId: DemoAccountId, vendor: Omit<WeddingVendor, 'id' | 'created_at' | 'updated_at'>): WeddingVendor {
  const current = getDemoVendors(demoId)
  const newVendor: WeddingVendor = {
    ...vendor,
    id: `v_demo_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const next = [newVendor, ...current]
  saveDemoVendors(demoId, next)
  return newVendor
}

export function updateDemoVendorStatus(demoId: DemoAccountId, vendorId: string, status: WeddingVendor['status']): void {
  const current = getDemoVendors(demoId)
  const next = current.map((v) => (v.id === vendorId ? { ...v, status, updated_at: new Date().toISOString() } : v))
  saveDemoVendors(demoId, next)
}

export function deleteDemoVendor(demoId: DemoAccountId, vendorId: string): void {
  const current = getDemoVendors(demoId)
  const next = current.filter((v) => v.id !== vendorId)
  saveDemoVendors(demoId, next)
}

// ---------------------------------------------------------------------------
// 4. GUESTS
// ---------------------------------------------------------------------------
export function getDemoGuests(demoId: DemoAccountId): Guest[] {
  const initial = DEMO_ACCOUNTS[demoId]?.guests ?? []
  return getStored<Guest[]>(keyGuests(demoId), initial)
}

export function saveDemoGuests(demoId: DemoAccountId, list: Guest[]): void {
  setStored(keyGuests(demoId), list)
}

export function addDemoGuest(demoId: DemoAccountId, guest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>): Guest {
  const current = getDemoGuests(demoId)
  const newGuest: Guest = {
    ...guest,
    id: `g_demo_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const next = [newGuest, ...current]
  saveDemoGuests(demoId, next)
  return newGuest
}

export function updateDemoGuest(demoId: DemoAccountId, guestId: string, updates: Partial<Guest>): void {
  const current = getDemoGuests(demoId)
  const next = current.map((g) => (g.id === guestId ? { ...g, ...updates, updated_at: new Date().toISOString() } : g))
  saveDemoGuests(demoId, next)
}

export function deleteDemoGuest(demoId: DemoAccountId, guestId: string): void {
  const current = getDemoGuests(demoId)
  const next = current.filter((g) => g.id !== guestId)
  saveDemoGuests(demoId, next)
}

// ---------------------------------------------------------------------------
// 5. RUNDOWN
// ---------------------------------------------------------------------------
export function getDemoRundown(demoId: DemoAccountId): RundownItem[] {
  const initial = DEMO_ACCOUNTS[demoId]?.rundown ?? []
  return getStored<RundownItem[]>(keyRundown(demoId), initial)
}

export function saveDemoRundown(demoId: DemoAccountId, list: RundownItem[]): void {
  setStored(keyRundown(demoId), list)
}

export function addDemoRundownItem(demoId: DemoAccountId, item: Omit<RundownItem, 'id' | 'created_at' | 'updated_at'>): RundownItem {
  const current = getDemoRundown(demoId)
  const newItem: RundownItem = {
    ...item,
    id: `rd_demo_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const next = [...current, newItem].sort((a, b) => a.sort_order - b.sort_order)
  saveDemoRundown(demoId, next)
  return newItem
}

export function deleteDemoRundownItem(demoId: DemoAccountId, itemId: string): void {
  const current = getDemoRundown(demoId)
  const next = current.filter((r) => r.id !== itemId)
  saveDemoRundown(demoId, next)
}

// ---------------------------------------------------------------------------
// 6. PERSONALITY
// ---------------------------------------------------------------------------
type PersonalityStore = {
  results: PersonalityResult[]
  completedBy: string[]
}

export function getDemoPersonality(demoId: DemoAccountId): PersonalityStore {
  const initial = DEMO_ACCOUNTS[demoId]?.personalityData ?? { results: [], completedBy: [] }
  return getStored<PersonalityStore>(keyPersonality(demoId), initial)
}

export function saveDemoPersonalityResult(
  demoId: DemoAccountId,
  weddingId: string,
  userId: string,
  typeCode: PersonalityResult['type_code'],
  scores: PersonalityResult['scores'],
  answers: PersonalityResult['answers'],
): PersonalityResult {
  const current = getDemoPersonality(demoId)
  const existingIdx = current.results.findIndex((r) => r.user_id === userId)
  const newRow: PersonalityResult = {
    wedding_id: weddingId,
    user_id: userId,
    type_code: typeCode,
    scores,
    answers,
    completed_at: new Date().toISOString(),
  }

  const nextResults = [...current.results]
  if (existingIdx >= 0) {
    nextResults[existingIdx] = newRow
  } else {
    nextResults.push(newRow)
  }

  const nextCompletedBy = Array.from(new Set([...current.completedBy, userId]))
  setStored<PersonalityStore>(keyPersonality(demoId), {
    results: nextResults,
    completedBy: nextCompletedBy,
  })
  return newRow
}

// ---------------------------------------------------------------------------
// 7. DEEP TALK
// ---------------------------------------------------------------------------
type DeepTalkStore = {
  answers: DeepTalkAnswer[]
}

export function getDemoDeepTalk(demoId: DemoAccountId): { answers: DeepTalkAnswer[]; answered: Set<string> } {
  const initial = DEMO_ACCOUNTS[demoId]?.deepTalkData?.answers ?? []
  const store = getStored<DeepTalkStore>(keyDeepTalk(demoId), { answers: initial })
  const answeredSet = new Set<string>()
  for (const a of store.answers) {
    answeredSet.add(`${a.user_id}:${a.question_id}`)
  }
  return { answers: store.answers, answered: answeredSet }
}

export function saveDemoDeepTalkAnswer(
  demoId: DemoAccountId,
  weddingId: string,
  userId: string,
  questionId: string,
  answerText: string,
  alignment: DeepTalkAnswer['alignment'] = null,
): DeepTalkAnswer {
  const current = getDemoDeepTalk(demoId)
  const existingIdx = current.answers.findIndex((a) => a.user_id === userId && a.question_id === questionId)
  const newRow: DeepTalkAnswer = {
    wedding_id: weddingId,
    user_id: userId,
    question_id: questionId,
    answer: answerText,
    alignment: alignment ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const nextAnswers = [...current.answers]
  if (existingIdx >= 0) {
    nextAnswers[existingIdx] = newRow
  } else {
    nextAnswers.push(newRow)
  }

  setStored<DeepTalkStore>(keyDeepTalk(demoId), { answers: nextAnswers })
  return newRow
}

// ---------------------------------------------------------------------------
// 8. DYNAMIC DASHBOARD DATA GENERATOR FOR DEMO ACCOUNTS
// ---------------------------------------------------------------------------
export function getDynamicDemoDashboardData(demoId: DemoAccountId): DashboardData {
  const budget = getDemoBudget(demoId)
  const vendors = getDemoVendors(demoId)
  const tasksRaw = getStored<Task[]>(keyTasks(demoId), DEMO_ACCOUNTS[demoId]?.tasks ?? [])

  return {
    categories: budget.categories.map((c) => ({
      id: c.id,
      name: c.name,
      planned_amount: c.planned_amount,
      is_archived: c.is_archived,
      is_reserve: c.is_reserve,
    })),
    expenses: budget.expenses.map((e) => ({
      category_id: e.category_id,
      amount: e.amount,
      status: e.status,
    })),
    vendors: vendors.map((v) => ({
      id: v.id,
      category_id: v.category_id,
      status: v.status,
      contract_amount: v.contract_amount,
      custom_name: v.custom_name,
    })),
    payments: budget.payments.map((p) => ({
      id: p.id,
      wedding_vendor_id: p.wedding_vendor_id,
      amount: p.amount,
      status: p.status,
      due_date: p.due_date,
    })),
    tasks: tasksRaw.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      due_date: t.due_date,
      priority: t.priority,
      is_archived: t.is_archived,
    })),
  }
}
