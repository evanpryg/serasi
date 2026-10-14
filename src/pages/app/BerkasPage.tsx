import { useEffect, useState } from 'react'
import { CalendarClock, Check, ChevronDown, ExternalLink, FileCheck2, Landmark, Scale, Users } from 'lucide-react'
import { AnimatePresence, EASE_OUT, SPRING, m } from '@/components/motion'
import { MemberAvatar } from '@/components/couple/Cover'
import { Card } from '@/components/ui/Card'
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { HowTo, PageHeader } from '@/components/ui/PageKit'
import { firstName, useWedding, useWorkspace, type Member } from '@/auth/WorkspaceProvider'
import { useDocuments } from '@/hooks/useDocuments'
import { cn } from '@/lib/cn'
import type { DocumentSide, DocumentStatus } from '@/lib/database.types'
import { daysBetween, formatDate, parseDateOnly, toDateOnly } from '@/lib/format'
import {
  KUA_SOURCE,
  docProgress,
  docState,
  docsFor,
  registrationDeadline,
  statusKey,
  toStatusMap,
  type DocStatusMap,
  type KuaDoc,
} from '@/lib/kuaDocuments'
import { SIDE_LABEL, resolveSide, type MemberSide } from '@/lib/side'

/** Warna aksen per kolom. Bersama = primary (warna user yang login). */
const COLUMN_TONE: Record<DocumentSide, { fill: string; text: string; soft: string; ring: string; bar: string }> = {
  cpp: { fill: 'bg-cpp border-cpp', text: 'text-cpp', soft: 'bg-cpp-soft', ring: 'border-cpp', bar: 'bg-cpp' },
  cpw: { fill: 'bg-cpw border-cpw', text: 'text-cpw', soft: 'bg-cpw-soft', ring: 'border-cpw', bar: 'bg-cpw' },
  joint: { fill: 'bg-primary border-primary', text: 'text-primary', soft: 'bg-primary-soft', ring: 'border-primary', bar: 'bg-primary' },
}

const TAB_HASH = /^#(cpp|cpw|joint)$/

export function BerkasPage({ showHeader = true }: { showHeader?: boolean } = {}) {
  const wedding = useWedding()
  const { me, couple } = useWorkspace()
  const { state, reload, setStatus } = useDocuments(wedding.id)
  const mySide: MemberSide = me ? resolveSide(me) : 'cpp'
  const [tab, setTab] = useState<DocumentSide>(() => {
    const hash = window.location.hash.match(TAB_HASH)?.[1]
    return (hash as DocumentSide | undefined) ?? mySide
  })
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    history.replaceState(null, '', `#${tab}`)
  }, [tab])

  const memberBySide = (side: MemberSide): Member | undefined => couple.find((mb) => resolveSide(mb) === side)

  const update = (docKey: string, side: DocumentSide, status: DocumentStatus | null) => {
    setSaveError(null)
    setStatus(docKey, side, status).catch((e: unknown) => setSaveError(e instanceof Error ? e.message : 'Gagal menyimpan.'))
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <PageHeader
          title="Berkas nikah"
          description={
            <>
              Syarat resmi daftar nikah di KUA menurut {KUA_SOURCE.title}. Centang yang sudah siap — pasanganmu melihat progres yang sama.
            </>
          }
        />
      )}

      <HowTo
        id="berkas"
        steps={[
          <>Masing-masing <strong className="text-ink">CPP & CPW</strong> menyiapkan berkas di tab namanya.</>,
          <>Tandai dokumen kondisional yang <strong className="text-ink">berlaku</strong> untukmu (mis. akad beda kecamatan).</>,
          <>Daftar ke KUA / SIMKAH <strong className="text-ink">≥ 10 hari kerja</strong> sebelum akad, lalu ikut bimbingan & pemeriksaan nikah.</>,
        ]}
      />

      {state.status === 'loading' && <Skeleton className="h-44 rounded-card" />}
      {state.status === 'error' &&
        (state.missingTable ? (
          <Alert tone="warning" title="Fitur berkas belum aktif">
            Database perlu diperbarui (migration <code>20261013000008_bride_groom_documents.sql</code>). Setelah dijalankan di Supabase, muat ulang halaman ini.
          </Alert>
        ) : (
          <ErrorState message="Berkas gagal dimuat. Periksa koneksi lalu coba lagi." onRetry={() => void reload()} />
        ))}

      {state.status === 'ready' && (
        <BerkasContent
          map={toStatusMap(state.data)}
          tab={tab}
          onTab={setTab}
          mySide={mySide}
          memberBySide={memberBySide}
          weddingDate={wedding.wedding_date}
          onUpdate={update}
        />
      )}

      {saveError && (
        <Alert tone="danger" className="sticky bottom-24 z-20 lg:bottom-6">
          {saveError}
        </Alert>
      )}

      <SourceCard />
    </div>
  )
}

