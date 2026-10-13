import { useCallback, useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { addDemoSavings, deleteDemoSavings, getDemoSavings, updateDemoSavings } from '@/lib/demoStore'
import { useWorkspace } from '@/auth/WorkspaceProvider'
import type { SavingsEntry } from '@/lib/database.types'

type Load<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T }

export type SavingsInput = { amount: number; saved_on: string; note: string | null }

/**
 * Setoran tabungan bersama. Setiap perubahan juga menggeser `available_funds` di database
 * (trigger), jadi workspace di-refresh agar Anggaran & Dashboard langsung memakai angka baru.
 */
export function useSavingsData(weddingId: string) {
  const { me, refresh } = useWorkspace()
  const [state, setState] = useState<Load<SavingsEntry[]>>({ status: 'loading' })

  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      setState({ status: 'ready', data: getDemoSavings(demo.id) })
      return
    }
    const { data, error } = await db()
      .from('savings_entries')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('saved_on', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) return setState({ status: 'error' })
    setState({ status: 'ready', data: data ?? [] })
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])

  /** Melempar error bila gagal, supaya form bisa menampilkan pesan. */
  const addEntry = useCallback(
    async (input: SavingsInput): Promise<SavingsEntry> => {
      if (!me) throw new Error('Belum masuk')
      const demo = getCurrentDemoAccount()
      let row: SavingsEntry
      if (demo) {
        row = addDemoSavings(demo.id, { wedding_id: weddingId, user_id: me.userId, ...input })
      } else {
        const { data, error } = await db()
          .from('savings_entries')
          .insert({ wedding_id: weddingId, ...input })
          .select()
          .single()
        if (error || !data) throw error ?? new Error('Gagal menyimpan')
        row = data
      }
      setState((curr) => (curr.status === 'ready' ? { status: 'ready', data: [row, ...curr.data] } : curr))
      await refresh()
      return row
    },
    [weddingId, me, refresh],
  )

  const updateEntry = useCallback(
    async (id: string, input: SavingsInput) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        updateDemoSavings(demo.id, id, input)
      } else {
        const { error } = await db().from('savings_entries').update(input).eq('id', id)
        if (error) throw error
      }
      setState((curr) =>
        curr.status === 'ready' ? { status: 'ready', data: curr.data.map((e) => (e.id === id ? { ...e, ...input } : e)) } : curr,
      )
      await refresh()
    },
    [refresh],
  )

  const deleteEntry = useCallback(
    async (id: string) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        deleteDemoSavings(demo.id, id)
      } else {
        const { error } = await db().from('savings_entries').delete().eq('id', id)
        if (error) {
          void load()
          throw error
        }
      }
      setState((curr) => (curr.status === 'ready' ? { status: 'ready', data: curr.data.filter((e) => e.id !== id) } : curr))
      await refresh()
    },
    [load, refresh],
  )

  return { state, reload: load, addEntry, updateEntry, deleteEntry }
}
