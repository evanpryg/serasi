import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Alert, FullPageSpinner } from '@/components/ui/Feedback'
import { SetupNotice } from '@/components/layout/SetupNotice'
import { useAuth } from '@/auth/AuthProvider'
import { consumePostAuthPath } from '@/auth/authErrors'
import { isSafeAppPath } from '@/lib/config'
import { AuthLayout } from './AuthLayout'

/** Ambil pesan error dari query (?error=) maupun hash (#error=) hasil redirect provider. */
function readProviderError(): string | null {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const err = search.get('error') ?? hash.get('error')
  if (!err) return null
  if (err === 'access_denied') return 'Login dibatalkan atau izin tidak diberikan.'
  return 'Login tidak dapat diselesaikan. Silakan coba lagi.'
}

/**
 * Tujuan redirect OAuth & konfirmasi email.
 * Penukaran kode PKCE dilakukan otomatis oleh Supabase client (detectSessionInUrl);
 * halaman ini hanya menunggu sesi lalu mengarahkan pengguna.
 */
export function AuthCallbackPage() {
  const { configured, loading, session } = useAuth()
  const navigate = useNavigate()
  const [providerError] = useState(readProviderError)

  useEffect(() => {
    if (loading || providerError || !session) return
    const saved = consumePostAuthPath()
    // Guard /app/* akan meneruskan pengguna baru ke /onboarding.
    navigate(isSafeAppPath(saved) ? saved : '/app/dashboard', { replace: true })
  }, [loading, session, providerError, navigate])

  if (!configured) return <SetupNotice />
  if (loading || (session && !providerError)) return <FullPageSpinner label="Menyelesaikan login…" />

  return (
    <AuthLayout title="Login belum berhasil">
      <div className="space-y-4">
        <Alert tone="danger">{providerError ?? 'Sesi tidak ditemukan. Link mungkin sudah kedaluwarsa atau dibuka di browser lain.'}</Alert>
        <Link to="/login" className="inline-block font-semibold text-primary underline-offset-4 hover:underline">
          Kembali ke halaman masuk
        </Link>
      </div>
    </AuthLayout>
  )
}
