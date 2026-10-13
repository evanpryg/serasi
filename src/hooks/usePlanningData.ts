import { useCallback, useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { toDateOnly } from '@/lib/format'
import {
  addDemoCategory,
  addDemoExpense,
  addDemoGuest,
  addDemoRundownItem,
  addDemoVendor,
  deleteDemoCategory,
  deleteDemoExpense,
  deleteDemoGuest,
  deleteDemoRundownItem,
  deleteDemoVendor,
  getDemoBudget,
  getDemoGuests,
  getDemoRundown,
  getDemoVendors,
  saveDemoGuests,
  updateDemoCategory,
  updateDemoExpense,
  updateDemoVendorStatus,
} from '@/lib/demoStore'
import type {
  BudgetCategory,
  Expense,
  Guest,
  Payment,
  RundownItem,
  Task,
  WeddingVendor,
} from '@/lib/database.types'

type Load<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T }

// ---------------------------------------------------------------------------
// 1. BUDGET HOOK
// ---------------------------------------------------------------------------
export type BudgetData = {
  categories: BudgetCategory[]
  expenses: Expense[]
  payments: Payment[]
  /** Dibutuhkan calculateFinance agar kontrak vendor & jadwal bayar tidak dihitung ganda. */
  vendors: WeddingVendor[]
}

export type ExpenseInput = {
  title: string
  amount: number
  status?: Expense['status']
  expense_date?: string | null
  link_url?: string | null
  notes?: string | null
}

export type CategoryInput = { name: string; planned_amount: number; notes?: string | null; is_reserve?: boolean }

const todayStr = () => toDateOnly(new Date())

export function useBudgetData(weddingId: string) {
  const [state, setState] = useState<Load<BudgetData>>({ status: 'loading' })

  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      const { categories, expenses, payments } = getDemoBudget(demo.id)
      setState({ status: 'ready', data: { categories, expenses, payments, vendors: getDemoVendors(demo.id) } })
      return
    }

    const client = db()
    const [cats, exps, pays, vends] = await Promise.all([
      client.from('budget_categories').select('*').eq('wedding_id', weddingId).order('sort_order'),
      client.from('expenses').select('*').eq('wedding_id', weddingId).order('expense_date', { ascending: false }),
      client.from('payments').select('*').eq('wedding_id', weddingId).order('due_date', { ascending: true }),
      client.from('wedding_vendors').select('*').eq('wedding_id', weddingId),
    ])

    if (cats.error || exps.error || pays.error || vends.error) {
      setState({ status: 'error' })
      return
    }

    setState({
      status: 'ready',
      data: {
        categories: cats.data ?? [],
        expenses: exps.data ?? [],
        payments: pays.data ?? [],
        vendors: vends.data ?? [],
      },
    })
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])

  /** Perbarui state lokal dulu agar terasa instan; data server dimuat ulang setelahnya. */
  const patchLocal = useCallback((fn: (d: BudgetData) => BudgetData) => {
    setState((s) => (s.status === 'ready' ? { status: 'ready', data: fn(s.data) } : s))
  }, [])

  const createExpense = useCallback(
    async (input: ExpenseInput & { category_id: string }) => {
      const row = {
        wedding_id: weddingId,
        category_id: input.category_id,
        title: input.title,
        amount: input.amount,
        status: input.status ?? 'planned',
        expense_date: input.status === 'paid' ? (input.expense_date ?? todayStr()) : (input.expense_date ?? null),
        link_url: input.link_url ?? null,
        notes: input.notes ?? null,
        fund_source: null,
      }
      const demo = getCurrentDemoAccount()
      if (demo) {
        addDemoExpense(demo.id, { ...row, vendor_id: null, proof_path: null })
        void load()
        return
      }
      const { error } = await db().from('expenses').insert(row)
      void load()
      if (error) throw error
    },
    [weddingId, load],
  )

  const updateExpense = useCallback(
    async (id: string, input: Partial<ExpenseInput>) => {
      const patch: Partial<Expense> = { ...input }
      // Item lunas wajib bertanggal (constraint expenses_paid_has_date).
      if (input.status === 'paid' && !input.expense_date) {
        const current = state.status === 'ready' ? state.data.expenses.find((e) => e.id === id) : undefined
        patch.expense_date = current?.expense_date ?? todayStr()
      }
      patchLocal((d) => ({ ...d, expenses: d.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
      const demo = getCurrentDemoAccount()
      if (demo) {
        updateDemoExpense(demo.id, id, patch)
        return
      }
      const { error } = await db().from('expenses').update(patch).eq('id', id)
      if (error) {
        void load()
        throw error
      }
    },
    [state, patchLocal, load],
  )

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      patchLocal((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== expenseId) }))
      const demo = getCurrentDemoAccount()
      if (demo) {
        deleteDemoExpense(demo.id, expenseId)
        return
      }
      const { error } = await db().from('expenses').delete().eq('id', expenseId)
      if (error) {
        void load()
        throw error
      }
    },
    [patchLocal, load],
  )

  /** Mengembalikan id pos baru agar halaman bisa langsung membukanya. */
  const createCategory = useCallback(
    async (input: CategoryInput): Promise<string> => {
      const nextOrder = state.status === 'ready' ? Math.max(0, ...state.data.categories.map((c) => c.sort_order)) + 1 : 1
      const row = {
        wedding_id: weddingId,
        name: input.name,
        planned_amount: input.planned_amount,
        notes: input.notes ?? null,
        is_reserve: Boolean(input.is_reserve),
        sort_order: nextOrder,
      }
      const demo = getCurrentDemoAccount()
      if (demo) {
        const cat = addDemoCategory(demo.id, { ...row, is_archived: false, template_key: null })
        void load()
        return cat.id
      }
      const { data, error } = await db().from('budget_categories').insert(row).select('id').single()
      if (error) throw error
      await load()
      return data.id
    },
    [weddingId, state, load],
  )

  const updateCategory = useCallback(
    async (id: string, input: Partial<CategoryInput>) => {
      patchLocal((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...input } : c)) }))
      const demo = getCurrentDemoAccount()
      if (demo) {
        updateDemoCategory(demo.id, id, input)
        return
      }
      const { error } = await db().from('budget_categories').update(input).eq('id', id)
      if (error) {
        void load()
        throw error
      }
    },
    [patchLocal, load],
  )

  /** Hapus pos beserta semua itemnya (RPC atomik). Kontrak vendor di pos ini menjadi "tanpa pos". */
  const deleteCategory = useCallback(
    async (id: string) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        deleteDemoCategory(demo.id, id)
        void load()
        return
      }
      const { error } = await db().rpc('delete_budget_category', { p_category_id: id })
      void load()
      if (error) throw error
    },
    [load],
  )

  return { state, reload: load, createExpense, updateExpense, deleteExpense, createCategory, updateCategory, deleteCategory }
}

