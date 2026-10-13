import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PasswordField, TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { db } from '@/lib/supabase'
import { authErrorMessage } from '@/auth/authErrors'
import { AuthLayout, Divider } from './AuthLayout'
import { GoogleButton } from './GoogleButton'

export const passwordRule = z
  .string()
  .min(8, 'Password minimal 8 karakter.')
  .max(72, 'Password maksimal 72 karakter.')
  .regex(/[A-Za-z]/, 'Password harus mengandung huruf.')
  .regex(/\d/, 'Password harus mengandung angka.')

const schema = z.object({
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(120, 'Nama terlalu panjang.'),
  email: z.string().trim().min(1, 'Email wajib diisi.').email('Format email belum benar.'),
  password: passwordRule,
})
type Values = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  async function onSubmit({ fullName, email, password }: Values) {
    setError(null)
    const { data, error: err } = await db().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (err) return setError(authErrorMessage(err))
    // Konfirmasi email nonaktif → sesi langsung ada → onboarding.
    if (data.session) return navigate('/onboarding', { replace: true })
    setSentTo(email)
  }

  if (sentTo) {
    return (
      <AuthLayout title="Cek email kamu" subtitle={<>Kami mengirim link konfirmasi ke <strong className="text-ink">{sentTo}</strong>.</>}>
        <div className="space-y-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <MailCheck className="size-7" aria-hidden />
          </div>
          <p className="text-ink-muted">
            Buka link tersebut di browser ini untuk mengaktifkan akun. Jika email tidak muncul dalam beberapa menit, periksa folder
            spam. Jika email ini sudah pernah terdaftar, silakan masuk atau gunakan fitur lupa password.
          </p>
          <Link to="/login" className="inline-block font-semibold text-primary underline-offset-4 hover:underline">
            Kembali ke halaman masuk
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Mulai rencanakan pernikahan"
      subtitle="Gratis. Tidak perlu kartu kredit."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <GoogleButton />
      <Divider label="atau dengan email" />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <TextField label="Nama lengkap" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          hint="Minimal 8 karakter, berisi huruf dan angka."
          error={errors.password?.message}
          {...register('password')}
        />
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Daftar gratis
        </Button>
        <p className="text-center text-xs text-ink-subtle">
          Dengan mendaftar, kamu menyetujui{' '}
          <Link to="/syarat" className="underline underline-offset-2 hover:text-ink">Syarat Penggunaan</Link> dan{' '}
          <Link to="/privasi" className="underline underline-offset-2 hover:text-ink">Kebijakan Privasi</Link>.
        </p>
      </form>
    </AuthLayout>
  )
}
