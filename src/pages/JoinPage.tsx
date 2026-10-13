import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Heart, LogIn, UserPlus } from 'lucide-react'
import { m, EASE_OUT } from '@/components/motion'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Alert, FullPageSpinner, Spinner } from '@/components/ui/Feedback'
import { Logo } from '@/components/ui/Logo'
import { CoverImage } from '@/components/couple/Cover'
import { SetupNotice } from '@/components/layout/SetupNotice'
import { useAuth } from '@/auth/AuthProvider'
import { db } from '@/lib/supabase'
import { formatDate } from '@/lib/format'
import { setFlash } from '@/lib/flash'
import { clearPendingInvite, formatInviteCode, isValidInviteCode, normalizeInviteCode, rememberPendingInvite } from '@/lib/invite'

type Preview = { wedding_title: string; wedding_date: string | null; inviter_name: string | null }

/**
 * /join/:code — terima undangan pasangan.
 * Belum login → simpan kode, arahkan ke daftar/masuk, lalu kembali ke sini.
 */
export function JoinPage() {
  const { code: rawCode = '' } = useParams()
  const code = normalizeInviteCode(rawCode)
  const valid = isValidInviteCode(code)
  const { configured, loading, session } = useAuth()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<Preview | null | 'invalid'>(null)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (valid) rememberPendingInvite(code)
  }, [code, valid])

  useEffect(() => {
    if (!session || !valid) return
    void db()
      .rpc('get_invite_preview', { p_code: code })
      .then(({ data }) => setPreview(data?.[0] ?? 'invalid'))
  }, [session, code, valid])

  if (!configured) return <SetupNotice />
  if (loading) return <FullPageSpinner />

  async function join() {
    setJoining(true)
    setError(null)
    const { error: err } = await db().rpc('accept_wedding_invite', { p_code: code })
    if (err) {
      setJoining(false)
      if (err.code === '23505') return setError(err.message.includes('lain') ? 'Akunmu sudah tergabung di workspace lain.' : 'Workspace ini sudah memiliki dua anggota.')
      return setError('Kode undangan tidak valid atau sudah kedaluwarsa. Minta kode baru ke pasanganmu.')
    }
    clearPendingInvite()
    setFlash('Kamu sudah terhubung dengan pasanganmu. Selamat merencanakan bersama!')
    // Muat ulang penuh agar workspace bersama dimuat dari awal.
    window.location.assign('/app/dashboard')
  }

  const inviter = preview && preview !== 'invalid' ? preview.inviter_name?.split(' ')[0] : null

  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <CoverImage path={null} alt="Pasangan memegang buku nikah" className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
        <p className="absolute bottom-12 left-12 right-12 font-display text-4xl font-medium italic leading-tight text-white">
          Merencanakan berdua,
          <br />
          melangkah serasi.
        </p>
      </div>
      <main className="flex flex-col px-4 py-6 sm:px-8">
        <Logo />
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10"
        >
          <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-rose-soft text-rose">
            <Heart className="size-7 fill-rose/20" aria-hidden />
          </span>

          {!valid ? (
            <>
              <h1 className="font-display text-4xl font-semibold">Kode tidak valid</h1>
              <p className="mt-2 text-ink-muted">Periksa kembali link dari pasanganmu. Kode terdiri dari 8 huruf dan angka.</p>
              <ButtonLink to="/" variant="secondary" className="mt-6 self-start">
                Ke beranda
              </ButtonLink>
            </>
          ) : !session ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-text">Undangan pasangan</p>
              <h1 className="mt-2 font-display text-[2.6rem] font-semibold leading-tight">Pasanganmu mengajakmu merencanakan bersama</h1>
              <p className="mt-3 text-ink-muted">
                Daftar atau masuk dulu. Setelah itu kamu langsung terhubung ke workspace pernikahan kalian dengan kode{' '}
                <strong className="tabular text-ink">{formatInviteCode(code)}</strong>.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <ButtonLink to="/register" size="lg" icon={<UserPlus className="size-4" aria-hidden />}>
                  Daftar gratis
                </ButtonLink>
                <ButtonLink to="/login" state={{ from: `/join/${code}` }} variant="secondary" size="lg" icon={<LogIn className="size-4" aria-hidden />}>
                  Masuk
                </ButtonLink>
              </div>
            </>
          ) : preview === null ? (
            <Spinner label="Memeriksa undangan…" className="justify-start" />
          ) : preview === 'invalid' ? (
            <>
              <h1 className="font-display text-4xl font-semibold">Undangan tidak berlaku</h1>
              <p className="mt-2 text-ink-muted">Kode ini sudah dipakai, dicabut, atau kedaluwarsa. Minta pasanganmu membuat kode baru dari halaman Kita.</p>
              <Button variant="secondary" className="mt-6 self-start" onClick={() => { clearPendingInvite(); navigate('/onboarding') }}>
                Buat workspace sendiri
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-text">Undangan dari {inviter ?? 'pasanganmu'}</p>
              <h1 className="mt-2 font-display text-[2.6rem] font-semibold leading-tight">{preview.wedding_title}</h1>
              {preview.wedding_date && <p className="mt-1 text-ink-muted">{formatDate(preview.wedding_date)}</p>}
              <p className="mt-4 text-ink-muted">
                Dengan bergabung, kalian berdua bisa melihat dan mengubah anggaran, vendor, checklist, tamu, rundown, serta
                mengerjakan tes kepribadian dan deep talk bersama.
              </p>
              {error && <Alert tone="danger" className="mt-5">{error}</Alert>}
              <Button size="lg" className="mt-8" loading={joining} onClick={() => void join()} icon={<Heart className="size-4" aria-hidden />}>
                Gabung sebagai pasangan
              </Button>
            </>
          )}
        </m.div>
      </main>
    </div>
  )
}