function BerkasContent({
  map,
  tab,
  onTab,
  mySide,
  memberBySide,
  weddingDate,
  onUpdate,
}: {
  map: DocStatusMap
  tab: DocumentSide
  onTab: (s: DocumentSide) => void
  mySide: MemberSide
  memberBySide: (s: MemberSide) => Member | undefined
  weddingDate: string | null
  onUpdate: (docKey: string, side: DocumentSide, status: DocumentStatus | null) => void
}) {
  const columns: DocumentSide[] = ['cpp', 'cpw', 'joint']
  const progress = Object.fromEntries(columns.map((c) => [c, docProgress(c, map)])) as Record<DocumentSide, { done: number; total: number }>
  const docs = docsFor(tab)
  const required = docs.filter((d) => d.kind !== 'kondisional')
  const conditional = docs.filter((d) => d.kind === 'kondisional')
  const tabMember = tab === 'joint' ? undefined : memberBySide(tab)

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {columns.map((col) => (
            <ProgressTile
              key={col}
              side={col}
              member={col === 'joint' ? undefined : memberBySide(col)}
              isMine={col === mySide}
              progress={progress[col]}
              active={tab === col}
              onSelect={() => onTab(col)}
            />
          ))}
        </div>
        <Deadline weddingDate={weddingDate} />
      </Card>

      <div role="tablist" aria-label="Berkas milik" className="flex gap-1 rounded-2xl bg-surface-muted p-1">
        {columns.map((col) => {
          const active = tab === col
          const label = col === 'joint' ? 'Bersama' : SIDE_LABEL[col].short
          const name = col === 'joint' ? 'Langkah' : firstName(memberBySide(col)?.name ?? SIDE_LABEL[col].gender)
          return (
            <button
              key={col}
              type="button"
              role="tab"
              id={`tab-${col}`}
              aria-selected={active}
              aria-controls="berkas-panel"
              onClick={() => onTab(col)}
              className={cn(
                'relative flex min-h-12 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl px-2 text-center transition-colors',
                active ? 'text-white' : 'text-ink-muted hover:text-ink',
              )}
            >
              {active && <m.span layoutId="berkas-tab" transition={SPRING} className={cn('absolute inset-0 rounded-xl shadow-sm', COLUMN_TONE[col].bar)} />}
              <span className="relative text-[0.7rem] font-bold uppercase tracking-[0.12em] opacity-80">{label}</span>
              <span className="relative max-w-full truncate text-sm font-semibold">{name}</span>
            </button>
          )
        })}
      </div>

      <section id="berkas-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-6">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="space-y-6"
          >
            {tab !== 'joint' && tab !== mySide && tabMember && (
              <p className="text-sm text-ink-muted">
                Ini berkas {firstName(tabMember.name)}. Kamu boleh ikut mencentang kalau sudah membantu menyiapkannya.
              </p>
            )}

            <DocSection
              title={tab === 'joint' ? 'Langkah di KUA' : 'Wajib disiapkan'}
              hint={tab === 'joint' ? 'Dilakukan berdua bersama wali.' : 'Berlaku untuk semua calon pengantin.'}
              icon={tab === 'joint' ? <Users className="size-4" aria-hidden /> : <FileCheck2 className="size-4" aria-hidden />}
            >
              {required.map((doc) => (
                <DocRow key={doc.key} doc={doc} side={tab} status={map.get(statusKey(doc.key, tab))} onUpdate={onUpdate} />
              ))}
            </DocSection>

            {conditional.length > 0 && (
              <DocSection
                title="Hanya jika berlaku"
                hint="Nyalakan yang sesuai kondisimu; yang lain biarkan mati."
                icon={<Scale className="size-4" aria-hidden />}
              >
                {conditional.map((doc) => (
                  <DocRow key={doc.key} doc={doc} side={tab} status={map.get(statusKey(doc.key, tab))} onUpdate={onUpdate} />
                ))}
              </DocSection>
            )}
          </m.div>
        </AnimatePresence>
      </section>
    </>
  )
}

