import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { db } from '@/lib/supabase'
import { authErrorMessage } from '@/auth/authErrors'
import { AuthLayout } from './AuthLayout'

const schema = z.object({ email: z.string().trim().min(1, 'Email wajib diisi.').email('Format email belum benar.') })
type Values = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  async function onSubmit({ email }: Values) {
    setError(null)
    const { error: err } = await db().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    // Rate limit ditampilkan; error lain disamarkan agar tidak membocorkan email terdaftar.
    if (err && authErrorMessage(err).startsWith('Terlalu banyak')) return setError(authErrorMessage(err))
    setSent(true)
  }

  return (
    <AuthLayout
      title="Atur ulang password"
      subtitle="Masukkan email akunmu. Kami akan mengirim link untuk membuat password baru."
      footer={
        <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Kembali ke halaman masuk
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success" title="Periksa email kamu">
          Jika email tersebut terdaftar, link atur ulang password sudah dikirim. Buka link itu di browser ini.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Kirim link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