// ---------------------------------------------------------------------------
// 2. VENDORS HOOK
// ---------------------------------------------------------------------------
export type VendorsData = {
  vendors: WeddingVendor[]
  categories: BudgetCategory[]
}

export function useVendorsData(weddingId: string) {
  const [state, setState] = useState<Load<VendorsData>>({ status: 'loading' })

  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      const vendors = getDemoVendors(demo.id)
      const { categories } = getDemoBudget(demo.id)
      setState({ status: 'ready', data: { vendors, categories } })
      return
    }

    const client = db()
    const [vendors, cats] = await Promise.all([
      client.from('wedding_vendors').select('*').eq('wedding_id', weddingId).order('created_at'),
      client.from('budget_categories').select('*').eq('wedding_id', weddingId).order('sort_order'),
    ])

    if (vendors.error || cats.error) {
      setState({ status: 'error' })
      return
    }

    setState({
      status: 'ready',
      data: {
        vendors: vendors.data ?? [],
        categories: cats.data ?? [],
      },
    })
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])

  const createVendor = useCallback(
    async (input: { custom_name: string; vendor_category: string; category_id?: string | null; contract_amount?: number | null; quoted_amount?: number | null; status?: WeddingVendor['status']; contact_note?: string | null; service_scope?: string | null; notes?: string | null }) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        addDemoVendor(demo.id, {
          wedding_id: weddingId,
          custom_name: input.custom_name,
          vendor_category: input.vendor_category,
          category_id: input.category_id ?? null,
          status: input.status ?? 'kandidat',
          contract_amount: input.contract_amount ?? null,
          quoted_amount: input.quoted_amount ?? null,
          contact_note: input.contact_note ?? null,
          service_scope: input.service_scope ?? null,
          notes: input.notes ?? null,
          vendor_id: null,
          extra_costs_note: null,
        })
        void load()
        return
      }
      const { error } = await db().from('wedding_vendors').insert({
        wedding_id: weddingId,
        custom_name: input.custom_name,
        vendor_category: input.vendor_category,
        category_id: input.category_id ?? null,
        status: input.status ?? 'kandidat',
        contract_amount: input.contract_amount ?? null,
        quoted_amount: input.quoted_amount ?? null,
        contact_note: input.contact_note ?? null,
        service_scope: input.service_scope ?? null,
        notes: input.notes ?? null,
      })
      if (error) void load()
      else void load()
    },
    [weddingId, load],
  )

  const updateVendorStatus = useCallback(
    async (vendorId: string, status: WeddingVendor['status']) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        updateDemoVendorStatus(demo.id, vendorId, status)
        void load()
        return
      }
      const { error } = await db().from('wedding_vendors').update({ status }).eq('id', vendorId)
      if (error) void load()
      else void load()
    },
    [load],
  )

  const deleteVendor = useCallback(
    async (vendorId: string) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        deleteDemoVendor(demo.id, vendorId)
        void load()
        return
      }
      const { error } = await db().from('wedding_vendors').delete().eq('id', vendorId)
      if (error) void load()
      else void load()
    },
    [load],
  )

  return { state, reload: load, createVendor, updateVendorStatus, deleteVendor }
}

