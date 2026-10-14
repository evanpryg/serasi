import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ChevronDown, Layers, Lock, MessageCircleHeart, Save, Shuffle, X } from 'lucide-react'
import { AnimatePresence, EASE_OUT, Reveal, SPRING, m } from '@/components/motion'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Card'
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { MemberAvatar } from '@/components/couple/Cover'
import { PartnerInvite } from '@/components/couple/PartnerInvite'
import { LockedPanel } from '@/components/premium/Premium'
import { usePremium } from '@/hooks/usePremium'
import { DEEPTALK_TOTAL_COUNT, isFreeDeepTalkTopic } from '@/lib/plans'
import { firstName, useWedding, useWorkspace, type Member } from '@/auth/WorkspaceProvider'
import { useDeepTalk, type DeepTalkData } from '@/hooks/useCoupleData'
import { db } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { saveDemoDeepTalkAnswer } from '@/lib/demoStore'
import { cn } from '@/lib/cn'
import {
  ALIGNMENT_OPTIONS,
  ALL_QUESTIONS,
  STATUS_LABEL,
  TOPICS,
  questionStatus,
  type Alignment,
  type DeepTalkQuestion,
  type QuestionStatus,
} from '@/lib/deeptalk'

const statusTone: Record<QuestionStatus, 'neutral' | 'primary' | 'gold' | 'success' | 'warning' | 'danger'> = {
  belum_dijawab: 'neutral',
  pasangan_menunggu: 'gold',
  menunggu_pasangan: 'neutral',
  perlu_dinilai: 'gold',
  sejalan: 'success',
  perlu_dibahas: 'warning',
  berbeda: 'danger',
}

type Ctx = { data: DeepTalkData; me: Member; partner: Member | null }

function statusFor(qid: string, { data, me, partner }: Ctx) {
  const mineRow = data.answers.find((a) => a.user_id === me.userId && a.question_id === qid)
  const partnerRow = partner ? data.answers.find((a) => a.user_id === partner.userId && a.question_id === qid) : undefined
  const partnerAnswered = partner ? data.answered.has(`${partner.userId}:${qid}`) : false
  return {
    mineRow,
    partnerRow,
    status: questionStatus({
      mineAnswered: Boolean(mineRow),
      partnerAnswered,
      mineAlignment: mineRow?.alignment ?? null,
      partnerAlignment: partnerRow?.alignment ?? null,
    }),
  }
}

