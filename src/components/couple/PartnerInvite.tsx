import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Heart, Link2, MessageCircle, RefreshCw } from 'lucide-react'
import { AnimatePresence, m } from '@/components/motion'
import { Button } from '@/components/ui/Button'
import { Alert, Skeleton } from '@/components/ui/Feedback'
import { firstName, useWorkspace } from '@/auth/WorkspaceProvider'
import { db } from '@/lib/supabase'
import { formatDate } from '@/lib/format'
import { formatInviteCode, inviteLink, whatsappShareUrl } from '@/lib/invite'
import { MemberAvatar } from './Cover'
import { cn } from '@/lib/cn'

type ActiveInvite = { code: string; expires_at: string }

/** Kartu status pasangan: terhubung, atau undang pasangan dengan kode/link. */
export function PartnerInvite({ className }: { className?: string }) {
  const { wedding, me, partner } = useWorkspace()
  const [invite, setInvite] = useState<ActiveInvite | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInvite = useCallback(async () => {
    if (!wedding || partner) return setLoading(false)
    const { data } = await db()
      .from('wedding_invites')
      .select('code, expires_at')
      .eq('wedding_id', wedding.id)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setInvite(data)
    setLoading(false)
  }, [wedding, partner])

  useEffect(() => {
    void loadInvite()
  }, [loadInvite])

  async function createInvite() {
    setBusy(true)
    setError(null)
    const { error: err } = await db().rpc('create_wedding_invite')
    if (err) setError('Kode undangan gagal dibuat. Coba lagi.')
    await loadInvite()
    setBusy(false)
  }

  async function copyLink() {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(inviteLink(invite.code))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Tidak bisa menyalin otomatis. Salin link secara manual.')
    }
  }

  if (!wedding || !me) return null

  if (partner) {
    return (
      <div className={cn('flex items-center gap-4 rounded-card border border-border bg-surface p-5 shadow-card', className)}>
        <div className="flex -space-x-3">
          <MemberAvatar member={me.role === 'owner' ? me : partner} />
          <MemberAvatar member={me.role === 'owner' ? partner : me} />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            <Heart className="size-4 fill-rose text-rose" aria-hidden /> Terhubung dengan {firstName(partner.name)}
          </p>
          <p className="text-sm text-ink-muted">Kalian berdua bisa melihat dan mengubah rencana yang sama.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-card border border-rose/20 bg-gradient-to-br from-rose-soft via-surface to-gold-soft/60 p-5 shadow-card sm:p-6', className)}>
      <div className="flex items-start gap-4">
        <div className="flex -space-x-3">
          <MemberAvatar member={me} />
          <span className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-rose/40 bg-white text-rose ring-2 ring-white" aria-hidden>
            ?
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-semibold leading-tight text-ink">Ajak pasanganmu bergabung</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Satu workspace untuk berdua: anggaran, checklist, tes kepribadian, dan deep talk bisa diisi bersama.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {invite ? (
              <m.div key="code" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }} className="space-y-3">
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Kode undangan</p>
                    <p className="tabular font-display text-3xl font-semibold tracking-[0.12em] text-ink">{formatInviteCode(invite.code)}</p>
                    <p className="text-xs text-ink-muted">Berlaku sampai {formatDate(invite.expires_at.slice(0, 10))}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="md" onClick={() => void copyLink()} icon={copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}>
                      {copied ? 'Tersalin' : 'Salin link'}
                    </Button>
                    <a
                      href={whatsappShareUrl(invite.code, firstName(me.name))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-[0.95rem] font-semibold text-on-primary transition-colors hover:bg-primary-hover"
                    >
                      <MessageCircle className="size-4" aria-hidden /> Kirim via WhatsApp
                    </a>
                  </div>
                </div>
                <button type="button" onClick={() => void createInvite()} disabled={busy} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-60">
                  <RefreshCw className={cn('size-4', busy && 'animate-spin')} aria-hidden /> Buat kode baru (kode lama tidak berlaku)
                </button>
              </m.div>
            ) : (
              <m.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                <Button onClick={() => void createInvite()} loading={busy} icon={<Link2 className="size-4" aria-hidden />}>
                  Buat link undangan
                </Button>
              </m.div>
            )}
          </AnimatePresence>
        )}
        {error && (
          <Alert tone="danger" className="mt-3">
            {error}
          </Alert>
        )}
      </div>
    </div>
  )
}
