import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Crown, Sparkles, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PasswordField, TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { Badge } from '@/components/ui/Card'
import { db } from '@/lib/supabase'
import { isSafeAppPath } from '@/lib/config'
import { authErrorMessage } from '@/auth/authErrors'
import { useAuth } from '@/auth/AuthProvider'
import { DEMO_ACCOUNTS, getDemoAccountIdByEmail, type DemoAccountId } from '@/lib/demoData'
import { AuthLayout } from './AuthLayout'

const schema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi.').email('Format email belum benar.'),
  password: z.string().min(1, 'Password wajib diisi.'),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInDemo } = useAuth()
  const from = (location.state as { from?: string } | null)?.from
  const target = isSafeAppPath(from) ? from : '/app/dashboard'
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  function handleQuickDemo(id: DemoAccountId) {
    signInDemo(id)
    navigate('/app/dashboard', { replace: true })
  }

  async function onSubmit(values: Values) {
    setError(null)

    // Cek apakah akun demo dimasukkan secara manual
    const demoId = getDemoAccountIdByEmail(values.email)
    if (demoId) {
      handleQuickDemo(demoId)
      return
    }

    const { error: err } = await db().auth.signInWithPassword(values)
    if (err) return setError(authErrorMessage(err))
    navigate(target, { replace: true })
  }

  return (
    <AuthLayout
      title="Selamat datang kembali"
      subtitle="Masuk untuk melanjutkan rencana pernikahanmu."
      footer={
        <>
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Daftar gratis
          </Link>
        </>
      }
    >
      {/* KOTAK AKUN DEMO CEPAT (1-KLIK) */}
      <div className="mb-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold-soft/50 via-surface to-amber-500/10 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-text">
          <Sparkles className="size-3.5" aria-hidden />
          <span>Akses Langsung: Akun Demo Siap Pakai</span>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Pilih salah satu akun demo di bawah untuk login langsung tanpa registrasi. Kamu bisa bebas mengisi pengeluaran, vendor, tamu, checklist, hingga rundown secara riil:
        </p>

        <div className="mt-3.5 space-y-2.5">
          {/* Demo 1: Gratis */}
          <button
            type="button"
            onClick={() => handleQuickDemo('demo-gratis')}
            className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-surface p-3 text-left transition hover:border-primary hover:bg-primary-soft/30 hover:shadow-sm"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-bold text-ink group-hover:text-primary">
                  {DEMO_ACCOUNTS['demo-gratis'].label}
                </span>
                <Badge tone="primary" className="text-[0.65rem] py-0 px-1.5">
                  Gratis
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-ink-muted">
                {DEMO_ACCOUNTS['demo-gratis'].description}
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-primary underline-offset-2 group-hover:underline">
              Masuk →
            </span>
          </button>

          {/* Demo 2: Berbayar */}
          <button
            type="button"
            onClick={() => handleQuickDemo('demo-premium')}
            className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-surface p-3 text-left transition hover:border-amber-500 hover:bg-amber-100/40 hover:shadow-sm"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-amber-600 shrink-0" aria-hidden />
                <span className="text-sm font-bold text-ink group-hover:text-amber-900">
                  {DEMO_ACCOUNTS['demo-premium'].label}
                </span>
                <Badge tone="gold" className="text-[0.65rem] py-0 px-1.5 bg-amber-500 text-white">
                  👑 Premium
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-ink-muted">
                {DEMO_ACCOUNTS['demo-premium'].description}
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-amber-700 underline-offset-2 group-hover:underline">
              Masuk →
            </span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-[0.7rem] text-ink-subtle">
          <span>Password demo: bebas (misal: <code>demo1234</code>)</span>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'demo.gratis@serasi.app')
              setValue('password', 'demo1234')
            }}
            className="text-primary hover:underline cursor-pointer"
          >
            Isi ke form
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="-mt-2 text-right">
          <Link to="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
            Lupa password?
          </Link>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Masuk
        </Button>
      </form>
    </AuthLayout>
  )
}
