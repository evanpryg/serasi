import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, Heart, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { Logo } from '@/components/ui/Logo'
import { BudgetFields, EventFields, StyleFields } from '@/components/wedding/WeddingFields'
import { useAuth } from '@/auth/AuthProvider'
import { useWorkspace } from '@/auth/WorkspaceProvider'
import { db } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/format'
import { setFlash } from '@/lib/flash'
import { isValidInviteCode, normalizeInviteCode, pendingInvite } from '@/lib/invite'
import { m, AnimatePresence } from '@/components/motion'
import { weddingSchema, type WeddingFormInput, type WeddingFormValues } from '@/lib/wedding'

const steps = [
  { title: 'Tentang acaramu', subtitle: 'Informasi dasar untuk menyusun checklist yang relevan.', fields: ['title', 'partnerNames', 'weddingDate', 'city', 'eventTypes'] },
  { title: 'Anggaran awal', subtitle: 'Angka ini bisa diubah kapan saja. Tidak perlu tepat sekarang.', fields: ['budgetTarget', 'availableFunds', 'guestEstimate'] },
  { title: 'Gaya dan tradisi', subtitle: 'Opsional. Membantu kami menyesuaikan saran untukmu.', fields: ['weddingStyle', 'tradition'] },
] as const

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { refresh } = useWorkspace()
  const [step, setStep] = useState(0)
  const [autoAllocate, setAutoAllocate] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const form = useForm<WeddingFormInput, unknown, WeddingFormValues>({
    resolver: zodResolver(weddingSchema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      partnerNames: '',
      weddingDate: '',
      city: '',
      eventTypes: ['akad_resepsi'],
      guestEstimate: null,
      budgetTarget: undefined as unknown as number,
      availableFunds: 0,
      weddingStyle: '',
      tradition: '',
    },
  })
  const budgetTarget = form.watch('budgetTarget')
  const [pending] = useState(pendingInvite)
  const current = steps[step]!
  const isLast = step === steps.length - 1

  function goTo(next: number) {
    setStep(next)
    // Pindahkan fokus ke judul langkah agar pembaca layar mengikuti perubahan.
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  async function handleNext() {
    const valid = await form.trigger([...current.fields])
    if (valid) goTo(step + 1)
  }

  async function onSubmit(v: WeddingFormValues) {
    setError(null)
    const { error: err } = await db().rpc('create_wedding_workspace', {
      p_title: v.title,
      p_city: v.city,
      p_event_types: v.eventTypes,
      p_budget_target: v.budgetTarget,
      p_available_funds: v.availableFunds,
      p_partner_names: v.partnerNames,
      p_wedding_date: v.weddingDate,
      p_guest_estimate: v.guestEstimate,
      p_wedding_style: v.weddingStyle,
      p_tradition: v.tradition,
      p_auto_allocate: autoAllocate,
    })
    if (err) {
      // 23505 = workspace sudah ada (mis. dua tab) → lanjutkan saja ke dashboard.
      if (err.code !== '23505') return setError('Profil pernikahan gagal disimpan. Periksa koneksi lalu coba lagi.')
    }
    setFlash('Workspace pernikahanmu siap. Kategori anggaran dan checklist dasar sudah dibuat.')
    // refresh() membuat OnboardingGate langsung mengarahkan ke dashboard.
    await refresh()
    navigate('/app/dashboard', { replace: true })
  }

  // Datang dari link undangan pasangan (setelah daftar/login) → lanjutkan bergabung.
  if (pending) return <Navigate to={`/join/${pending}`} replace />

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo to="/onboarding" />
        <Button variant="ghost" onClick={() => void signOut()} icon={<LogOut className="size-4" aria-hidden />}>
          Keluar
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <p className="text-sm font-medium text-gold-text">
          Halo{user?.user_metadata?.full_name ? `, ${String(user.user_metadata.full_name).split(' ')[0]}` : ''}! Mari siapkan workspace pernikahanmu.
        </p>

        {step === 0 && <JoinWithCode />}

        <ol className="mt-5 flex gap-2" aria-label="Langkah onboarding">
          {steps.map((s, i) => (
            <li key={s.title} className="flex-1" aria-current={i === step ? 'step' : undefined}>
              <div className={cn('h-1.5 rounded-full transition-colors duration-300', i <= step ? 'bg-primary' : 'bg-border')} />
              <span className={cn('mt-2 hidden text-xs font-medium sm:block', i === step ? 'text-ink' : 'text-ink-subtle')}>
                {i + 1}. {s.title}
              </span>
            </li>
          ))}
        </ol>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="mt-8 rounded-[1.5rem] border border-border bg-surface p-5 shadow-card sm:p-8"
          onKeyDown={(e) => {
            // Enter di field tidak langsung submit di langkah awal.
            if (e.key === 'Enter' && !isLast && (e.target as HTMLElement).tagName === 'INPUT') {
              e.preventDefault()
              void handleNext()
            }
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Langkah {step + 1} dari {steps.length}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-1 font-display text-[2.1rem] font-semibold leading-tight focus:outline-none">
            {current.title}
          </h1>
          <p className="mt-1 text-ink-muted">{current.subtitle}</p>

          <div key={step} className="mt-7 animate-fade-up">
            {step === 0 && <EventFields form={form} />}
            {step === 1 && (
              <div className="space-y-6">
                <BudgetFields form={form} />
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-canvas p-4">
                  <input
                    type="checkbox"
                    checked={autoAllocate}
                    onChange={(e) => setAutoAllocate(e.target.checked)}
                    className="mt-1 size-4 cursor-pointer accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">Bagi target ke kategori anggaran secara otomatis</span>
                    <span className="block text-sm text-ink-muted">
                      {!autoAllocate
                        ? 'Kategori dibuat dengan nominal Rp 0 agar kamu bisa mengisinya sendiri.'
                        : budgetTarget
                          ? `${formatRupiah(budgetTarget)} dibagi ke 14 kategori sebagai saran awal (misalnya katering 30%, venue 15%, dana cadangan 5%). Semua bisa kamu ubah.`
                          : 'Target anggaran akan dibagi ke 14 kategori sebagai saran awal. Semua bisa kamu ubah.'}
                    </span>
                  </span>
                </label>
              </div>
            )}
            {step === 2 && <StyleFields form={form} />}
          </div>

          {error && (
            <Alert tone="danger" className="mt-6">
              {error}
            </Alert>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => goTo(step - 1)} icon={<ArrowLeft className="size-4" aria-hidden />}>
                Kembali
              </Button>
            ) : (
              <span />
            )}
            {isLast ? (
              <Button key="submit" type="submit" size="lg" loading={form.formState.isSubmitting} icon={<Check className="size-4" aria-hidden />}>
                Buat workspace
              </Button>
            ) : (
              <Button key="next" size="lg" onClick={() => void handleNext()}>
                Lanjut
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}

/** Pasangan yang sudah punya workspace cukup memasukkan kode undangan. */
function JoinWithCode() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  return (
    <div className="mt-5 rounded-2xl border border-rose/20 bg-rose-soft/60 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose">
          <Heart className="size-5" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-ink">Pasanganmu sudah membuat workspace?</span>
          <span className="block text-sm text-ink-muted">Masukkan kode undangan darinya, tidak perlu mengisi ulang.</span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault()
              const c = normalizeInviteCode(code)
              if (!isValidInviteCode(c)) return setError('Kode terdiri dari 8 huruf/angka, contoh ABCD-EFGH.')
              navigate(`/join/${c}`)
            }}
          >
            <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-start">
              <div className="flex-1">
                <label htmlFor="invite-code" className="sr-only">Kode undangan</label>
                <input
                  ref={inputRef}
                  id="invite-code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null) }}
                  placeholder="ABCD-EFGH"
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={9}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'invite-code-error' : undefined}
                  className="tabular block h-11 w-full rounded-xl border border-border bg-white px-3.5 text-lg tracking-[0.15em] uppercase focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                />
                {error && <p id="invite-code-error" role="alert" className="mt-1.5 text-sm text-danger">{error}</p>}
              </div>
              <Button type="submit">Gabung</Button>
            </div>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  )
}