// ---------------------------------------------------------------------------
// 3. CHECKLIST / TASKS HOOK
// ---------------------------------------------------------------------------
const getDemoChecklistStorageKey = (demoId: string) => `serasi:checklist_${demoId}`

export function useChecklistData(weddingId: string, _weddingDateStr: string | null = null) {
  const [state, setState] = useState<Load<Task[]>>({ status: 'loading' })

  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      const storageKey = getDemoChecklistStorageKey(demo.id)
      const cached = localStorage.getItem(storageKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Task[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            setState({ status: 'ready', data: parsed })
            return
          }
        } catch {
          // ignore error and re-init
        }
      }

      // Initialize demo tasks
      const initial = demo.tasks && demo.tasks.length > 0 ? [...demo.tasks] : []
      localStorage.setItem(storageKey, JSON.stringify(initial))
      setState({ status: 'ready', data: initial })
      return
    }

    const client = db()
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('wedding_id', weddingId)
      .eq('is_archived', false)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) {
      setState({ status: 'error' })
      return
    }

    setState({ status: 'ready', data: data ?? [] })
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])

  const saveDemoState = useCallback((updater: (prev: Task[]) => Task[]) => {
    const demo = getCurrentDemoAccount()
    if (!demo) return
    const storageKey = getDemoChecklistStorageKey(demo.id)
    setState((curr) => {
      const prevList = curr.status === 'ready' ? curr.data : []
      const nextList = updater(prevList)
      localStorage.setItem(storageKey, JSON.stringify(nextList))
      return { status: 'ready', data: nextList }
    })
  }, [])

  const toggleTask = useCallback(
    async (taskId: string) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        saveDemoState((tasks) =>
          tasks.map((t) => {
            if (t.id !== taskId) return t
            const nextStatus: Task['status'] = t.status === 'done' ? 'todo' : 'done'
            return {
              ...t,
              status: nextStatus,
              completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            }
          }),
        )
        return
      }

      if (state.status !== 'ready') return
      const target = state.data.find((t) => t.id === taskId)
      if (!target) return
      const nextStatus: Task['status'] = target.status === 'done' ? 'todo' : 'done'
      const completedAt = nextStatus === 'done' ? new Date().toISOString() : null

      // Optimistic update
      setState((curr) => {
        if (curr.status !== 'ready') return curr
        return {
          status: 'ready',
          data: curr.data.map((t) => (t.id === taskId ? { ...t, status: nextStatus, completed_at: completedAt } : t)),
        }
      })

      const { error } = await db()
        .from('tasks')
        .update({ status: nextStatus, completed_at: completedAt })
        .eq('id', taskId)

      if (error) void load()
    },
    [state, load, saveDemoState],
  )

  const createTask = useCallback(
    async (taskData: Partial<Task>) => {
      const demo = getCurrentDemoAccount()
      const now = new Date().toISOString()
      const newTask: Task = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        wedding_id: weddingId,
        title: taskData.title?.trim() || 'Tugas Baru',
        category: taskData.category?.trim() || 'Lainnya',
        subcategory: taskData.subcategory?.trim() || null,
        event: taskData.event || 'pernikahan',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || null,
        assignee: taskData.assignee || null,
        notes: taskData.notes || null,
        estimated_cost: taskData.estimated_cost ?? null,
        actual_cost: taskData.actual_cost ?? null,
        quantity: taskData.quantity ?? null,
        unit: taskData.unit ?? null,
        product_url: taskData.product_url ?? null,
        vendor_store_name: taskData.vendor_store_name ?? null,
        item_status: taskData.item_status ?? null,
        is_custom: true,
        is_archived: false,
        sort_order: (state.status === 'ready' ? state.data.length : 0) + 1,
        template_key: null,
        completed_at: taskData.status === 'done' ? now : null,
        created_at: now,
        updated_at: now,
      }

      if (demo) {
        saveDemoState((tasks) => [newTask, ...tasks])
        return newTask
      }

      const client = db()
      const { data, error } = await client.from('tasks').insert(newTask as any).select().single()
      if (error) {
        throw error
      }
      setState((curr) => (curr.status === 'ready' ? { status: 'ready', data: [data as Task, ...curr.data] } : curr))
      return data as Task
    },
    [weddingId, state, saveDemoState],
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      const demo = getCurrentDemoAccount()
      const now = new Date().toISOString()

      if (demo) {
        saveDemoState((tasks) =>
          tasks.map((t) => {
            if (t.id !== taskId) return t
            const nextStatus = updates.status !== undefined ? updates.status : t.status
            const completedAt =
              nextStatus === 'done'
                ? t.completed_at || now
                : null
            return {
              ...t,
              ...updates,
              completed_at: completedAt,
              updated_at: now,
            }
          }),
        )
        return
      }

      // Optimistic update
      setState((curr) => {
        if (curr.status !== 'ready') return curr
        return {
          status: 'ready',
          data: curr.data.map((t) => (t.id === taskId ? { ...t, ...updates, updated_at: now } : t)),
        }
      })

      const client = db()
      const { error } = await client
        .from('tasks')
        .update({ ...updates, updated_at: now } as any)
        .eq('id', taskId)

      if (error) void load()
    },
    [load, saveDemoState],
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        saveDemoState((tasks) => tasks.filter((t) => t.id !== taskId))
        return
      }

      setState((curr) => {
        if (curr.status !== 'ready') return curr
        return {
          status: 'ready',
          data: curr.data.filter((t) => t.id !== taskId),
        }
      })

      const client = db()
      const { error } = await client.from('tasks').delete().eq('id', taskId)
      if (error) void load()
    },
    [load, saveDemoState],
  )

  const duplicateTask = useCallback(
    async (taskId: string) => {
      if (state.status !== 'ready') return
      const original = state.data.find((t) => t.id === taskId)
      if (!original) return

      await createTask({
        ...original,
        title: `${original.title} (Salinan)`,
        template_key: null,
        is_custom: true,
        status: 'todo',
        completed_at: null,
      })
    },
    [state, createTask],
  )

  const resetToTemplates = useCallback(
    async (newTasks: Task[]) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        const storageKey = getDemoChecklistStorageKey(demo.id)
        localStorage.setItem(storageKey, JSON.stringify(newTasks))
        setState({ status: 'ready', data: newTasks })
        return
      }

      const client = db()
      await client.from('tasks').delete().eq('wedding_id', weddingId)
      const { error } = await client.from('tasks').insert(newTasks as any)
      if (error) void load()
      else setState({ status: 'ready', data: newTasks })
    },
    [weddingId, load],
  )

  return {
    state,
    reload: load,
    toggleTask,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    resetToTemplates,
  }
}

