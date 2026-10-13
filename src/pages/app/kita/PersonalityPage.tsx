import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  Brain,
  Check,
  Clock,
  Crown,
  Flame,
  Heart,
  HeartHandshake,
  Lock,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  ThumbsUp,
  TriangleAlert,
  Users,
  Wallet,
  X,
} from 'lucide-react'

import { AnimatePresence, EASE_OUT, Reveal, Stagger, StaggerItem, m } from '@/components/motion'
import { useInView } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Card'
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { MemberAvatar } from '@/components/couple/Cover'
import { PartnerInvite } from '@/components/couple/PartnerInvite'
import { firstName, useWedding, useWorkspace, type Member } from '@/auth/WorkspaceProvider'
import { usePersonality } from '@/hooks/useCoupleData'
import { db } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { saveDemoPersonalityResult } from '@/lib/demoStore'
import { cn } from '@/lib/cn'
import {
  LETTER_INFO,
  LIKERT,
  QUESTIONS,
  TYPE_PROFILES,
  isComplete,
  isTypeCode,
  pairInsights,
  scoreAnswers,
  type Answers,
  type Letter,
  type Scores,
  type TypeCode,
} from '@/lib/personality'
import type { PersonalityResult } from '@/lib/database.types'

const draftKey = (weddingId: string, userId: string) => `serasi:personality-draft:${weddingId}:${userId}`
const PREMIUM_STORAGE_KEY = 'serasi:premium_unlocked'

export function PersonalityPage() {
  const wedding = useWedding()
  const { me, partner } = useWorkspace()
  const { state, reload } = usePersonality(wedding.id)
  const [mode, setMode] = useState<'view' | 'quiz'>('view')
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem(PREMIUM_STORAGE_KEY) === 'true'
  })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const togglePremium = (val: boolean) => {
    setIsPremium(val)
    localStorage.setItem(PREMIUM_STORAGE_KEY, val ? 'true' : 'false')
  }

  if (!me) return null
  if (state.status === 'loading') return <PageSkeleton />
  if (state.status === 'error') return <ErrorState onRetry={() => void reload()} />

  const mine = state.data.results.find((r) => r.user_id === me.userId) ?? null
  const partnerResult = partner ? state.data.results.find((r) => r.user_id === partner.userId) ?? null : null
  const partnerDone = partner ? state.data.completedBy.includes(partner.userId) : false

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/app/kita" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden /> Kita
          </Link>
          <h1 className="font-display text-[2.4rem] font-semibold leading-tight sm:text-5xl">Tes kepribadian</h1>
          <p className="mt-1 max-w-2xl text-ink-muted">
            Kenali karakter mendalam, antisipasi potensi konflik rumah tangga, dan pelajari cara terbaik menghadapi pasangan saat beda pendapat.
          </p>
        </div>

        {mine && mode === 'view' && (
          <div className="flex shrink-0 items-center gap-2">
            {isPremium ? (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50/80 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-sm">
                <Crown className="size-4 text-amber-600" aria-hidden />
                <span>Paket Premium Aktif</span>
                <button
                  type="button"
                  onClick={() => togglePremium(false)}
                  className="ml-1 cursor-pointer text-amber-700 underline hover:text-amber-950"
                  title="Beralih ke tampilan gratis untuk simulasi"
                >
                  (Uji Mode Gratis)
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-gold/40 bg-gradient-to-r from-amber-500/15 via-gold-soft to-amber-500/10 px-4 py-2 text-xs font-semibold text-gold-text shadow-sm transition hover:scale-[1.02] hover:border-gold"
              >
                <Crown className="size-4 text-gold-text" aria-hidden />
                <span>Buka Versi Lengkap (Premium)</span>
              </button>
            )}
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {mode === 'quiz' || !mine ? (
          mode === 'quiz' ? (
            <m.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              <Quiz
                weddingId={wedding.id}
                me={me}
                initial={mine?.answers ?? null}
                onCancel={() => setMode('view')}
                onDone={async () => {
                  await reload()
                  setMode('view')
                }}
              />
            </m.div>
          ) : (
            <m.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              <Intro partner={partner} partnerDone={partnerDone} onStart={() => setMode('quiz')} />
            </m.div>
          )
        ) : (
          <m.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} className="space-y-10">
            {!isPremium && (
              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-gold/40 bg-gradient-to-r from-amber-50 via-surface to-gold-soft/30 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800">
                    <Crown className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Anda sedang melihat Pratinjau Versi Gratis</p>
                    <p className="text-xs text-ink-muted">Poin mendalam perkiraan konflik rumah tangga, saat marah, & strategi mertua terkunci.</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setShowUpgradeModal(true)} icon={<Crown className="size-3.5 text-amber-500" aria-hidden />}>
                  Tingkatkan ke Premium
                </Button>
              </div>
            )}

            <ResultCard
              result={mine}
              member={me}
              title="Hasilmu"
              isPremium={isPremium}
              onRetake={() => setMode('quiz')}
              onUnlock={() => setShowUpgradeModal(true)}
            />

            <PartnerSection
              partner={partner}
              partnerResult={partnerResult}
              partnerDone={partnerDone}
              mine={mine}
              isPremium={isPremium}
              onUnlock={() => setShowUpgradeModal(true)}
            />
          </m.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-ink-subtle">
        Tes ini terinspirasi kerangka 16 tipe kepribadian (16Personalities / MBTI®) dan bukan instrumen resmi maupun alat diagnosis. Gunakan sebagai bahan
        obrolan mendalam untuk saling memahami, mengantisipasi konflik, dan memperkuat ikatan pernikahan.
      </p>

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onActivate={() => {
            togglePremium(true)
            setShowUpgradeModal(false)
          }}
        />
      )}
    </div>
  )
}

