import { useRef, useState, type ReactNode } from 'react'
import {
  Crown,
  ArrowRight,
  Brain,
  CalendarClock,
  Check,
  ChevronDown,
  FileSpreadsheet,
  Heart,
  ListChecks,
  Lock,
  MapPin,
  MessageCircle,
  MessageCircleHeart,
  Search,
  Smartphone,
  Store,
  Users,
  Wallet,
} from 'lucide-react'
import { useReducedMotion, useScroll, useTransform } from 'motion/react'
import { AnimatePresence, EASE_OUT, Float, Reveal, SPRING, Stagger, StaggerItem, m } from '@/components/motion'
import { ButtonLink } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Card'
import { usePublicPremiumPrice } from '@/hooks/usePremium'
import { DEFAULT_COVER } from '@/lib/config'
import { cn } from '@/lib/cn'
import { formatRupiah } from '@/lib/format'
import { DEEPTALK_FREE_COUNT, FREE_GUEST_LIMIT, PLAN_ROWS, PREMIUM_HIGHLIGHTS } from '@/lib/plans'

export function LandingPage() {
  return (
    <main>
      <Hero />
      <Problem />
      <Features />
      <KnowEachOther />
      <BudgetSection />
      <VendorSection />
      <HowItWorks />
      <Pricing />
      <Faq />
      <FinalCta />
    </main>
  )
}

function SectionHeading({ eyebrow, title, text, center, dark }: { eyebrow: string; title: ReactNode; text?: string; center?: boolean; dark?: boolean }) {
  return (
    <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <p className={cn('text-sm font-semibold uppercase tracking-[0.14em]', dark ? 'text-gold-on-dark' : 'text-gold-text')}>{eyebrow}</p>
      <h2 className={cn('mt-3 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl', dark ? 'text-white' : 'text-ink')}>{title}</h2>
      {text && <p className={cn('mt-4 text-lg', dark ? 'text-white/75' : 'text-ink-muted')}>{text}</p>}
    </Reveal>
  )
}

/* ---------------------------------------------------------------- Hero */