// ---------------------------------------------------------------------------
// 4. GUESTS HOOK
// ---------------------------------------------------------------------------
export function useGuestsData(weddingId: string) {
  const [state, setState] = useState<Load<Guest[]>>({ status: 'loading' })

  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      setState({ status: 'ready', data: getDemoGuests(demo.id) })
      return
    }

    const client = db()
    const { data, error } = await client.from('guests').select('*').eq('wedding_id', weddingId).order('name')

    if (error) {
      setState({ status: 'error' })
      return
    }

    setState({ status: 'ready', data: data ?? [] })
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])

  const updateGuestRsvp = useCallback(
    async (guestId: string, rsvp: Guest['rsvp_status']) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        setState((curr) => {
          if (curr.status !== 'ready') return curr
          const next = curr.data.map((g) => (g.id === guestId ? { ...g, rsvp_status: rsvp } : g))
          saveDemoGuests(demo.id, next)
          return { status: 'ready', data: next }
        })
        return
      }

      setState((curr) => {
        if (curr.status !== 'ready') return curr
        return {
          status: 'ready',
          data: curr.data.map((g) => (g.id === guestId ? { ...g, rsvp_status: rsvp } : g)),
        }
      })

      const { error } = await db().from('guests').update({ rsvp_status: rsvp }).eq('id', guestId)
      if (error) void load()
    },
    [load],
  )

  const updateGuestInvitation = useCallback(
    async (guestId: string, invitationStatus: Guest['invitation_status']) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        setState((curr) => {
          if (curr.status !== 'ready') return curr
          const next = curr.data.map((g) => (g.id === guestId ? { ...g, invitation_status: invitationStatus } : g))
          saveDemoGuests(demo.id, next)
          return { status: 'ready', data: next }
        })
        return
      }

      setState((curr) => {
        if (curr.status !== 'ready') return curr
        return {
          status: 'ready',
          data: curr.data.map((g) => (g.id === guestId ? { ...g, invitation_status: invitationStatus } : g)),
        }
      })

      const { error } = await db().from('guests').update({ invitation_status: invitationStatus }).eq('id', guestId)
      if (error) void load()
    },
    [load],
  )

  const createGuest = useCallback(
    async (input: { name: string; group_name?: string | null; guest_count?: number; notes?: string | null }) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        addDemoGuest(demo.id, {
          wedding_id: weddingId,
          name: input.name,
          group_name: input.group_name ?? 'Keluarga',
          guest_count: input.guest_count ?? 1,
          invitation_status: 'belum',
          rsvp_status: 'menunggu',
          notes: input.notes ?? null,
        })
        void load()
        return
      }
      const { error } = await db().from('guests').insert({
        wedding_id: weddingId,
        name: input.name,
        group_name: input.group_name ?? 'Keluarga',
        guest_count: input.guest_count ?? 1,
        invitation_status: 'belum',
        rsvp_status: 'menunggu',
        notes: input.notes ?? null,
      })
      if (error) void load()
      else void load()
    },
    [weddingId, load],
  )

  const deleteGuest = useCallback(
    async (guestId: string) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        deleteDemoGuest(demo.id, guestId)
        void load()
        return
      }
      const { error } = await db().from('guests').delete().eq('id', guestId)
      if (error) void load()
      else void load()
    },
    [load],
  )

  return { state, reload: load, updateGuestRsvp, updateGuestInvitation, createGuest, deleteGuest }
}

