import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MemberRole, MemberSide, Wedding } from '@/lib/database.types'
import { db } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { getDemoMembers, getDemoWedding, setDemoMySide } from '@/lib/demoStore'
import { applySideTheme, isMemberSide, sortCouple } from '@/lib/side'
import { useAuth } from './AuthProvider'


export type Member = {
  userId: string
  role: MemberRole
  /** null = belum memilih CPP/CPW (akun lama) */
  side: MemberSide | null
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
  /** Kedua anggota, CPP lebih dulu (urutan tampil di avatar & nama). */
  couple: Member[]
  /** false = kolom peran belum ada di database (migration 000008 belum dijalankan). */
  sidesSupported: boolean
  setMySide: (side: MemberSide) => Promise<void>
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
  const [sidesSupported, setSidesSupported] = useState(true)
  const loadedOnce = useRef(false)

  const load = useCallback(async () => {
    if (!userId) return

    const demo = getCurrentDemoAccount()
    if (demo) {
      setWedding(getDemoWedding(demo.id))
      setMembers(getDemoMembers(demo.id))
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
      // Fallback tanpa kolom side bila migration peran CPP/CPW belum dijalankan.
      let { data: rows, error: mErr } = await client.from('wedding_members').select('user_id, role, side').eq('wedding_id', w.id)
      setSidesSupported(!mErr)
      if (mErr) {
        const legacy = await client.from('wedding_members').select('user_id, role').eq('wedding_id', w.id)
        rows = (legacy.data ?? []).map((r) => ({ ...r, side: null }))
      }
      const ids = (rows ?? []).map((r) => r.user_id)
      const { data: profiles } = ids.length
        ? await client.from('profiles').select('id, full_name, avatar_url').in('id', ids)
        : { data: [] }
      nextMembers = sortCouple((rows ?? [])
        .map((r) => {
          const p = profiles?.find((x) => x.id === r.user_id)
          const isMe = r.user_id === userId
          return {
            userId: r.user_id,
            role: r.role,
            side: isMemberSide(r.side) ? r.side : null,
            name: p?.full_name || (isMe ? fallbackName : 'Pasangan'),
            avatarUrl: p?.avatar_url ?? null,
            isMe,
          }
        }))
    }
    setWedding(w)
    setMembers(nextMembers)
    loadedOnce.current = true
    setLoading(false)
  }, [userId, fallbackName])

  useEffect(() => {
    void load()
  }, [load])

  const setMySide = useCallback(
    async (side: MemberSide) => {
      const demo = getCurrentDemoAccount()
      if (demo) {
        setMembers(sortCouple(setDemoMySide(demo.id, side)))
        return
      }
      const { error: rpcError } = await db().rpc('set_my_side', { p_side: side })
      if (rpcError) throw new Error('Peran gagal disimpan. Coba lagi.')
      await load()
    },
    [load],
  )

  const me = members.find((m) => m.isMe) ?? null
  const mySide = me?.side ?? null

  // Tema mengikuti peran user yang login: CPP biru, CPW pink.
  useEffect(() => {
    if (mySide) applySideTheme(mySide)
  }, [mySide])

  const value = useMemo<WorkspaceState>(
    () => ({
      loading,
      error,
      wedding,
      members,
      me,
      partner: members.find((m) => !m.isMe) ?? null,
      couple: members,
      sidesSupported,
      setMySide,
      refresh: load,
    }),
    [loading, error, wedding, members, me, sidesSupported, setMySide, load],
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