const HEADLINE = ['Rencanakan', 'pernikahan', 'berdua,', 'melangkah', 'serasi.']

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Parallax halus pada foto (dimatikan saat reduced motion)
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 80])
  const photoScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 1.08])

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(55%_60%_at_75%_20%,var(--color-gold-soft),transparent_70%),radial-gradient(35%_40%_at_95%_70%,var(--color-partner-soft),transparent_70%)]" />
      <div className="relative mx-auto grid grid-cols-1 max-w-6xl gap-14 px-4 pb-20 pt-8 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12 lg:pb-28">
        <div>
          <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }}>
            <Badge tone="gold" className="px-3 py-1 text-[0.8rem]">
              <Heart className="size-3.5 fill-gold-text/20" aria-hidden /> Wedding planner untuk calon pengantin Indonesia
            </Badge>
          </m.div>
          <h1 className="mt-6 font-display text-[3.2rem] font-semibold leading-[1.02] text-ink sm:text-[4.4rem]">
            <span className="sr-only">{HEADLINE.join(' ')}</span>
            <span aria-hidden>
              {HEADLINE.map((w, i) => (
                <m.span
                  key={w}
                  className={cn('mr-[0.22em] inline-block', i === 4 && 'italic text-primary')}
                  initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 + i * 0.08 }}
                >
                  {w}
                </m.span>
              ))}
            </span>
          </h1>
          <m.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.6 }}
            className="mt-6 max-w-xl text-lg text-ink-muted"
          >
            Satu akun untuk kalian berdua: susun anggaran, catat DP dan pelunasan vendor, ikuti checklist, lalu kenali pasangan lewat tes
            kepribadian dan deep talk sebelum hari bahagia.
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.72 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <ButtonLink to="/register" size="lg" className="shadow-glow">
              Mulai Rencanakan Pernikahan
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <a href="#kenali" className="inline-flex h-12 items-center justify-center rounded-xl px-6 font-semibold text-ink transition-colors hover:bg-surface-muted">
              Lihat fitur pasangan
            </a>
          </m.div>
          <m.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            {['Gratis untuk perencanaan dasar', 'Bisa diakses berdua', 'Data pribadi tidak dipublikasikan'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-4 text-primary" aria-hidden />
                {t}
              </li>
            ))}
          </m.ul>
        </div>

        {/* Foto dalam bingkai lengkung + kartu melayang */}
        <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
          <m.div
            initial={{ clipPath: 'inset(100% 0% 0% 0% round 999px 999px 28px 28px)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 999px 999px 28px 28px)' }}
            transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.1 }}
            className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[28px] bg-surface-muted shadow-pop"
          >
            <m.picture style={{ y: photoY, scale: photoScale }} className="absolute inset-0 block">
              <source srcSet={DEFAULT_COVER.webp} type="image/webp" />
              <img
                src={DEFAULT_COVER.jpg}
                alt="Sepasang pengantin memegang buku nikah merah dan hijau"
                className="h-full w-full object-cover object-[50%_45%]"
                fetchPriority="high"
              />
            </m.picture>
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent" />
          </m.div>
          <div aria-hidden className="absolute -inset-3 -z-10 rounded-t-[999px] rounded-b-[36px] border border-gold/50" />

          <m.div className="absolute -left-4 top-[18%] sm:-left-10" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.7, ease: EASE_OUT }}>
            <Float amplitude={7} duration={6}>
              <div aria-hidden className="rounded-2xl border border-white/60 bg-white/85 p-3.5 shadow-pop backdrop-blur-md">
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink-subtle">Tes kepribadian</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="rounded-lg bg-primary px-2 py-1 font-display text-lg font-semibold text-white">ISFJ</span>
                  <Heart className="size-4 fill-partner text-partner" />
                  <span className="rounded-lg bg-partner px-2 py-1 font-display text-lg font-semibold text-white">ENFP</span>
                </div>
              </div>
            </Float>
          </m.div>

          <m.div className="absolute -right-3 bottom-[22%] sm:-right-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.15, duration: 0.7, ease: EASE_OUT }}>
            <Float amplitude={9} duration={7} delay={0.8}>
              <div aria-hidden className="rounded-2xl border border-white/60 bg-white/85 p-3.5 shadow-pop backdrop-blur-md">
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink-subtle">Sisa anggaran</p>
                <p className="tabular font-num text-2xl font-semibold text-ink">Rp 86,5 jt</p>
                <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full w-[58%] rounded-full bg-gold" />
                </div>
              </div>
            </Float>
          </m.div>

          <m.div className="absolute -bottom-5 left-1/2 -translate-x-1/2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.7, ease: EASE_OUT }}>
            <Float amplitude={5} duration={5.5} delay={0.4}>
              <div aria-hidden className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-pop backdrop-blur-md">
                <span className="flex size-6 items-center justify-center rounded-full bg-success text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                Deep talk keuangan: sejalan
              </div>
            </Float>
          </m.div>
          <figcaption className="mt-10 text-center text-xs text-ink-subtle">Data pada kartu adalah ilustrasi</figcaption>
        </figure>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Problem */

