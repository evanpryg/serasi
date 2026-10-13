import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  clearDemoSession,
  createMockSession,
  getCurrentDemoAccount,
  setDemoSession,
  type DemoAccountId,
} from '@/lib/demoData'
import type { MemberSide } from '@/lib/database.types'
import { applySideTheme } from '@/lib/side'

type AuthState = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  /** true setelah user membuka link reset password dari email. */
  recovering: boolean
  isDemo: boolean
  signOut: () => Promise<void>
  /** side: buka demo sebagai CPP (default) atau CPW */
  signInDemo: (id: DemoAccountId, side?: MemberSide) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const demo = getCurrentDemoAccount()
    if (demo) return createMockSession(demo.user)
    return null
  })
  const [loading, setLoading] = useState(() => {
    const demo = getCurrentDemoAccount()
    if (demo) return false
    return isSupabaseConfigured
  })
  const [recovering, setRecovering] = useState(false)

  const isDemo = Boolean(getCurrentDemoAccount())

  useEffect(() => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      setSession(createMockSession(demo.user))
      setLoading(false)
      return
    }

    if (!supabase) return
    let active = true

    // getSession menunggu inisialisasi client, termasuk penukaran ?code= (PKCE) di URL callback.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      // Jika demo aktif saat getSession selesai, jangan timpa
      if (getCurrentDemoAccount()) return
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return
      if (getCurrentDemoAccount()) return
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') setRecovering(false)
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    clearDemoSession()
    applySideTheme(null)
    if (supabase) {
      await supabase.auth.signOut().catch(() => {})
    }
    setSession(null)
  }, [])

  const signInDemo = useCallback((id: DemoAccountId, side: MemberSide = 'cpp') => {
    const account = setDemoSession(id, side)
    const mock = createMockSession(account.user)
    setSession(mock)
    setLoading(false)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      configured: isSupabaseConfigured || isDemo,
      loading,
      session,
      user: session?.user ?? null,
      recovering,
      isDemo,
      signOut,
      signInDemo,
    }),
    [loading, session, recovering, isDemo, signOut, signInDemo],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
