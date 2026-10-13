import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Download, Info, LogOut, Save, ShieldAlert, UserMinus } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { firstName, useWedding, useWorkspace } from '@/auth/WorkspaceProvider'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { updateDemoWedding } from '@/lib/demoStore'
import { CoverImage, CoverPhotoControls, MemberAvatar } from '@/components/couple/Cover'
import { PartnerInvite } from '@/components/couple/PartnerInvite'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Feedback'
import { TextField } from '@/components/ui/Field'
import { BudgetFields, EventFields, StyleFields } from '@/components/wedding/WeddingFields'
import { db } from '@/lib/supabase'
import { toDateOnly } from '@/lib/format'
import { weddingSchema, type WeddingFormInput, type WeddingFormValues } from '@/lib/wedding'

type Status = { tone: 'success' | 'danger'; text: string } | null

export function SettingsPage() {
  const isDemo = Boolean(getCurrentDemoAccount())
  return (
    <div className="space-y-6 lg:space-y-8">
      <header>
        <h1 className="font-display text-[2.4rem] font-semibold leading-tight sm:text-5xl">Pengaturan</h1>
        <p className="mt-1 text-ink-muted">Kelola profil, workspace pernikahan, dan datamu.</p>
      </header>
      {isDemo && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft/50 p-4 text-sm text-ink dark:border-primary/30 dark:bg-primary-soft/20">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p>
            <strong>Akun Demo Interaktif</strong> — Kamu dapat mengubah nama, tanggal pernikahan, target anggaran, dan preferensi lainnya. Perubahan akan tersimpan langsung di browser untuk menguji seluruh alur aplikasi secara riil.
          </p>
        </div>
      )}
      <CoupleCard />
      <WeddingProfileCard />
      <AccountCard />
      <DataCard />
    </div>
  )
}

