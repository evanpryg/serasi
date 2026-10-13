import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { db } from '@/lib/supabase'
import { authErrorMessage, rememberPostAuthPath } from '@/auth/authErrors'
import { isSafeAppPath } from '@/lib/config'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.8-.07-1.57-.2-2.3H12v4.35h6.45a5.5 5.5 0 0 1-2.4 3.62v3h3.88c2.27-2.1 3.57-5.18 3.57-8.67z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3a7.2 7.2 0 0 1-10.73-3.78H1.32v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.33 14.32a7.2 7.2 0 0 1 0-4.64V6.58H1.32a12 12 0 0 0 0 10.84z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 1.32 6.58l4.01 3.1A7.15 7.15 0 0 1 12 4.75z" />
    </svg>
  )
}

export function GoogleButton({ redirectAfter }: { redirectAfter?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    rememberPostAuthPath(isSafeAppPath(redirectAfter) ? redirectAfter : undefined)
    // redirectTo harus terdaftar di Supabase → Authentication → URL Configuration.
    const { error: err } = await db().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (err) {
      setError(authErrorMessage(err))
      setLoading(false)
    }
    // Jika sukses, browser berpindah ke halaman Google; loading dibiarkan aktif.
  }

  return (
    <div className="space-y-3">
      <Button variant="secondary" size="lg" className="w-full" loading={loading} icon={<GoogleIcon />} onClick={handleClick}>
        Lanjutkan dengan Google
      </Button>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  )
}