function ProgressTile({
  side,
  member,
  isMine,
  progress,
  active,
  onSelect,
}: {
  side: DocumentSide
  member?: Member
  isMine: boolean
  progress: { done: number; total: number }
  active: boolean
  onSelect: () => void
}) {
  const tone = COLUMN_TONE[side]
  const pct = progress.total ? progress.done / progress.total : 0
  const complete = progress.total > 0 && progress.done === progress.total
  const title = side === 'joint' ? 'Bersama' : member ? firstName(member.name) : SIDE_LABEL[side].long
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn('group flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors sm:p-5', active ? tone.soft : 'hover:bg-surface-muted/60')}
    >
      {member ? (
        <MemberAvatar member={member} size="md" />
      ) : (
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full text-white', tone.bar)} aria-hidden>
          <Landmark className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={cn('text-[0.68rem] font-bold uppercase tracking-[0.12em]', tone.text)}>
            {side === 'joint' ? 'KUA' : SIDE_LABEL[side].short}
          </span>
          {isMine && <span className="text-[0.68rem] font-semibold text-ink-subtle">· kamu</span>}
        </span>
        <span className="block truncate font-semibold text-ink">{title}</span>
        <span className="mt-2 flex items-center gap-2.5">
          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted ring-1 ring-border/60">
            <m.span
              className={cn('absolute inset-0 origin-left rounded-full', tone.bar)}
              initial={false}
              animate={{ scaleX: pct }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            />
          </span>
          <span className={cn('shrink-0 text-xs font-semibold tabular', complete ? 'text-success' : 'text-ink-muted')}>
            {complete ? 'Lengkap' : `${progress.done}/${progress.total}`}
          </span>
        </span>
      </span>
    </button>
  )
}

function Deadline({ weddingDate }: { weddingDate: string | null }) {
  if (!weddingDate) {
    return (
      <p className="flex items-center gap-2 border-t border-border bg-canvas/60 px-4 py-3 text-sm text-ink-muted sm:px-5">
        <CalendarClock className="size-4 shrink-0 text-gold-text" aria-hidden />
        Isi tanggal akad di Pengaturan untuk melihat batas daftar ke KUA.
      </p>
    )
  }
  const deadline = registrationDeadline(parseDateOnly(weddingDate))
  const left = daysBetween(new Date(), deadline)
  const urgent = left <= 14
  return (
    <div className={cn('flex items-start gap-2.5 border-t px-4 py-3 text-sm sm:px-5', urgent ? 'border-warning/25 bg-warning-soft' : 'border-border bg-canvas/60')}>
      <CalendarClock className={cn('mt-0.5 size-4 shrink-0', urgent ? 'text-warning' : 'text-gold-text')} aria-hidden />
      <p className="text-ink-muted">
        Daftar kehendak nikah paling lambat{' '}
        <strong className="text-ink">{formatDate(toDateOnly(deadline))}</strong>
        {left >= 0 ? <span className="tabular"> ({left === 0 ? 'hari ini' : `${left} hari lagi`})</span> : <span className="font-semibold text-warning"> (sudah lewat — perlu dispensasi camat)</span>}
        . Dihitung 10 hari kerja sebelum akad, belum termasuk libur nasional.
      </p>
    </div>
  )
}

function DocSection({ title, hint, icon, children }: { title: string; hint: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-ink">
          <span className="text-gold-text">{icon}</span>
          {title}
        </h2>
        <p className="hidden text-xs text-ink-subtle sm:block">{hint}</p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-card">{children}</ul>
    </div>
  )
}

function DocRow({
  doc,
  side,
  status,
  onUpdate,
}: {
  doc: KuaDoc
  side: DocumentSide
  status: DocumentStatus | undefined
  onUpdate: (docKey: string, side: DocumentSide, status: DocumentStatus | null) => void
}) {
  const [open, setOpen] = useState(false)
  const st = docState(doc, status)
  const tone = COLUMN_TONE[side]
  const conditional = doc.kind === 'kondisional'
  const done = st === 'done'
  const off = st === 'off' || st === 'na'
  const detailId = `doc-${side}-${doc.key}`

  // Centang: wajib/umum bolak-balik todo ↔ done; kondisional (yang berlaku) todo ↔ done.
  const toggleDone = () => onUpdate(doc.key, side, done ? (conditional ? 'todo' : null) : 'done')

  return (
    <li className={cn('transition-colors', done && 'bg-success-soft/25')}>
      <div className="flex items-start gap-3 p-3.5 sm:gap-3.5 sm:p-4">
        {/* Kondisional yang belum berlaku tidak punya centang; tampil saklar "berlaku" di kanan */}
        {conditional && off ? (
          <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong" aria-hidden />
        ) : (
          <button
            type="button"
            onClick={toggleDone}
            aria-pressed={done}
            aria-label={done ? `Batalkan centang ${doc.title}` : `Tandai ${doc.title} sudah siap`}
            className="-m-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <m.span
              animate={{ scale: done ? [1, 1.18, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'flex size-7 items-center justify-center rounded-full border-2 transition-colors',
                done ? cn(tone.fill, 'text-white') : st === 'na' ? 'border-border bg-surface-muted' : cn('bg-surface', tone.ring, 'border-opacity-60'),
              )}
            >
              {done && <Check className="size-4" strokeWidth={3} aria-hidden />}
            </m.span>
          </button>
        )}

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={detailId}
            className="flex w-full cursor-pointer items-start justify-between gap-2 text-left"
          >
            <span className="min-w-0">
              {conditional && <span className="block text-xs font-medium text-ink-subtle">Jika: {doc.condition}</span>}
              <span className={cn('block font-semibold leading-snug', off ? 'text-ink-muted' : 'text-ink', done && 'text-ink-muted line-through decoration-ink-subtle/40')}>
                {doc.title}
              </span>
              {!conditional && doc.where && <span className="mt-0.5 block text-xs text-ink-subtle">{doc.where}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
              {doc.kind === 'umum' && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[0.68rem] font-semibold text-gold-text">Biasanya diminta</span>}
              <ChevronDown className={cn('size-4 text-ink-subtle transition-transform duration-200', open && 'rotate-180')} aria-hidden />
            </span>
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <m.div
                id={detailId}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.28, ease: EASE_OUT }}
                className="overflow-hidden"
              >
                <div className="pt-2.5 text-sm">
                  <p className="text-ink-muted">{doc.detail}</p>
                  {conditional && doc.where && <p className="mt-1.5 text-ink-muted">Urus di: {doc.where}</p>}
                  <p className="mt-2 text-xs text-ink-subtle">Dasar: {doc.basis}</p>
                  {doc.kind === 'umum' && (
                    <button
                      type="button"
                      onClick={() => onUpdate(doc.key, side, st === 'na' ? null : 'na')}
                      className="mt-2.5 inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-border px-3 text-xs font-semibold text-ink-muted hover:bg-surface-muted hover:text-ink"
                    >
                      {st === 'na' ? 'Ternyata diminta KUA-ku' : 'Tidak diminta KUA-ku'}
                    </button>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {conditional && (
          <ApplySwitch
            on={!off}
            label={`${doc.title} berlaku untuk ${side === 'joint' ? 'kami' : SIDE_LABEL[side].short}`}
            tone={tone.bar}
            onChange={(on) => onUpdate(doc.key, side, on ? 'todo' : null)}
          />
        )}
      </div>
    </li>
  )
}

function ApplySwitch({ on, label, tone, onChange }: { on: boolean; label: string; tone: string; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="-my-1 flex min-h-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-1"
    >
      <span className={cn('relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200', on ? tone : 'bg-border-strong')}>
        <m.span layout transition={SPRING} className={cn('size-5 rounded-full bg-white shadow-sm', on ? 'ml-[1.125rem]' : 'ml-0.5')} />
      </span>
      <span className="text-[0.65rem] font-semibold text-ink-subtle">{on ? 'Berlaku' : 'Tidak'}</span>
    </button>
  )
}

function SourceCard() {
  return (
    <Card className="flex flex-col gap-3 bg-gradient-to-br from-surface to-gold-soft/40 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm">
        <p className="font-semibold text-ink">Sumber: {KUA_SOURCE.title}</p>
        <p className="mt-0.5 text-ink-muted">
          Pasal 3–7, 11, 12, dan 14. Jumlah fotokopi, ukuran pas foto, dan formulir bisa berbeda per KUA — konfirmasi ke KUA kecamatan tempat akad.
          Biaya nikah di KUA pada jam kerja Rp 0; di luar KUA / di luar jam kerja dikenai PNBP (umumnya Rp 600.000).
        </p>
      </div>
      <a
        href={KUA_SOURCE.simkahUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
      >
        Daftar online di SIMKAH
        <ExternalLink className="size-4" aria-hidden />
      </a>
    </Card>
  )
}