export function DeepTalkPage() {
  const wedding = useWedding()
  const { me, partner } = useWorkspace()
  const { state, reload } = useDeepTalk(wedding.id)
  const [topicId, setTopicId] = useState(TOPICS[0]!.id)
  const [openId, setOpenId] = useState<string | null>(null)
  const [deckOpen, setDeckOpen] = useState(false)
  const { isPremium } = usePremium()
  const canUse = (topic: string) => isPremium || isFreeDeepTalkTopic(topic)
  const usable = useMemo(() => ALL_QUESTIONS.filter((q) => isPremium || isFreeDeepTalkTopic(q.topicId)), [isPremium])

  if (!me) return null
  if (state.status === 'loading')
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-14 w-60" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    )
  if (state.status === 'error') return <ErrorState onRetry={() => void reload()} />

  const ctx: Ctx = { data: state.data, me, partner }
  const statuses = ALL_QUESTIONS.map((q) => statusFor(q.id, ctx).status)
  const count = (s: QuestionStatus) => statuses.filter((x) => x === s).length
  const myAnswered = state.data.answers.filter((a) => a.user_id === me.userId).length
  const topic = TOPICS.find((t) => t.id === topicId)!

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/app/kita" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden /> Kita
          </Link>
          <h1 className="font-display text-[2.4rem] font-semibold leading-tight sm:text-5xl">Deep talk</h1>
          <p className="mt-1 max-w-2xl text-ink-muted">
            Pertanyaan tentang visi, misi, dan nilai kalian. Jawaban pasangan terbuka setelah kamu menjawab pertanyaan yang sama.
          </p>
        </div>
        <Button variant="gold" onClick={() => setDeckOpen(true)} icon={<Layers className="size-4" aria-hidden />}>
          Mode kartu
        </Button>
      </header>

      {!partner && <PartnerInvite />}

      <Reveal>
        <section aria-label="Ringkasan deep talk" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryTile label="Kamu jawab" value={`${myAnswered}/${usable.length}`} tone="primary" />
          <SummaryTile label="Sejalan" value={count('sejalan')} tone="success" />
          <SummaryTile label="Perlu dibahas" value={count('perlu_dibahas') + count('perlu_dinilai')} tone="warning" />
          <SummaryTile label="Berbeda" value={count('berbeda')} tone="danger" />
        </section>
      </Reveal>

      {/* Topik */}
      <nav aria-label="Topik deep talk" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {TOPICS.map((t) => {
            const active = t.id === topicId
            const locked = !canUse(t.id)
            const done = t.questions.filter((q) => state.data.answers.some((a) => a.user_id === me.userId && a.question_id === q.id)).length
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    setTopicId(t.id)
                    setOpenId(null)
                  }}
                  aria-pressed={active}
                  className={cn('relative flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors', active ? 'text-on-primary' : 'text-ink-muted hover:text-ink')}
                >
                  {active && <m.span layoutId="topic-pill" className="absolute inset-0 rounded-full bg-primary shadow-sm" transition={SPRING} />}
                  {!active && <span className="absolute inset-0 rounded-full border border-border bg-surface" aria-hidden />}
                  <span className="relative">{t.title}</span>
                  {locked ? (
                    <Lock className="relative size-3.5" aria-label="Premium" />
                  ) : (
                    <span className={cn('tabular relative rounded-full px-1.5 text-xs', active ? 'bg-white/20' : 'bg-surface-muted')}>
                      {done}/{t.questions.length}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <AnimatePresence mode="wait">
        <m.section
          key={topic.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
          aria-labelledby="topic-title"
        >
          <h2 id="topic-title" className="font-display text-3xl font-semibold">
            {topic.title}
          </h2>
          <p className="text-ink-muted">{topic.description}</p>
          {!canUse(topic.id) ? (
            <LockedPanel
              className="mt-5"
              source="deeptalk"
              title={`Topik "${topic.title}" ada di Premium`}
              description={`${topic.questions.length} pertanyaan untuk dijawab berdua, bagian dari ${DEEPTALK_TOTAL_COUNT} pertanyaan lengkap deep talk.`}
            >
              <ul className="mt-4 space-y-2" aria-label="Contoh pertanyaan">
                {topic.questions.slice(0, 2).map((q) => (
                  <li key={q.id} className="flex gap-2.5 rounded-xl bg-surface/80 px-3.5 py-2.5 text-sm text-ink-muted ring-1 ring-border">
                    <Lock className="mt-0.5 size-3.5 shrink-0 text-ink-subtle" aria-hidden />
                    {q.text}
                  </li>
                ))}
              </ul>
            </LockedPanel>
          ) : (
            <ul className="mt-5 space-y-3">
              {topic.questions.map((q, i) => (
                <m.li key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4, ease: EASE_OUT }}>
                  <QuestionCard
                    question={q}
                    ctx={ctx}
                    weddingId={wedding.id}
                    open={openId === q.id}
                    onToggle={() => setOpenId(openId === q.id ? null : q.id)}
                    onSaved={reload}
                  />
                </m.li>
              ))}
            </ul>
          )}
        </m.section>
      </AnimatePresence>

      <CardDeck
        questions={usable}
        open={deckOpen}
        onClose={() => setDeckOpen(false)}
        onAnswer={(qid) => {
          const q = ALL_QUESTIONS.find((x) => x.id === qid)!
          setDeckOpen(false)
          setTopicId(q.topicId)
          setOpenId(qid)
          requestAnimationFrame(() => document.getElementById(`q-${qid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
        }}
      />
    </div>
  )
}

function SummaryTile({ label, value, tone }: { label: string; value: number | string; tone: 'primary' | 'success' | 'warning' | 'danger' }) {
  const color = { primary: 'text-primary', success: 'text-success', warning: 'text-warning', danger: 'text-danger' }[tone]
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <p className={cn('tabular mt-1 font-num text-3xl font-semibold', color)}>{value}</p>
    </div>
  )
}

function QuestionCard({ question, ctx, weddingId, open, onToggle, onSaved }: { question: DeepTalkQuestion; ctx: Ctx; weddingId: string; open: boolean; onToggle: () => void; onSaved: () => Promise<void> }) {
  const { me, partner } = ctx
  const { mineRow, partnerRow, status } = statusFor(question.id, ctx)
  const [draft, setDraft] = useState(mineRow?.answer ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panelId = `q-panel-${question.id}`

  useEffect(() => setDraft(mineRow?.answer ?? ''), [mineRow?.answer])

  async function save() {
    const answer = draft.trim()
    if (!answer) return setError('Tulis jawabanmu terlebih dahulu.')
    setSaving(true)
    setError(null)
    const demo = getCurrentDemoAccount()
    if (demo) {
      saveDemoDeepTalkAnswer(demo.id, weddingId, me.userId, question.id, answer, mineRow?.alignment ?? null)
      await onSaved()
      setSaving(false)
      return
    }

    const { error: err } = await db()
      .from('deeptalk_answers')
      .upsert({ wedding_id: weddingId, user_id: me.userId, question_id: question.id, answer, alignment: mineRow?.alignment ?? null })
    if (err) setError('Jawaban gagal disimpan. Coba lagi.')
    else await onSaved()
    setSaving(false)
  }

  async function rate(alignment: Alignment) {
    setError(null)
    const demo = getCurrentDemoAccount()
    if (demo) {
      saveDemoDeepTalkAnswer(demo.id, weddingId, me.userId, question.id, draft.trim() || (mineRow?.answer ?? ''), alignment)
      await onSaved()
      return
    }

    const { error: err } = await db()
      .from('deeptalk_answers')
      .update({ alignment })
      .eq('wedding_id', weddingId)
      .eq('user_id', me.userId)
      .eq('question_id', question.id)
    if (err) setError('Penilaian gagal disimpan. Coba lagi.')
    else await onSaved()
  }

  const dirty = draft.trim() !== (mineRow?.answer ?? '')

  return (
    <article id={`q-${question.id}`} className={cn('overflow-hidden rounded-card border bg-surface shadow-card transition-colors', open ? 'border-primary/30' : 'border-border')}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full cursor-pointer items-start gap-4 p-5 text-left sm:p-6"
        >
          <span className="flex-1">
            <span className="block text-[1.05rem] font-semibold leading-snug text-ink">{question.text}</span>
            <span className="mt-2 inline-block">
              <Badge tone={statusTone[status]}>{STATUS_LABEL[status]}</Badge>
            </span>
          </span>
          <m.span animate={{ rotate: open ? 180 : 0 }} transition={SPRING} className="mt-1 text-ink-subtle">
            <ChevronDown className="size-5" aria-hidden />
          </m.span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.35, ease: EASE_OUT }, opacity: { duration: 0.25, delay: 0.05 } } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-border px-5 pb-6 pt-5 sm:px-6">
              {question.hint && <p className="text-sm text-ink-muted">Petunjuk: {question.hint}</p>}

              <div>
                <label htmlFor={`ans-${question.id}`} className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <MemberAvatar member={me} size="sm" /> Jawabanmu
                </label>
                <textarea
                  id={`ans-${question.id}`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Tulis dengan jujur, ini ruang aman kalian berdua."
                  className="mt-2 block w-full resize-y rounded-xl border border-border bg-canvas px-3.5 py-3 text-[0.95rem] text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="tabular text-xs text-ink-subtle">{draft.length}/2000</span>
                  <Button size="sm" onClick={() => void save()} loading={saving} disabled={!dirty} icon={<Save className="size-4" aria-hidden />}>
                    {mineRow ? 'Perbarui' : 'Simpan & buka jawaban'}
                  </Button>
                </div>
              </div>

              {partner && (
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <MemberAvatar member={partner} size="sm" /> Jawaban {firstName(partner.name)}
                  </p>
                  <AnimatePresence mode="wait" initial={false}>
                    {partnerRow ? (
                      <m.blockquote
                        key="answer"
                        initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.6, ease: EASE_OUT }}
                        className="mt-2 whitespace-pre-line rounded-xl rounded-tl-sm border border-partner/20 bg-partner-soft/70 px-4 py-3 text-[0.95rem] text-ink"
                      >
                        {partnerRow.answer}
                      </m.blockquote>
                    ) : (
                      <m.p key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-3 text-sm text-ink-muted">
                        <Lock className="size-4 shrink-0" aria-hidden />
                        {status === 'pasangan_menunggu'
                          ? `${firstName(partner.name)} sudah menjawab. Simpan jawabanmu untuk membukanya.`
                          : `${firstName(partner.name)} belum menjawab pertanyaan ini.`}
                      </m.p>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {mineRow && partnerRow && (
                <m.fieldset initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <legend className="text-sm font-semibold text-ink">Menurutmu, pandangan kalian…</legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {ALIGNMENT_OPTIONS.map((opt) => {
                      const selected = mineRow.alignment === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => void rate(opt.value)}
                          className={cn(
                            'relative min-h-11 cursor-pointer rounded-xl border px-2 py-2 text-sm font-semibold transition-colors',
                            selected ? 'border-transparent text-white' : 'border-border bg-surface text-ink hover:bg-surface-muted',
                          )}
                        >
                          {selected && (
                            <m.span
                              layoutId={`align-${question.id}`}
                              transition={SPRING}
                              className={cn('absolute inset-0 rounded-xl', opt.value === 'sejalan' ? 'bg-success' : opt.value === 'berbeda' ? 'bg-danger' : 'bg-warning')}
                            />
                          )}
                          <span className="relative">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-2 text-xs text-ink-muted">
                    {partnerRow.alignment
                      ? `${firstName(partner!.name)} menilai: ${ALIGNMENT_OPTIONS.find((o) => o.value === partnerRow.alignment)!.label.toLowerCase()}.`
                      : `${firstName(partner!.name)} belum memberi penilaian.`}{' '}
                    Status akhir “sejalan” hanya jika kalian berdua sepakat.
                  </p>
                </m.fieldset>
              )}

              {error && <Alert tone="danger">{error}</Alert>}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </article>
  )
}

/** Mode kartu: kartu pertanyaan acak untuk diobrolkan langsung, dengan animasi balik kartu. */
function CardDeck({ questions, open, onClose, onAnswer }: { questions: typeof ALL_QUESTIONS; open: boolean; onClose: () => void; onAnswer: (qid: string) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Urutan diacak ulang setiap kali mode kartu dibuka
  const order = useMemo(() => [...questions].sort(() => Math.random() - 0.5), [open, questions])
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) {
      setI(0)
      setFlipped(false)
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open])

  const q = order[i % order.length]!
  const topic = TOPICS.find((t) => t.id === q.topicId)!

  function next() {
    setFlipped(false)
    setTimeout(() => setI((x) => x + 1), 180)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Mode kartu deep talk"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[min(92vw,26rem)] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex justify-end pb-3">
        <button type="button" onClick={onClose} className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink" aria-label="Tutup mode kartu">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div style={{ perspective: 1200 }}>
        <m.button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? 'Kartu terbuka' : 'Buka kartu'}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative block aspect-[3/4] w-full cursor-pointer rounded-[2rem] text-left"
        >
          {/* Depan */}
          <span className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-primary p-8 text-center text-on-primary shadow-pop" style={{ backfaceVisibility: 'hidden' }}>
            <svg aria-hidden className="absolute size-[30rem] opacity-25" viewBox="0 0 200 200">
              <circle cx="82" cy="100" r="56" fill="none" stroke="var(--color-gold)" strokeWidth="0.7" />
              <circle cx="118" cy="100" r="56" fill="none" stroke="var(--color-partner-light)" strokeWidth="0.7" />
            </svg>
            <MessageCircleHeart className="relative size-10 text-gold-on-dark" aria-hidden />
            <span className="relative mt-4 font-display text-4xl font-semibold">Deep talk</span>
            <span className="relative mt-2 text-sm text-on-primary/75">Ketuk untuk membuka kartu</span>
          </span>
          {/* Belakang */}
          <span
            className="absolute inset-0 flex flex-col justify-between rounded-[2rem] bg-canvas p-7 shadow-pop"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            aria-live="polite"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-text">{topic.title}</span>
            <span className="font-display text-[1.75rem] font-semibold leading-snug text-ink">{q.text}</span>
            <span className="text-sm text-ink-muted">Bergantian menjawab. Dengarkan sampai selesai sebelum menanggapi.</span>
          </span>
        </m.button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={next} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/90 font-semibold text-ink hover:bg-white">
          <Shuffle className="size-4" aria-hidden /> Kartu lain
        </button>
        <button type="button" onClick={() => onAnswer(q.id)} className="flex h-12 cursor-pointer items-center justify-center rounded-xl bg-gold font-semibold text-ink hover:brightness-105">
          Tulis jawaban
        </button>
      </div>
    </dialog>
  )
}