function Intro({ partner, partnerDone, onStart }: { partner: Member | null; partnerDone: boolean; onStart: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-primary p-6 text-on-primary sm:p-10">
      <svg aria-hidden className="absolute -right-24 -top-24 size-[28rem] opacity-20" viewBox="0 0 200 200">
        <circle cx="80" cy="100" r="60" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
        <circle cx="120" cy="100" r="60" fill="none" stroke="var(--color-rose-light)" strokeWidth="0.8" />
      </svg>
      <div className="relative max-w-xl">
        <Brain className="size-8 text-gold-on-dark" aria-hidden />
        <h2 className="mt-5 font-display text-4xl font-semibold leading-tight">{QUESTIONS.length} pernyataan kontekstual pernikahan, sekitar 6–8 menit.</h2>
        <p className="mt-3 text-on-primary/80">
          Jawab sesuai kecenderunganmu sehari-hari secara jujur, bukan yang ideal. Hasil ini akan membantu kalian berdua memahami potensi permasalahan rumah tangga kelak serta cara menyelesaikannya secara elegan.
        </p>
        {partner && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm">
            {partnerDone ? <Check className="size-4 text-gold-on-dark" aria-hidden /> : <Clock className="size-4 text-gold-on-dark" aria-hidden />}
            {partnerDone ? `${firstName(partner.name)} sudah menyelesaikan tesnya` : `${firstName(partner.name)} belum mengerjakan`}
          </p>
        )}
        <div className="mt-8">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-canvas px-6 font-semibold text-primary shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="size-4" aria-hidden /> Mulai tes sekarang
          </button>
        </div>
      </div>
    </div>
  )
}