function Problem() {
  const items = [
    { icon: FileSpreadsheet, title: 'Tersebar di banyak tempat', text: 'Anggaran di spreadsheet, bukti transfer di galeri, harga vendor di chat WhatsApp.' },
    { icon: Wallet, title: 'Tidak tahu posisi dana', text: 'Sulit membedakan uang yang sudah ada, yang sudah dibayar, dan tagihan yang masih menunggu.' },
    { icon: MessageCircleHeart, title: 'Sibuk acara, lupa ngobrol', text: 'Persiapan menyita waktu, padahal visi rumah tangga juga perlu disepakati sejak awal.' },
  ]
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <SectionHeading
          eyebrow="Kenapa Serasi"
          title="Pernikahan bukan hanya soal acara, tapi juga soal kalian berdua."
          text="Kami merangkum persiapan acara dan persiapan hati ke satu tempat yang sama, supaya keputusan diambil dengan tenang dan bersama."
        />
        <Stagger as="ul" className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map(({ icon: Icon, title, text }) => (
            <StaggerItem as="li" key={title} className="border-t-2 border-gold pt-6">
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-ink-muted">{text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Features */

function Features() {
  const small = [
    { icon: Users, title: 'Satu akun untuk berdua', text: 'Undang pasangan dengan link. Kalian melihat dan mengubah rencana yang sama.' },
    { icon: Store, title: 'Vendor tracker', text: 'Status kandidat sampai dipilih, harga penawaran, nilai kontrak, dan catatan negosiasi.' },
    { icon: ListChecks, title: 'Checklist & timeline', text: 'Dari lamaran, administrasi, akad, resepsi, hingga pasca-pernikahan. Semua bisa diedit.' },
    { icon: CalendarClock, title: 'Tamu & rundown', text: 'Kelompokkan tamu, rekap kehadiran, dan susun jadwal hari H yang nyaman dibaca dari HP.' },
    { icon: Smartphone, title: 'HP dan laptop', text: 'Website responsif, tanpa perlu memasang aplikasi.' },
  ]
  return (
    <section id="fitur" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading eyebrow="Fitur" title="Semua yang kalian butuhkan, saling terhubung." />
        <Stagger className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StaggerItem className="relative overflow-hidden rounded-[1.5rem] bg-primary p-7 text-on-primary sm:col-span-2 md:p-9 lg:row-span-2">
            <svg aria-hidden className="absolute -bottom-24 -right-20 size-80 opacity-20" viewBox="0 0 200 200">
              <circle cx="80" cy="100" r="60" fill="none" stroke="var(--color-gold)" strokeWidth="1" />
              <circle cx="120" cy="100" r="60" fill="none" stroke="var(--color-partner-light)" strokeWidth="1" />
            </svg>
            <Wallet className="size-7 text-gold" aria-hidden />
            <h3 className="mt-5 font-display text-4xl font-semibold">Wedding budget planner</h3>
            <p className="mt-3 max-w-lg text-on-primary/80">
              Kategori yang relevan untuk pernikahan Indonesia, dari katering per porsi, mahar dan seserahan, sampai prosesi adat. Semua
              nominal dalam rupiah, dan setiap angka di dashboard dihitung dari data yang kalian simpan.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {['14 kategori awal yang bisa diubah', 'Pengeluaran vs komitmen kontrak', 'Peringatan kategori melewati batas', 'DP & pelunasan tanpa hitung ganda'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-gold" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </StaggerItem>
          {small.map(({ icon: Icon, title, text }) => (
            <StaggerItem key={title}>
              <m.article whileHover={{ y: -4 }} transition={SPRING} className="h-full rounded-[1.5rem] border border-border bg-surface p-6 shadow-card transition-shadow hover:shadow-pop">
                <Icon className="size-6 text-gold-text" aria-hidden />
                <h3 className="mt-4 font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{text}</p>
              </m.article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Kenali pasangan */

function KnowEachOther() {
  return (
    <section id="kenali" className="relative scroll-mt-20 overflow-hidden bg-ink">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_70%_at_0%_0%,color-mix(in_srgb,var(--color-primary)_95%,transparent),transparent),radial-gradient(50%_70%_at_100%_100%,color-mix(in_srgb,var(--color-partner)_80%,transparent),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          dark
          eyebrow="Kenali pasanganmu"
          title="Siapkan acaranya, siapkan juga hatinya."
          text="Dua fitur untuk saling memahami sebelum menikah: tes kepribadian untuk mengenal karakter, dan deep talk untuk menyelaraskan visi dan misi."
        />
        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Reveal>
            <article className="h-full rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur sm:p-9">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white">
                <Brain className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-3xl font-semibold text-white">Tes kepribadian berdua</h3>
              <p className="mt-2 text-white/75">
                40 pernyataan kontekstual pernikahan, 16 tipe kepribadian. Pahami karakter pasangan, antisipasi konflik rumah tangga, dan cara terbaik menghadapi sifatnya saat beda pendapat.
              </p>
              <PersonalityDemo />
              <p className="mt-4 text-xs text-white/50">Terinspirasi kerangka MBTI®, bukan instrumen resmi. Bahan obrolan, bukan label.</p>
            </article>
          </Reveal>
          <Reveal delay={0.1}>
            <article className="h-full rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur sm:p-9">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-partner text-white">
                <MessageCircleHeart className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-3xl font-semibold text-white">Deep talk visi & misi</h3>
              <p className="mt-2 text-white/75">
                40 pertanyaan dalam 8 topik: visi, iman, keuangan, keluarga besar, anak, peran, konflik, dan gaya hidup. Jawaban pasangan
                terbuka setelah kamu menjawab, lalu kalian menilai apakah sejalan.
              </p>
              <DeepTalkDemo />
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function PersonalityDemo() {
  const rows = [
    { a: 'Introvert', b: 'Ekstrovert', same: false },
    { a: 'Pengamat', b: 'Intuitif', same: false },
    { a: 'Perasa', b: 'Perasa', same: true },
    { a: 'Terencana', b: 'Fleksibel', same: false },
  ]
  return (
    <div aria-hidden className="mt-7 rounded-2xl bg-white/[0.07] p-5">
      <div className="flex items-center justify-between">
        <Stagger className="flex gap-1 sm:gap-1.5" stagger={0.08}>
          {'ISFJ'.split('').map((l, i) => (
            <StaggerItem key={i} className="flex size-8 items-center justify-center rounded-lg bg-primary font-display text-xl font-semibold text-white sm:size-10 sm:rounded-xl sm:text-2xl">
              {l}
            </StaggerItem>
          ))}
        </Stagger>
        <Heart className="size-5 fill-partner-light/40 text-partner-light" />
        <Stagger className="flex gap-1 sm:gap-1.5" stagger={0.08} delay={0.3}>
          {'ENFP'.split('').map((l, i) => (
            <StaggerItem key={i} className="flex size-8 items-center justify-center rounded-lg bg-partner font-display text-xl font-semibold text-white sm:size-10 sm:rounded-xl sm:text-2xl">
              {l}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.a + r.b} className="flex items-center justify-between rounded-lg bg-white/[0.06] px-3 py-2 text-white/85">
            <span>{r.same ? `Sama-sama ${r.a.toLowerCase()}` : `${r.a} & ${r.b.toLowerCase()}`}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', r.same ? 'bg-primary text-white' : 'bg-gold/90 text-ink')}>{r.same ? 'Sama' : 'Saling melengkapi'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeepTalkDemo() {
  return (
    <div aria-hidden className="mt-7 space-y-3">
      <div className="rounded-2xl bg-white/[0.07] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-on-dark">Keuangan</p>
        <p className="mt-2 font-display text-xl font-semibold text-white">Apakah keuangan kita digabung, dipisah, atau sebagian?</p>
        <div className="mt-4 space-y-2">
          <m.p initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }} className="max-w-[85%] rounded-xl rounded-tl-sm bg-primary px-3.5 py-2.5 text-sm text-white">
            Digabung untuk kebutuhan rumah, sisanya tabungan masing-masing.
          </m.p>
          <m.p initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.5 }} className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-partner px-3.5 py-2.5 text-sm text-white">
            Setuju, dengan catatan belanja di atas 2 juta dibicarakan dulu.
          </m.p>
        </div>
        <m.p initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, ...SPRING }} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">
          <Check className="size-3.5" strokeWidth={3} /> Kalian berdua menilai: sejalan
        </m.p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/20 px-4 py-3 text-sm text-white/70">
        <Lock className="size-4 shrink-0" />
        Jawaban pasangan terbuka setelah kamu menjawab, agar tidak saling memengaruhi.
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Budget */

function BudgetSection() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <SectionHeading eyebrow="Kejelasan finansial" title="Sisa anggaran bukan berarti uangnya sudah ada." text="Kami memisahkan konsep yang sering tertukar, supaya kalian tahu kondisi sebenarnya." />
          <Stagger as="div" className="mt-8 space-y-5">
            {[
              ['Dana tersedia', 'Uang yang benar-benar sudah terkumpul untuk pernikahan.'],
              ['Komitmen vendor', 'Nilai kontrak yang sudah disepakati. Belum menjadi pengeluaran sampai dibayar.'],
              ['Pengeluaran aktual', 'Hanya pembayaran yang sudah terjadi. DP dan pelunasan atas satu kontrak tidak dihitung dua kali.'],
              ['Sisa tagihan', 'Nilai kontrak dikurangi pembayaran yang sudah dilakukan.'],
            ].map(([term, def]) => (
              <StaggerItem key={term} className="flex gap-4">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-gold" aria-hidden />
                <div>
                  <p className="font-semibold text-ink">{term}</p>
                  <p className="text-ink-muted">{def}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
        <Reveal>
          <figure>
            <div className="rounded-[1.5rem] border border-border bg-canvas p-5 sm:p-7" aria-hidden>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Kontrak vendor</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-ink">Dekorasi pelaminan</p>
                </div>
                <Badge tone="primary">Dipilih</Badge>
              </div>
              <p className="tabular mt-4 text-3xl font-bold text-ink">Rp 18.000.000</p>
              <m.div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface-muted" initial="hidden" whileInView="show" viewport={{ once: true }}>
                <m.div
                  className="h-full origin-left bg-primary"
                  variants={{ hidden: { scaleX: 0 }, show: { scaleX: 0.5, transition: { duration: 1, ease: EASE_OUT, delay: 0.2 } } }}
                />
              </m.div>
              <ul className="mt-5 divide-y divide-border text-sm">
                <li className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-2 text-ink">
                    <Check className="size-4 text-success" /> DP 50%
                  </span>
                  <span className="tabular font-semibold">Rp 9.000.000</span>
                </li>
                <li className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <CalendarClock className="size-4 text-warning" /> Pelunasan · H-14
                  </span>
                  <span className="tabular font-semibold text-ink-muted">Rp 9.000.000</span>
                </li>
              </ul>
              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                <div>
                  <p className="text-ink-muted">Sudah dibayar</p>
                  <p className="tabular font-bold text-ink">Rp 9.000.000</p>
                </div>
                <div>
                  <p className="text-ink-muted">Sisa tagihan</p>
                  <p className="tabular font-bold text-ink">Rp 9.000.000</p>
                </div>
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-ink-subtle">Ilustrasi pencatatan DP dan pelunasan</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Vendor */

function VendorSection() {
  return (
    <section>
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
        <Reveal className="order-last lg:order-first">
          <figure>
            <div className="rounded-[1.5rem] border border-border bg-surface p-5 shadow-card sm:p-6" aria-hidden>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-canvas px-3.5 text-sm text-ink-subtle">
                <Search className="size-4" /> Cari katering di Bandung…
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Katering', 'Bandung', 'Rp 50–100 rb/porsi', 'Terverifikasi'].map((c, i) => (
                  <span key={c} className={cn('rounded-full px-3 py-1 text-xs font-semibold', i < 2 ? 'bg-primary text-on-primary' : 'bg-surface-muted text-ink-muted')}>
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">Nama vendor contoh</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                      <MapPin className="size-3.5" /> Bandung · melayani Jawa Barat
                    </p>
                  </div>
                  <Badge tone="success">Terverifikasi</Badge>
                </div>
                <p className="tabular mt-3 text-sm font-semibold text-ink">Rp 65.000 – Rp 90.000 / porsi</p>
                <p className="text-xs text-ink-subtle">Estimasi harga · diperbarui per tanggal tertentu</p>
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-ink-subtle">Ilustrasi kartu vendor, bukan vendor sungguhan</figcaption>
          </figure>
        </Reveal>
        <div>
          <SectionHeading
            eyebrow="Vendor lokal"
            title="Bandingkan vendor dengan konteks yang jujur."
            text="Kisaran harga selalu diberi keterangan apakah estimasi atau sudah diverifikasi, beserta tanggal pembaruannya. Harga termurah tidak otomatis kami sebut yang terbaik."
          />
          <Reveal delay={0.1}>
            <p className="mt-6 flex items-start gap-2 rounded-xl bg-gold-soft/70 p-4 text-sm text-ink-muted">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-gold-text" aria-hidden />
              Direktori vendor publik sedang disusun bertahap. Sambil menunggu, kalian sudah bisa mencatat vendor pilihan sendiri.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- How it works */

function HowItWorks() {
  const steps = [
    { title: 'Daftar gratis', text: 'Daftar dengan email, lalu isi profil pernikahan. Kategori anggaran dan checklist langsung dibuat.' },
    { title: 'Undang pasangan', text: 'Kirim link undangan lewat WhatsApp. Pasanganmu bergabung ke workspace yang sama.' },
    { title: 'Rencanakan & kenali', text: 'Kelola anggaran dan vendor bersama, kerjakan tes kepribadian, dan buka deep talk satu per satu.' },
  ]
  return (
    <section id="cara-kerja" className="scroll-mt-20 bg-primary text-on-primary">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading dark eyebrow="Cara kerja" title="Tiga langkah untuk mulai berdua." />
        <Stagger as="ol" className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <StaggerItem as="li" key={s.title} className="border-t border-white/20 pt-6">
              <span className="font-display text-5xl font-semibold text-gold-on-dark">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-on-primary/75">{s.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Pricing */

function Pricing() {
  const price = usePublicPremiumPrice()
  const free = PLAN_ROWS.filter((r) => r.free !== false).map((r) => (typeof r.free === 'string' ? `${r.label}: ${r.free}` : r.label))
  return (
    <section id="harga" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading center eyebrow="Paket" title="Mulai gratis. Upgrade sekali, untuk berdua." />
        <Stagger className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          <StaggerItem className="flex flex-col rounded-[1.5rem] border border-border bg-surface p-7 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-3xl font-semibold">Gratis</h3>
              <Badge tone="primary">Selamanya</Badge>
            </div>
            <p className="mt-3 font-num text-4xl font-bold tabular">Rp 0</p>
            <p className="mt-1 text-ink-muted">Semua yang dibutuhkan untuk merencanakan pernikahan berdua.</p>
            <ul className="mt-6 flex-1 space-y-3">
              {free.map((f) => (
                <li key={f} className="flex items-start gap-3 text-ink">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <ButtonLink to="/register" variant="secondary" size="lg" className="mt-8 w-full">
              Daftar Gratis
            </ButtonLink>
          </StaggerItem>
          <StaggerItem className="flex flex-col rounded-[1.5rem] border-2 border-gold bg-surface p-7 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-3xl font-semibold">
                <Crown className="size-6 text-gold-text" aria-hidden /> Premium
              </h3>
              <Badge tone="gold">Sekali bayar</Badge>
            </div>
            <p className="mt-3 font-num text-4xl font-bold tabular">{formatRupiah(price)}</p>
            <p className="mt-1 text-ink-muted">Untuk berdua, aktif selamanya. Tanpa langganan.</p>
            <p className="mt-6 text-sm font-semibold text-ink">Semua fitur Gratis, ditambah:</p>
            <ul className="mt-3 flex-1 space-y-3">
              {PREMIUM_HIGHLIGHTS.map((h) => (
                <li key={h.title} className="flex items-start gap-3 text-ink">
                  <Check className="mt-0.5 size-5 shrink-0 text-gold-text" aria-hidden />
                  <span>
                    <strong className="font-semibold">{h.title}.</strong> <span className="text-ink-muted">{h.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <ButtonLink to="/register" size="lg" className="mt-8 w-full">
              Mulai gratis, upgrade kapan saja
            </ButtonLink>
            <p className="mt-3 text-center text-xs text-ink-subtle">Bayar dengan QRIS dari e-wallet atau m-banking apa pun.</p>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- FAQ */

const FAQS = [
  { q: 'Apakah benar-benar gratis?', a: `Ya. Budget, tabungan bersama, vendor, checklist, Berkas KUA, rundown, akses berdua, ringkasan tes kepribadian, ${DEEPTALK_FREE_COUNT} pertanyaan deep talk, dan daftar tamu hingga ${FREE_GUEST_LIMIT} undangan gratis selamanya. Premium opsional dan cukup dibayar sekali untuk berdua.` },
  { q: 'Bagaimana cara membayar Premium?', a: 'Dari halaman Premium di aplikasi, pindai QRIS dengan e-wallet atau m-banking apa pun. Nominal sudah terisi otomatis. Premium aktif di akun kalian berdua setelah pembayaran kami verifikasi, biasanya kurang dari 1×24 jam.' },
  { q: 'Bagaimana pasangan saya bergabung?', a: 'Setelah membuat workspace, buka halaman Kita lalu buat link undangan. Kirim lewat WhatsApp; pasanganmu cukup daftar atau masuk, lalu otomatis terhubung. Satu workspace untuk dua orang.' },
  { q: 'Apakah pasangan bisa langsung melihat jawaban deep talk saya?', a: 'Tidak. Jawaban pasangan untuk sebuah pertanyaan baru terbuka setelah kamu menjawab pertanyaan yang sama, begitu juga hasil tes kepribadian. Tujuannya agar jawaban kalian jujur dan tidak saling memengaruhi.' },
  { q: 'Apakah tes kepribadiannya resmi?', a: 'Bukan. Tes ini terinspirasi kerangka 16 tipe kepribadian (MBTI®) dengan pernyataan yang kami susun sendiri. Gunakan sebagai bahan obrolan untuk saling memahami, bukan untuk melabeli atau menilai kecocokan.' },
  { q: 'Apakah data keuangan dan obrolan kami aman?', a: 'Data workspace hanya bisa diakses oleh kalian berdua, dibatasi di tingkat database. Kami tidak memublikasikan data keuangan, daftar tamu, jawaban deep talk, maupun foto kalian. Foto sampul disimpan privat.' },
  { q: 'Apakah terhubung dengan KUA atau Dukcapil?', a: 'Tidak. Kami menyediakan checklist untuk membantu mempersiapkan dokumen, tetapi pendaftaran pernikahan tetap dilakukan langsung di instansi terkait.' },
]

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading center eyebrow="FAQ" title="Pertanyaan yang sering ditanyakan" />
        <Reveal className="mt-10 divide-y divide-border border-y border-border">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    className="flex min-h-[3.5rem] w-full cursor-pointer items-center justify-between gap-4 py-4 text-left font-semibold text-ink"
                  >
                    {f.q}
                    <m.span animate={{ rotate: isOpen ? 180 : 0 }} transition={SPRING} className="shrink-0 text-ink-muted">
                      <ChevronDown className="size-5" aria-hidden />
                    </m.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div
                      id={`faq-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.35, ease: EASE_OUT }, opacity: { duration: 0.25, delay: 0.05 } } }}
                      exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-ink-muted">{f.a}</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-20">
            <picture aria-hidden>
              <source srcSet={DEFAULT_COVER.webp} type="image/webp" />
              <img src={DEFAULT_COVER.jpg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </picture>
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-partner/80" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">Hari bahagia dimulai dari rencana yang serasi.</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/80">Buat workspace pernikahan kalian sekarang. Gratis, dan bisa langsung dipakai berdua.</p>
              <ButtonLink to="/register" size="lg" variant="secondary" className="mt-8 border-transparent">
                Mulai Rencanakan Pernikahan
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