function WeddingProfileCard() {
  const wedding = useWedding()
  const { refresh } = useWorkspace()
  const [status, setStatus] = useState<Status>(null)

  const form = useForm<WeddingFormInput, unknown, WeddingFormValues>({
    resolver: zodResolver(weddingSchema),
    defaultValues: {
      title: wedding.title,
      partnerNames: wedding.partner_names ?? '',
      weddingDate: wedding.wedding_date ?? '',
      city: wedding.city,
      eventTypes: wedding.event_types,
      guestEstimate: wedding.guest_estimate,
      budgetTarget: wedding.budget_target,
      availableFunds: wedding.available_funds,
      weddingStyle: wedding.wedding_style ?? '',
      tradition: wedding.tradition ?? '',
    },
  })

  async function onSubmit(v: WeddingFormValues) {
    setStatus(null)
    const demo = getCurrentDemoAccount()
    if (demo) {
      updateDemoWedding(demo.id, {
        title: v.title,
        partner_names: v.partnerNames,
        wedding_date: v.weddingDate,
        city: v.city,
        event_types: v.eventTypes,
        guest_estimate: v.guestEstimate,
        budget_target: v.budgetTarget,
        available_funds: v.availableFunds,
        wedding_style: v.weddingStyle,
        tradition: v.tradition,
      })
      await refresh()
      form.reset(form.getValues())
      setStatus({ tone: 'success', text: 'Profil pernikahan berhasil diperbarui.' })
      return
    }

    const { error } = await db()
      .from('weddings')
      .update({
        title: v.title,
        partner_names: v.partnerNames,
        wedding_date: v.weddingDate,
        city: v.city,
        event_types: v.eventTypes,
        guest_estimate: v.guestEstimate,
        budget_target: v.budgetTarget,
        available_funds: v.availableFunds,
        wedding_style: v.weddingStyle,
        tradition: v.tradition,
      })
      .eq('id', wedding.id)
    if (error) return setStatus({ tone: 'danger', text: 'Perubahan gagal disimpan. Coba lagi.' })
    await refresh()
    form.reset(form.getValues())
    setStatus({ tone: 'success', text: 'Profil pernikahan tersimpan.' })
  }

  return (
    <Card>
      <CardHeader title="Profil pernikahan" description="Perubahan target dan dana tersedia langsung memengaruhi ringkasan dashboard." />
      <CardBody>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-8">
          <EventFields form={form} />
          <div className="border-t border-border pt-8">
            <BudgetFields form={form} />
          </div>
          <div className="border-t border-border pt-8">
            <StyleFields form={form} />
          </div>
          {status && <Alert tone={status.tone}>{status.text}</Alert>}
          <div className="flex justify-end">
            <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty} icon={<Save className="size-4" aria-hidden />}>
              Simpan perubahan
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

const accountSchema = z.object({ fullName: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(120, 'Nama terlalu panjang.') })

function AccountCard() {
  const { user, signOut } = useAuth()
  const [status, setStatus] = useState<Status>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: { fullName: String(user?.user_metadata?.full_name ?? '') },
  })

  async function onSubmit({ fullName }: z.infer<typeof accountSchema>) {
    setStatus(null)
    // RLS: hanya baris profil dengan id = auth.uid() yang bisa diubah.
    const [profile, meta] = await Promise.all([
      db().from('profiles').update({ full_name: fullName }).eq('id', user!.id),
      db().auth.updateUser({ data: { full_name: fullName } }),
    ])
    if (profile.error || meta.error) return setStatus({ tone: 'danger', text: 'Nama gagal disimpan. Coba lagi.' })
    reset({ fullName })
    setStatus({ tone: 'success', text: 'Profil akun tersimpan.' })
  }


  return (
    <Card>
      <CardHeader title="Akun" description="Data login dikelola dengan aman oleh Supabase Auth." />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Nama lengkap" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
            <TextField
              label="Email"
              value={user?.email ?? ''}
              readOnly
              disabled
              hint="Metode login: Email"
            />
          </div>
          {status && <Alert tone={status.tone}>{status.text}</Alert>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="secondary" onClick={() => void signOut()} icon={<LogOut className="size-4" aria-hidden />}>
              Keluar
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty} icon={<Save className="size-4" aria-hidden />}>
              Simpan nama
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

function DataCard() {
  const wedding = useWedding()
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function exportData() {
    setExporting(true)
    setError(null)
    const c = db()
    const tables = ['budget_categories', 'expenses', 'wedding_vendors', 'payments', 'tasks', 'guests', 'rundown_items', 'personality_results', 'deeptalk_answers'] as const
    const results = await Promise.all(tables.map((t) => c.from(t).select('*').eq('wedding_id', wedding.id)))
    const failed = results.find((r) => r.error)
    if (failed) {
      setError('Data gagal diunduh. Coba lagi.')
      setExporting(false)
      return
    }
    const payload = {
      exported_at: new Date().toISOString(),
      wedding,
      ...Object.fromEntries(tables.map((t, i) => [t, results[i]!.data])),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `serasi-${toDateOnly(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <Card>
      <CardHeader title="Data kamu" description="Kamu memegang kendali atas data pernikahanmu." />
      <CardBody className="space-y-5">
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">Unduh semua data</p>
            <p className="text-sm text-ink-muted">Anggaran, vendor, pembayaran, tugas, tamu, rundown, tes kepribadian, dan deep talk dalam format JSON.</p>
          </div>
          <Button variant="secondary" loading={exporting} onClick={() => void exportData()} icon={<Download className="size-4" aria-hidden />}>
            Unduh data
          </Button>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-3 rounded-xl border border-danger/20 bg-danger-soft/40 p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
          <div>
            <p className="font-semibold text-ink">Hapus akun</p>
            <p className="text-sm text-ink-muted">
              Penghapusan akun permanen memerlukan verifikasi di server dan akan tersedia sebelum peluncuran publik. Sementara itu,
              unduh datamu terlebih dahulu lalu hubungi kami untuk permintaan penghapusan.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function CoupleCard() {
  const wedding = useWedding()
  const { me, partner, members, refresh } = useWorkspace()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!me) return null

  async function removePartner() {
    if (!partner || !me) return
    setBusy(true)
    setError(null)
    const leaving = me.role === 'partner'
    const { error: err } = await db()
      .from('wedding_members')
      .delete()
      .eq('wedding_id', wedding.id)
      .eq('user_id', leaving ? me.userId : partner.userId)
    if (err) {
      setBusy(false)
      return setError('Gagal memproses. Coba lagi.')
    }
    if (leaving) window.location.assign('/onboarding')
    else {
      await refresh()
      setConfirming(false)
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Pasangan & foto sampul" description="Workspace ini dipakai bersama oleh kalian berdua." />
      <CardBody className="space-y-6">
        <div className="relative overflow-hidden rounded-xl">
          <CoverImage path={wedding.cover_photo_path} alt="Foto sampul" className="h-44" />
          <CoverPhotoControls className="absolute bottom-3 right-3" />
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {members.map((mem) => (
            <li key={mem.userId} className="flex items-center gap-3 p-3.5">
              <MemberAvatar member={mem} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">
                  {mem.name} {mem.isMe && <span className="font-normal text-ink-muted">(kamu)</span>}
                </p>
                <p className="text-sm text-ink-muted">{mem.role === 'owner' ? 'Pembuat workspace' : 'Pasangan'}</p>
              </div>
              <Badge tone={mem.role === 'owner' ? 'primary' : 'neutral'}>{mem.role === 'owner' ? 'Owner' : 'Partner'}</Badge>
            </li>
          ))}
        </ul>
        {!partner && <PartnerInvite />}
        {partner && (
          <div className="rounded-xl border border-danger/20 bg-danger-soft/30 p-4">
            {!confirming ? (
              <Button variant="secondary" onClick={() => setConfirming(true)} icon={<UserMinus className="size-4" aria-hidden />}>
                {me.role === 'owner' ? `Keluarkan ${firstName(partner.name)}` : 'Keluar dari workspace'}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-ink">
                  {me.role === 'owner'
                    ? `${firstName(partner.name)} tidak bisa lagi mengakses rencana pernikahan ini. Hasil tes kepribadian dan jawaban deep talk miliknya akan dihapus.`
                    : 'Kamu tidak bisa lagi mengakses rencana pernikahan ini. Hasil tes kepribadian dan jawaban deep talk milikmu akan dihapus.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="danger" loading={busy} onClick={() => void removePartner()}>
                    Ya, lanjutkan
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirming(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            )}
            {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
