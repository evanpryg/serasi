import type { ReactNode } from "react"
import { Link } from "react-router"
import { ArrowRight, Brain, Check, Clock, MessageCircleHeart } from 'lucide-react'
import { EASE_OUT, Stagger, StaggerItem, m } from '@/components/motion'
import { CoverImage, CoverPhotoControls, MemberAvatar } from '@/components/couple/Cover'
import { PartnerInvite } from '@/components/couple/PartnerInvite'
import { Skeleton } from '@/components/ui/Feedback'
import { firstName, useWedding, useWorkspace } from '@/auth/WorkspaceProvider'
import { useDeepTalk, usePersonality } from '@/hooks/useCoupleData'
import { ALL_QUESTIONS, questionStatus } from '@/lib/deeptalk'
import { TYPE_PROFILES, isTypeCode } from '@/lib/personality'
import { daysBetween, formatDate, parseDateOnly } from '@/lib/format'
import { cn } from '@/lib/cn'

export function KitaPage() {
  const wedding = useWedding()
  const { me, partner, couple } = useWorkspace()
  const personality = usePersonality(wedding.id)
  const deeptalk = useDeepTalk(wedding.id)
  if (!me) return null

  const daysLeft = wedding.wedding_date ? daysBetween(new Date(), parseDateOnly(wedding.wedding_date)) : null
  const names = partner ? `${couple.map((mb) => firstName(mb.name)).join(' & ')}` : wedding.title

  // Status tes kepribadian
  let personalityStatus: { label: string; done: boolean; detail: string } = { label: 'Belum dimulai', done: false, detail: '28 pernyataan · ±5 menit' }
  if (personality.state.status === 'ready') {
    const { results, completedBy } = personality.state.data
    const mine = results.find((r) => r.user_id === me.userId)
    const partnerDone = partner ? completedBy.includes(partner.userId) : false
    if (mine && isTypeCode(mine.type_code)) {
      personalityStatus = {
        label: `${mine.type_code} · ${TYPE_PROFILES[mine.type_code].nickname}`,
        done: true,
        detail: partner ? (partnerDone ? `Hasil ${firstName(partner.name)} sudah bisa dilihat` : `Menunggu ${firstName(partner.name)}`) : 'Undang pasangan untuk membandingkan',
      }
    } else if (partnerDone && partner) {
      personalityStatus = { label: 'Giliranmu', done: false, detail: `${firstName(partner.name)} sudah selesai, hasilnya terbuka setelah kamu mengerjakan` }
    }
  }

  // Status deep talk
  let deeptalkStats = { mine: 0, aligned: 0, waitingForMe: 0 }
  if (deeptalk.state.status === 'ready') {
    const { answers, answered } = deeptalk.state.data
    for (const q of ALL_QUESTIONS) {
      const mineRow = answers.find((a) => a.user_id === me.userId && a.question_id === q.id)
      const partnerRow = partner ? answers.find((a) => a.user_id === partner.userId && a.question_id === q.id) : undefined
      const s = questionStatus({
        mineAnswered: Boolean(mineRow),
        partnerAnswered: partner ? answered.has(`${partner.userId}:${q.id}`) : false,
        mineAlignment: mineRow?.alignment ?? null,
        partnerAlignment: partnerRow?.alignment ?? null,
      })
      if (mineRow) deeptalkStats.mine++
      if (s === 'sejalan') deeptalkStats.aligned++
      if (s === 'pasangan_menunggu') deeptalkStats.waitingForMe++
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero foto pasangan */}
      <m.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative overflow-hidden rounded-[1.75rem] shadow-card"
      >
        <CoverImage path={wedding.cover_photo_path} alt={`Foto ${names}`} className="h-[22rem] sm:h-[26rem]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <CoverPhotoControls className="absolute right-4 top-4 z-10" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
          <div className="flex -space-x-3">
            {couple.map((mb) => (
              <MemberAvatar key={mb.userId} member={mb} />
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold-on-dark">Kita berdua</p>
          <h1 className="mt-1 font-display text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl">{names}</h1>
          <p className="mt-2 text-white/85">
            {wedding.wedding_date ? formatDate(wedding.wedding_date) : 'Tanggal belum ditentukan'}
            {daysLeft != null && daysLeft > 0 && ` · ${daysLeft} hari lagi`}
          </p>
        </div>
      </m.section>

      <PartnerInvite />

      <Stagger className="grid gap-4 md:grid-cols-2">
        <StaggerItem>
          <FeatureCard
            to="/app/kita/kepribadian"
            icon={<Brain className="size-6" aria-hidden />}
            tone="primary"
            title="Tes kepribadian"
            description="Kenali cara kalian mengisi energi, mengambil keputusan, dan menghadapi rencana."
            loading={personality.state.status === 'loading'}
            status={personalityStatus.label}
            statusDone={personalityStatus.done}
            detail={personalityStatus.detail}
          />
        </StaggerItem>
        <StaggerItem>
          <FeatureCard
            to="/app/kita/deeptalk"
            icon={<MessageCircleHeart className="size-6" aria-hidden />}
            tone="partner"
            title="Deep talk"
            description="Visi, keuangan, keluarga, anak, dan cara berdamai. Cek apakah kalian sejalan."
            loading={deeptalk.state.status === 'loading'}
            status={`${deeptalkStats.mine}/${ALL_QUESTIONS.length} dijawab · ${deeptalkStats.aligned} sejalan`}
            statusDone={deeptalkStats.mine === ALL_QUESTIONS.length}
            detail={
              deeptalkStats.waitingForMe > 0 && partner
                ? `${deeptalkStats.waitingForMe} jawaban ${firstName(partner.name)} menunggumu`
                : 'Jawaban pasangan terbuka setelah kamu menjawab'
            }
          />
        </StaggerItem>
      </Stagger>
    </div>
  )
}

function FeatureCard(props: {
  to: string
  icon: ReactNode
  tone: 'primary' | 'partner'
  title: string
  description: string
  loading: boolean
  status: string
  statusDone: boolean
  detail: string
}) {
  const { to, icon, tone, title, description, loading, status, statusDone, detail } = props
  return (
    <m.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="h-full">
      <Link
        to={to}
        className="group flex h-full flex-col rounded-[1.5rem] border border-border bg-surface p-6 shadow-card transition-shadow hover:shadow-pop sm:p-7"
      >
        <span className={cn('flex size-12 items-center justify-center rounded-2xl', tone === 'primary' ? 'bg-primary text-on-primary' : 'bg-partner text-white')}>{icon}</span>
        <h2 className="mt-5 font-display text-3xl font-semibold text-ink">{title}</h2>
        <p className="mt-1.5 text-ink-muted">{description}</p>
        <div className="mt-6 flex-1" />
        {loading ? (
          <Skeleton className="h-12 rounded-xl" />
        ) : (
          <div className="rounded-xl bg-canvas p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              {statusDone ? <Check className="size-4 text-success" aria-hidden /> : <Clock className="size-4 text-gold-text" aria-hidden />}
              {status}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">{detail}</p>
          </div>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary">
          Buka <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </Link>
    </m.div>
  )
}
