import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MemberRole, Wedding } from '@/lib/database.types'
import { db } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { getDemoWedding } from '@/lib/demoStore'
import { useAuth } from './AuthProvider'


export type Member = {
  userId: string
  role: MemberRole
  name: string
  avatarUrl: string | null
  isMe: boolean
}

type WorkspaceState = {
  /** true hanya saat pemuatan pertama; refresh berikutnya berjalan diam-diam. */
  loading: boolean
  error: string | null
  /** null = user belum membuat atau bergabung ke workspace. */
  wedding: Wedding | null
  members: Member[]
  me: Member | null
  partner: Member | null
  refresh: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

/** Nama depan untuk sapaan. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Bergantung pada id, bukan objek user: Supabase membuat objek sesi baru saat token
  // diperbarui / tab kembali aktif, dan itu tidak boleh memicu muat ulang workspace.
  const { user } = useAuth()
  const userId = user?.id
  const fallbackName = String(user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Kamu')
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedOnce = useRef(false)

  const load = useCallback(async () => {
    if (!userId) return

    const demo = getCurrentDemoAccount()
    if (demo) {
      setWedding(getDemoWedding(demo.id))
      setMembers([demo.me, demo.partner])
      loadedOnce.current = true
      setLoading(false)
      return
    }

    if (!loadedOnce.current) setLoading(true)
    setError(null)
    const client = db()
    // RLS: hanya workspace tempat user menjadi anggota yang terbaca (maksimal satu).
    const { data: w, error: wErr } = await client.from('weddings').select('*').maybeSingle()
    if (wErr) {
      if (!loadedOnce.current) setError('Workspace pernikahan gagal dimuat.')
      setLoading(false)
      return
    }

    let nextMembers: Member[] = []
    if (w) {
      const { data: rows } = await client.from('wedding_members').select('user_id, role').eq('wedding_id', w.id)
      const ids = (rows ?? []).map((r) => r.user_id)
      const { data: profiles } = ids.length
        ? await client.from('profiles').select('id, full_name, avatar_url').in('id', ids)
        : { data: [] }
      nextMembers = (rows ?? [])
        .map((r) => {
          const p = profiles?.find((x) => x.id === r.user_id)
          const isMe = r.user_id === userId
          return {
            userId: r.user_id,
            role: r.role,
            name: p?.full_name || (isMe ? fallbackName : r.role === 'owner' ? 'Pasangan' : 'Pasangan'),
            avatarUrl: p?.avatar_url ?? null,
            isMe,
          }
        })
        .sort((a, b) => (a.role === 'owner' ? -1 : 1) - (b.role === 'owner' ? -1 : 1))
    }
    setWedding(w)
    setMembers(nextMembers)
    loadedOnce.current = true
    setLoading(false)
  }, [userId, fallbackName])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<WorkspaceState>(
    () => ({
      loading,
      error,
      wedding,
      members,
      me: members.find((m) => m.isMe) ?? null,
      partner: members.find((m) => !m.isMe) ?? null,
      refresh: load,
    }),
    [loading, error, wedding, members, load],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace harus dipakai di dalam <WorkspaceProvider>')
  return ctx
}

/** Untuk halaman di bawah /app/* yang dijamin punya workspace oleh guard. */
export function useWedding(): Wedding {
  const { wedding } = useWorkspace()
  if (!wedding) throw new Error('Workspace belum tersedia')
  return wedding
}
