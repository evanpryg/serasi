import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { PasswordField } from '@/components/ui/Field'
import { Alert, FullPageSpinner } from '@/components/ui/Feedback'
import { SetupNotice } from '@/components/layout/SetupNotice'
import { db } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import { authErrorMessage } from '@/auth/authErrors'
import { setFlash } from '@/lib/flash'
import { AuthLayout } from './AuthLayout'
import { passwordRule } from './RegisterPage'

const schema = z
  .object({ password: passwordRule, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Konfirmasi password tidak sama.' })
type Values = z.infer<typeof schema>

export function ResetPasswordPage() {
  const { configured, loading, session } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  if (!configured) return <SetupNotice />
  if (loading) return <FullPageSpinner label="Memverifikasi link…" />

  async function onSubmit({ password }: Values) {
    setError(null)
    const { error: err } = await db().auth.updateUser({ password })
    if (err) return setError(authErrorMessage(err))
    setFlash('Password berhasil diperbarui.')
    navigate('/app/dashboard', { replace: true })
  }

  return (
    <AuthLayout title="Buat password baru">
      {!session ? (
        <div className="space-y-4">
          <Alert tone="warning" title="Link tidak valid atau sudah kedaluwarsa">
            Minta link baru dan buka di browser yang sama dengan tempat kamu memintanya.
          </Alert>
          <Link to="/forgot-password" className="inline-block font-semibold text-primary underline-offset-4 hover:underline">
            Minta link baru
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <PasswordField
            label="Password baru"
            autoComplete="new-password"
            hint="Minimal 8 karakter, berisi huruf dan angka."
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordField label="Ulangi password baru" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Simpan password
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
