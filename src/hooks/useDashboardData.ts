import { useCallback, useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { getDynamicDemoDashboardData } from '@/lib/demoStore'
import type { FinanceInput } from '@/lib/finance'
import type { Task, WeddingVendor } from '@/lib/database.types'

export type DashboardTask = Pick<Task, 'id' | 'title' | 'status' | 'due_date' | 'priority' | 'is_archived'>
export type DashboardVendor = FinanceInput['vendors'][number] & Pick<WeddingVendor, 'custom_name'>

export type DashboardData = Omit<FinanceInput, 'wedding' | 'vendors'> & {
  vendors: DashboardVendor[]
  tasks: DashboardTask[]
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: DashboardData }

/** Ambil hanya kolom yang dibutuhkan ringkasan dashboard; semua difilter RLS + wedding_id. */
export function useDashboardData(weddingId: string) {
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      setState({ status: 'ready', data: getDynamicDemoDashboardData(demo.id) })
      return
    }

    setState({ status: 'loading' })
    const client = db()

    const [categories, expenses, vendors, payments, tasks] = await Promise.all([
      client.from('budget_categories').select('id, name, planned_amount, is_archived, is_reserve').eq('wedding_id', weddingId).order('sort_order'),
      client.from('expenses').select('category_id, amount, status').eq('wedding_id', weddingId),
      client.from('wedding_vendors').select('id, category_id, status, contract_amount, custom_name').eq('wedding_id', weddingId),
      client.from('payments').select('id, wedding_vendor_id, amount, status, due_date').eq('wedding_id', weddingId),
      client
        .from('tasks')
        .select('id, title, status, due_date, priority, is_archived')
        .eq('wedding_id', weddingId)
        .eq('is_archived', false)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(500),
    ])
    if (categories.error || expenses.error || vendors.error || payments.error || tasks.error) {
      setState({ status: 'error' })
      return
    }
    setState({
      status: 'ready',
      data: {
        categories: categories.data,
        expenses: expenses.data,
        vendors: vendors.data,
        payments: payments.data,
        tasks: tasks.data,
      },
    })
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])

  return { state, reload: load }
}