function Quiz({ weddingId, me, initial, onCancel, onDone }: { weddingId: string; me: Member; initial: Answers | null; onCancel: () => void; onDone: () => Promise<void> }) {
  const key = draftKey(weddingId, me.userId)
  const [answers, setAnswers] = useState<Answers>(() => {
    try {
      const draft = localStorage.getItem(key)
      if (draft) return JSON.parse(draft) as Answers
    } catch {
      /* abaikan */
    }
    return initial ?? {}
  })
  const firstUnanswered = QUESTIONS.findIndex((q) => answers[q.id] == null)
  const [index, setIndex] = useState(firstUnanswered === -1 ? 0 : firstUnanswered)
  const [direction, setDirection] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const advanceTimer = useRef<number | undefined>(undefined)

  const q = QUESTIONS[index]!
  const done = isComplete(answers)
  const answeredCount = QUESTIONS.filter((x) => answers[x.id] != null).length

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(answers))
    } catch {
      /* abaikan */
    }
  }, [answers, key])

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  const go = useCallback((next: number) => {
    setDirection(next > index ? 1 : -1)
    setIndex(Math.max(0, Math.min(QUESTIONS.length - 1, next)))
  }, [index])

  const choose = useCallback(
    (value: number) => {
      setAnswers((a) => ({ ...a, [q.id]: value }))
      window.clearTimeout(advanceTimer.current)
      if (index < QUESTIONS.length - 1) advanceTimer.current = window.setTimeout(() => go(index + 1), 260)
    },
    [q.id, index, go],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (/^[1-5]$/.test(e.key)) choose(Number(e.key))
      else if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === 'ArrowRight' && answers[q.id] != null) go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, go, index, answers, q.id])

  async function submit() {
    setSaving(true)
    setError(null)
    const { type, scores } = scoreAnswers(answers)
    const demo = getCurrentDemoAccount()
    if (demo) {
      saveDemoPersonalityResult(demo.id, weddingId, me.userId, type, scores, answers)
      try {
        localStorage.removeItem(key)
      } catch {
        /* abaikan */
      }
      await onDone()
      return
    }

    const { error: err } = await db()
      .from('personality_results')
      .upsert({ wedding_id: weddingId, user_id: me.userId, type_code: type, scores, answers, completed_at: new Date().toISOString() })
    if (err) {
      setSaving(false)
      return setError('Hasil gagal disimpan. Periksa koneksi lalu coba lagi.')
    }
    try {
      localStorage.removeItem(key)
    } catch {
      /* abaikan */
    }
    await onDone()
  }

  const pct = Math.round((answeredCount / QUESTIONS.length) * 100)

  return (
    <section aria-labelledby="quiz-question" className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button type="button" onClick={onCancel} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Simpan & keluar
        </button>
        <p className="tabular text-sm font-semibold text-ink-muted" aria-live="polite">
          {index + 1} / {QUESTIONS.length}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-label="Progres tes" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <m.div className="h-full origin-left rounded-full bg-gradient-to-r from-primary to-rose" animate={{ scaleX: pct / 100 }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>

      <div className="relative mt-10 min-h-[25rem]">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <m.div
            key={q.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT } }}
            exit={{ opacity: 0, x: direction * -30, transition: { duration: 0.18 } }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Pertanyaan {index + 1}
            </p>
            <h2 id="quiz-question" ref={headingRef} className="mt-2 text-balance font-display text-[1.9rem] font-semibold leading-snug text-ink sm:text-[2.3rem]">
              {q.text}
            </h2>
            <fieldset className="mt-8">
              <legend className="sr-only">Seberapa sesuai pernyataan ini denganmu?</legend>
              <div className="grid gap-2.5 sm:grid-cols-5 sm:gap-2">
                {LIKERT.map((opt) => {
                  const selected = answers[q.id] === opt.value
                  return (
                    <m.button
                      key={opt.value}
                      type="button"
                      onClick={() => choose(opt.value)}
                      aria-pressed={selected}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        'relative flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors sm:flex-col sm:justify-center sm:gap-2 sm:px-2 sm:py-4 sm:text-center',
                        selected ? 'border-primary bg-primary text-on-primary shadow-glow' : 'border-border bg-surface text-ink hover:border-primary/40 hover:bg-primary-soft/40',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'flex shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          ['size-7', 'size-6', 'size-5', 'size-6', 'size-7'][opt.value - 1],
                          selected ? 'border-white bg-white/20' : opt.value < 3 ? 'border-rose/50' : opt.value > 3 ? 'border-primary/50' : 'border-border-strong',
                        )}
                      >
                        {selected && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span>{opt.label}</span>
                      <span className="sr-only"> (tombol {opt.value})</span>
                    </m.button>
                  )
                })}
              </div>
            </fieldset>
          </m.div>
        </AnimatePresence>
      </div>

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
        <Button variant="ghost" onClick={() => go(index - 1)} disabled={index === 0} icon={<ArrowLeft className="size-4" aria-hidden />}>
          Sebelumnya
        </Button>
        {done ? (
          <Button size="lg" loading={saving} onClick={() => void submit()} icon={<Sparkles className="size-4" aria-hidden />}>
            Lihat hasil lengkap
          </Button>
        ) : (
          <p className="text-sm text-ink-muted">
            <span className="hidden sm:inline">Tekan 1–5 di keyboard · </span>
            {QUESTIONS.length - answeredCount} lagi
          </p>
        )}
      </div>
    </section>
  )
}

