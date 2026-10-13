import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner, ErrorState } from '@/components/ui/Feedback'
import { SetupNotice } from '@/components/layout/SetupNotice'
import { useAuth } from './AuthProvider'
import { WorkspaceProvider, useWorkspace } from './WorkspaceProvider'

/** Semua route privat: wajib sesi valid. */
export function RequireAuth() {
  const { configured, loading, session } = useAuth()
  const location = useLocation()
  if (!configured) return <SetupNotice />
  if (loading) return <FullPageSpinner label="Memeriksa sesi…" />
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return (
    <WorkspaceProvider>
      <Outlet />
    </WorkspaceProvider>
  )
}

function WorkspaceGate({ children, mode }: { children: ReactNode; mode: 'require' | 'onboarding' }) {
  const { loading, error, wedding, refresh } = useWorkspace()
  if (loading) return <FullPageSpinner label="Menyiapkan workspace…" />
  if (error)
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <ErrorState message={error} onRetry={() => void refresh()} />
      </div>
    )
  if (mode === 'require' && !wedding) return <Navigate to="/onboarding" replace />
  if (mode === 'onboarding' && wedding) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}

/** /app/*: user harus sudah punya workspace pernikahan. */
export function RequireWorkspace() {
  return (
    <WorkspaceGate mode="require">
      <Outlet />
    </WorkspaceGate>
  )
}

/** /onboarding: hanya untuk user yang belum punya workspace. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  return <WorkspaceGate mode="onboarding">{children}</WorkspaceGate>
}

/** /login, /register: user yang sudah login langsung diteruskan. */
export function GuestOnly() {
  const { configured, loading, session } = useAuth()
  if (!configured) return <SetupNotice />
  if (loading) return <FullPageSpinner />
  if (session) return <Navigate to="/app/dashboard" replace />
  return <Outlet />
}
