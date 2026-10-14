import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { PasswordField, TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { db } from '@/lib/supabase'
import { isSafeAppPath } from '@/lib/config'
import { authErrorMessage } from '@/auth/authErrors'
import { useAuth } from '@/auth/AuthProvider'
import { getDemoAccountIdByEmail, type DemoAccountId } from '@/lib/demoData'
import { type MemberSide } from '@/lib/side'
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
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  function handleQuickDemo(id: DemoAccountId, side: MemberSide = 'cpp') {
    signInDemo(id, side)
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