function TypeLetters({ code, tone }: { code: TypeCode; tone: 'primary' | 'rose' }) {
  return (
    <Stagger inView={false} stagger={0.09} delay={0.1} className="flex gap-1.5 sm:gap-2" as="div">
      {code.split('').map((l, i) => (
        <StaggerItem
          key={i}
          className={cn(
            'flex size-14 items-center justify-center rounded-2xl font-display text-4xl font-semibold sm:size-[4.5rem] sm:text-5xl shadow-sm',
            tone === 'primary' ? 'bg-primary text-on-primary' : 'bg-rose text-white',
          )}
        >
          <span title={LETTER_INFO[l as Letter].name}>{l}</span>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

function DimensionBars({ scores, tone }: { scores: Scores; tone: 'primary' | 'rose' }) {
  const pairs: [Letter, Letter, keyof Scores][] = [
    ['E', 'I', 'E'],
    ['S', 'N', 'S'],
    ['T', 'F', 'T'],
    ['J', 'P', 'J'],
  ]
  const ref = useRef<HTMLDListElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  return (
    <dl ref={ref} className="space-y-4">
      {pairs.map(([a, b, k]) => {
        const left = scores[k]
        const leaning = left >= 50 ? a : b
        const strength = left >= 50 ? left : 100 - left
        return (
          <div key={String(k)}>
            <dt className="flex justify-between text-xs font-semibold text-ink-muted">
              <span className={cn(leaning === a && 'text-ink')}>{LETTER_INFO[a].name}</span>
              <span className={cn(leaning === b && 'text-ink')}>{LETTER_INFO[b].name}</span>
            </dt>
            <dd className="mt-1.5">
              <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-muted">
                <m.div
                  className={cn('absolute inset-y-0 rounded-full', tone === 'primary' ? 'bg-primary' : 'bg-rose', left >= 50 ? 'left-0 origin-left' : 'right-0 origin-right')}
                  style={{ width: `${strength}%` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: inView ? 1 : 0 }}
                  transition={{ duration: 0.9, ease: EASE_OUT }}
                />
                <span className="absolute inset-y-0 left-1/2 w-px bg-white/80" aria-hidden />
              </div>
              <span className="sr-only">
                {strength}% {LETTER_INFO[leaning].name}
              </span>
              <p className="tabular mt-1 text-right text-xs text-ink-subtle" aria-hidden>
                {strength}% {LETTER_INFO[leaning].name.toLowerCase()}
              </p>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function ResultCard({
  result,
  member,
  title,
  isPremium,
  onRetake,
  onUnlock,
}: {
  result: PersonalityResult
  member: Member
  title: string
  isPremium: boolean
  onRetake?: () => void
  onUnlock: () => void
}) {
  const code = isTypeCode(result.type_code) ? result.type_code : null
  if (!code) return null
  const profile = TYPE_PROFILES[code]
  const tone = member.role === 'owner' ? 'primary' : 'rose'

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-card">
      {/* Header Kartu Kepribadian */}
      <div className={cn('grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]', tone === 'primary' ? 'bg-gradient-to-br from-primary-soft/70 to-surface' : 'bg-gradient-to-br from-rose-soft to-surface')}>
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
              <MemberAvatar member={member} size="sm" /> {title}
            </p>
            {onRetake && (
              <button type="button" onClick={onRetake} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
                <RotateCcw className="size-4" aria-hidden /> Ulangi tes
              </button>
            )}
          </div>
          <div className="mt-4">
            <TypeLetters code={code} tone={tone} />
          </div>
          <div className="mt-5">
            <span className="rounded-md bg-gold-soft px-2.5 py-1 text-xs font-semibold text-gold-text">
              {profile.roleName} · {profile.roleGroup}
            </span>
            <m.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: EASE_OUT }} className="mt-2 font-display text-4xl font-semibold text-ink">
              {profile.nickname}
            </m.h2>
          </div>
          <p className="mt-3 text-ink-muted">{profile.summary}</p>
        </div>
        <DimensionBars scores={result.scores} tone={tone} />
      </div>

      {/* Kekuatan & Hal yang Perlu Diperhatikan */}
      <div className="grid gap-6 border-t border-border p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ThumbsUp className="size-4 text-success" aria-hidden /> Kekuatan dalam hubungan
          </p>
          <ul className="mt-3 space-y-2">
            {(isPremium ? profile.strengths : profile.strengths.slice(0, 2)).map((s) => (
              <li key={s} className="flex gap-2.5 text-[0.95rem] text-ink-muted">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
          {!isPremium && profile.strengths.length > 2 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gold-text">
              <Lock className="size-3" aria-hidden /> +{profile.strengths.length - 2} poin kekuatan lainnya terbuka di Premium
            </p>
          )}
        </div>

        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <TriangleAlert className="size-4 text-warning" aria-hidden /> Perlu diperhatikan / Titik buta
          </p>
          <ul className="mt-3 space-y-2">
            {(isPremium ? profile.watchouts : profile.watchouts.slice(0, 1)).map((s) => (
              <li key={s} className="flex gap-2.5 text-[0.95rem] text-ink-muted">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-rose" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
          {!isPremium && profile.watchouts.length > 1 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-rose">
              <Lock className="size-3" aria-hidden /> +{profile.watchouts.length - 1} titik buta kritis lainnya terbuka di Premium
            </p>
          )}
        </div>
      </div>

      {/* Kebutuhan Cinta Utama */}
      <div className="border-t border-border bg-surface-muted/30 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-text">Bahasa Cinta Utama</p>
        <p className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">{profile.feelsLoved}</p>
      </div>

      {/* SEKSI MENDALAM RUMAH TANGGA: GRATIS vs PREMIUM */}
      {isPremium ? (
        <div className="space-y-8 border-t border-border p-6 sm:p-8">
          {/* 1. Perkiraan Permasalahan Rumah Tangga & Solusi */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <ShieldAlert className="size-5 text-rose" aria-hidden /> Perkiraan Permasalahan Rumah Tangga & Solusinya
              </h3>
              <Badge tone="gold">Analisis Karakter</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Berdasarkan tipe {code}, berikut potensi gesekan yang sering timbul setelah menikah dan panduan menyelesaikannya:
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {profile.maritalFrictions.map((f, i) => (
                <div key={i} className="flex flex-col justify-between rounded-2xl border border-border bg-canvas/60 p-5 shadow-sm">
                  <div>
                    <span className="inline-block rounded-lg bg-rose-soft px-2 py-0.5 text-xs font-semibold text-rose">
                      Isu #{i + 1}
                    </span>
                    <h4 className="mt-2 text-[0.95rem] font-bold text-ink">{f.issue}</h4>
                    <p className="mt-2 text-xs text-ink-muted">
                      <strong className="text-ink">Penyebab:</strong> {f.cause}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-border/80 pt-3">
                    <p className="text-xs text-success">
                      <strong className="text-ink">Solusi Konkret:</strong> {f.solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Protokol Saat Sedang Marah & Menyelesaikan Konflik */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-surface to-rose-soft/20 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <Flame className="size-5 text-amber-600" aria-hidden /> Panduan Saat Sedang Marah / Berkonflik
            </h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-surface p-4">
                <p className="text-xs font-bold uppercase text-ink-subtle">Respon Khas Saat Tertekan</p>
                <p className="mt-2 text-sm text-ink-muted">{profile.whenAngry.behavior}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <p className="text-xs font-bold uppercase text-emerald-800">✅ Yang Harus Dilakukan Pasangan</p>
                <p className="mt-2 text-sm text-emerald-950">{profile.whenAngry.doThis}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <p className="text-xs font-bold uppercase text-rose">❌ Pantangan / Jangan Dilakukan</p>
                <p className="mt-2 text-sm text-rose-950">{profile.whenAngry.dontDoThis}</p>
              </div>
            </div>
          </div>

          {/* 3. Menghadapi Mertua, Finansial & Domestik */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-canvas/40 p-5">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Users className="size-4 text-primary" aria-hidden /> Menghadapi Orang Lain & Keluarga Mertua
              </h4>
              <p className="mt-2 text-xs text-ink-muted">
                <strong className="text-ink">Karakter Sosial:</strong> {profile.socialAndInLaws.style}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                <strong className="text-ink">Strategi Bersama:</strong> {profile.socialAndInLaws.advice}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas/40 p-5">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Wallet className="size-4 text-gold-text" aria-hidden /> Finansial & Gaya Hidup Domestik
              </h4>
              <p className="mt-2 text-xs text-ink-muted">
                <strong className="text-ink">Komunikasi Harian:</strong> {profile.domesticLifestyle.commStyle}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                <strong className="text-ink">Pola Keuangan:</strong> {profile.domesticLifestyle.financialTendency}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                <strong className="text-ink">Ruang & Rumah:</strong> {profile.domesticLifestyle.spaceAndHabit}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* TAMPILAN TERKUNCI (VERSI GRATIS) */
        <div className="relative overflow-hidden border-t border-border bg-surface-muted/20 p-6 sm:p-10 text-center">
          <div className="mx-auto max-w-lg">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-gold-text shadow-sm">
              <Lock className="size-6" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-2xl font-bold text-ink sm:text-3xl">
              Analisis Lengkap Rumah Tangga Terkunci
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              Dapatkan perkiraan 3 potensi konflik rumah tangga, panduan respon saat pasangan marah (Do&apos;s &amp; Don&apos;ts), cara menghadapi mertua, serta kebiasaan finansial &amp; domestik.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={onUnlock} icon={<Crown className="size-4 text-amber-300" aria-hidden />}>
                Buka Analisis Lengkap (Premium)
              </Button>
            </div>
          </div>

          {/* Siluet blurred preview di latar belakang */}
          <div aria-hidden className="pointer-events-none mt-8 grid select-none opacity-30 blur-xs gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4 text-left">
              <p className="font-semibold text-ink">Isu #1: Komunikasi &amp; Emosi</p>
              <p className="text-xs text-ink-muted">Penyebab dan solusi konkret rumah tangga...</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 text-left">
              <p className="font-semibold text-ink">Saat Pasangan Marah</p>
              <p className="text-xs text-ink-muted">Langkah menenangkan dan pantangan...</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 text-left">
              <p className="font-semibold text-ink">Menghadapi Keluarga Mertua</p>
              <p className="text-xs text-ink-muted">Strategi menjaga keharmonisan keluarga...</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function PartnerSection({
  partner,
  partnerResult,
  partnerDone,
  mine,
  isPremium,
  onUnlock,
}: {
  partner: Member | null
  partnerResult: PersonalityResult | null
  partnerDone: boolean
  mine: PersonalityResult
  isPremium: boolean
  onUnlock: () => void
}) {
  if (!partner) return <PartnerInvite />
  const name = firstName(partner.name)
  if (!partnerDone || !partnerResult) {
    return (
      <Reveal className="flex flex-col items-center rounded-[1.75rem] border border-dashed border-rose/30 bg-rose-soft/40 px-6 py-12 text-center">
        <m.span
          className="flex size-14 items-center justify-center rounded-2xl bg-white text-rose shadow-sm"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Heart className="size-7" aria-hidden />
        </m.span>
        <h2 className="mt-4 font-display text-3xl font-semibold">Menunggu {name}</h2>
        <p className="mt-2 max-w-md text-ink-muted">
          Setelah {name} menyelesaikan tesnya, kamu akan melihat tipenya, cara terbaik menghadapinya, dan dinamika kalian berdua.
        </p>
      </Reveal>
    )
  }

  const a = mine.type_code as TypeCode
  const b = partnerResult.type_code as TypeCode
  const profile = TYPE_PROFILES[b]
  const insights = pairInsights(a, b)
  const same = insights.filter((i) => i.same).length

  return (
    <div className="space-y-10">
      <ResultCard
        result={partnerResult}
        member={partner}
        title={`Hasil ${name}`}
        isPremium={isPremium}
        onUnlock={onUnlock}
      />

      {/* Bagian Cara Menghadapi Pasangan */}
      <Reveal>
        <section className="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-white sm:p-10">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_0%,rgb(31_77_58/0.9),transparent),radial-gradient(60%_80%_at_100%_100%,rgb(142_59_70/0.85),transparent)]" />
          <div className="relative">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-gold-on-dark">
              <HeartHandshake className="size-4" aria-hidden /> Cara terbaik menghadapi {name}
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">{profile.feelsLoved}</h2>
            
            <Stagger as="ul" className="mt-8 grid gap-3 sm:grid-cols-3">
              {(isPremium ? profile.approach : profile.approach.slice(0, 1)).map((t, i) => (
                <StaggerItem as="li" key={t} className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                  <span className="font-display text-3xl font-semibold text-gold-on-dark">0{i + 1}</span>
                  <p className="mt-2 text-[0.95rem] text-white/90">{t}</p>
                </StaggerItem>
              ))}

              {!isPremium && (
                <li className="flex flex-col justify-center rounded-2xl border border-white/20 bg-white/5 p-5 text-center backdrop-blur sm:col-span-2">
                  <Lock className="mx-auto size-6 text-gold-on-dark" aria-hidden />
                  <p className="mt-2 text-sm font-semibold text-white">2 Panduan Pendekatan Lainnya Terkunci</p>
                  <p className="text-xs text-white/70">Tersedia pada paket analisis lengkap (Premium).</p>
                  <button
                    type="button"
                    onClick={onUnlock}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gold-on-dark underline hover:text-white"
                  >
                    Buka Panduan Lengkap
                  </button>
                </li>
              )}
            </Stagger>
          </div>
        </section>
      </Reveal>

      {/* Dinamika Kompatibilitas Berdua */}
      <section>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-text">Dinamika kalian</p>
              <h2 className="mt-2 font-display text-4xl font-semibold">
                {a} <span className="text-gold">&amp;</span> {b}
              </h2>
            </div>
            <Badge tone="gold" className="px-3 py-1 text-sm">
              Sama di {same} dari 4 dimensi
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Ini bukan sekadar ramalan kecocokan. Kesamaan mempermudah koordinasi, perbedaan karakter memperkaya jika dipahami cara berkomunikasinya.
          </p>
        </Reveal>

        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2">
          {(isPremium ? insights : insights.slice(0, 2)).map((ins) => (
            <StaggerItem key={ins.dimension} className="rounded-card border border-border bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">{ins.title}</h3>
                <Badge tone={ins.same ? 'primary' : 'gold'}>{ins.same ? 'Sama' : 'Berbeda'}</Badge>
              </div>
              <p className="mt-2 text-[0.95rem] text-ink-muted">{ins.text}</p>
              <p className="mt-3 flex gap-2 rounded-xl bg-canvas p-3 text-sm text-ink">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-text" aria-hidden />
                {ins.tip}
              </p>
            </StaggerItem>
          ))}
        </Stagger>

        {!isPremium && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-surface-muted/40 p-5 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-sm font-semibold text-ink">2 Wawasan Dimensi Pasangan Lainnya Terkunci</p>
              <p className="text-xs text-ink-muted">Pelajari dinamika cara kalian berdua mengambil keputusan &amp; gaya hidup bersama.</p>
            </div>
            <Button size="sm" onClick={onUnlock} icon={<Crown className="size-3.5" aria-hidden />}>
              Buka Semua Dimensi
            </Button>
          </div>
        )}

        <Reveal className="mt-6 text-center">
          <Link to="/app/kita/deeptalk" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
            Lanjutkan dengan deep talk →
          </Link>
        </Reveal>
      </section>
    </div>
  )
}

function UpgradeModal({ onClose, onActivate }: { onClose: () => void; onActivate: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-gold/40 bg-surface p-6 shadow-pop sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
          aria-label="Tutup"
        >
          <X className="size-5" aria-hidden />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
            <Crown className="size-6" aria-hidden />
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-text">Serasi Premium</span>
            <h3 id="upgrade-title" className="font-display text-2xl font-bold text-ink">
              Analisis Lengkap Karakter &amp; Rumah Tangga
            </h3>
          </div>
        </div>

        <p className="mt-4 text-sm text-ink-muted">
          Pernikahan bukan hanya tentang hari H, tetapi tentang perjalanan puluhan tahun bersama. Akses laporan menyeluruh untuk memahami pasangan luar dalam:
        </p>

        <ul className="mt-5 space-y-3 text-sm text-ink">
          <li className="flex items-start gap-2.5">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" />
            <span><strong>3 Perkiraan Masalah Rumah Tangga:</strong> Analisis akar pemicu konflik di masa depan &amp; solusi pencegahannya.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" />
            <span><strong>Protokol Saat Sedang Marah:</strong> Respon khas, Do&apos;s (yang harus dilakukan) &amp; Don&apos;ts (pantangan mutlak).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" />
            <span><strong>Keluarga Besar &amp; Mertua:</strong> Strategi menghadapi lingkungan sosial tanpa menimbulkan kesalahpahaman.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" />
            <span><strong>Finansial &amp; Ruang Pribadi:</strong> Pola belanja, kebiasaan domestik, dan kebutuhan waktu sendiri.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" />
            <span><strong>Dinamika Hubungan Lengkap:</strong> Analisis mendalam seluruh 4 dimensi kecocokan kalian berdua.</span>
          </li>
        </ul>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onActivate}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 font-semibold text-white shadow-md hover:from-amber-700 hover:to-amber-800 transition"
          >
            <Crown className="size-4" aria-hidden />
            Aktifkan Akses Premium Sekarang
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full cursor-pointer text-xs font-semibold text-ink-muted hover:text-ink"
          >
            Nanti saja, tetap di versi gratis
          </button>
        </div>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-14 w-72" />
      <Skeleton className="h-80 rounded-[1.75rem]" />
    </div>
  )
}