// ---------------------------------------------------------------------------
// 5. RUNDOWN HOOK
// ---------------------------------------------------------------------------
export function useRundownData(weddingId: string) {
  const [state, setState] = useState<Load<RundownItem[]>>({ status: 'loading' })

  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      setState({ status: 'ready', data: getDemoRundown(demo.id) })
      return
    }

    const client = db()
    const { data, error } = await client
      .from('rundown_items')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('sort_order', { ascending: true })

    if (error) {
      setState({ status: 'error' })
      return
    }

    setState({ status: 'ready', data: data ?? [] })
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])

  const createRundownItem = useCallback(
    async (input: { title: string; starts_at?: string | null; ends_at?: string | null; location?: string | null; person_in_charge?: string | null; notes?: string | null }) => {
      const demo = getCurrentDemoAccount()
      const nextSort = state.status === 'ready' ? state.data.length + 1 : 1
      if (demo) {
        addDemoRundownItem(demo.id, {
          wedding_id: weddingId,
          title: input.title,
          starts_at: input.starts_at ?? null,
          ends_at: input.ends_at ?? null,
          location: input.location ?? null,
          person_in_charge: input.person_in_charge ?? null,
          sort_order: nextSort,
          notes: input.notes ?? null,
        })
        void load()
        return
      }
      const { error } = await db().from('rundown_items').insert({
        wedding_id: weddingId,
        title: input.title,
        starts_at: input.starts_at ?? null,
        ends_at: input.ends_at ?? null,
        location: input.location ?? null,
        person_in_charge: input.person_in_charge ?? null,
        sort_order: nextSort,
        notes: input.notes ?? null,
      })
      if (error) void load()
      else void load()
    },
    [weddingId, state, load],
  )

  const deleteRundownItem = useCallback(
    async (itemId: string) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        deleteDemoRundownItem(demo.id, itemId)
        void load()
        return
      }
      const { error } = await db().from('rundown_items').delete().eq('id', itemId)
      if (error) void load()
      else void load()
    },
    [load],
  )

  return { state, reload: load, createRundownItem, deleteRundownItem }
}
