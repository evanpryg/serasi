import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Crown, Download, Info, Loader2, LogOut, Save, ShieldAlert, ShieldCheck, Trash2, UserMinus } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { firstName, useWedding, useWorkspace } from '@/auth/WorkspaceProvider'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { updateDemoMemberName, updateDemoWedding } from '@/lib/demoStore'
import { deleteProfileAvatar, uploadProfileAvatar, validateAvatarFile } from '@/lib/avatar'
import { AvatarUploadButton, CoverImage, CoverPhotoControls, MemberAvatar } from '@/components/couple/Cover'
import { PartnerInvite } from '@/components/couple/PartnerInvite'
import { SidePicker } from '@/components/couple/SidePicker'
import { SIDE_LABEL, SIDE_TONE, applySideTheme } from '@/lib/side'
import { cn } from '@/lib/cn'
import { Button, ButtonLink } from '@/components/ui/Button'
import { PremiumBadge } from '@/components/premium/Premium'
import { usePremium } from '@/hooks/usePremium'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Feedback'
import { TextField } from '@/components/ui/Field'
import { BudgetFields, EventFields, StyleFields } from '@/components/wedding/WeddingFields'
import { db } from '@/lib/supabase'
import { formatDate, formatRupiah, toDateOnly } from '@/lib/format'
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
      <PlanCard />
      <WeddingProfileCard />
      <AccountCard />
      <DataCard />
    </div>
  )
}

/** Paket aktif workspace + jalan pintas admin. */
function PlanCard() {
  const { isPremium, price, isAdmin, entitlement, isDemo } = usePremium()
  return (
    <Card>
      <CardHeader title="Paket" description="Satu paket untuk kalian berdua." />
      <CardBody className="space-y-3">
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold text-ink">
              {isPremium ? <PremiumBadge label="Premium" /> : 'Gratis'}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {isPremium
                ? isDemo
                  ? 'Akun demo dengan semua fitur terbuka.'
                  : `Aktif sejak ${formatDate(entitlement?.activated_at?.slice(0, 10))}, berlaku selamanya.`
                : `Upgrade ${formatRupiah(price)} sekali bayar: tamu tanpa batas, analisis lengkap, semua deep talk, foto di anggaran.`}
            </p>
          </div>
          <ButtonLink to="/app/premium" variant={isPremium ? 'secondary' : 'primary'} icon={<Crown className="size-4" aria-hidden />}>
            {isPremium ? 'Lihat paket' : 'Lihat Premium'}
          </ButtonLink>
        </div>
        {isAdmin && (
          <ButtonLink to="/app/admin/pembayaran" variant="ghost" icon={<ShieldCheck className="size-4" aria-hidden />}>
            Verifikasi pembayaran (admin)
          </ButtonLink>
        )}
      </CardBody>
    </Card>
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

function ProfilePhotoSection() {
  const { user } = useAuth()
  const { me, wedding, refresh } = useWorkspace()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  if (!user || !me) return null

  async function handleFile(file: File | undefined) {
    if (!file || !user || !me) return
    const errorMsg = validateAvatarFile(file)
    if (errorMsg) {
      setStatus({ tone: 'danger', text: errorMsg })
      return
    }

    setUploading(true)
    setStatus(null)
    try {
      await uploadProfileAvatar({
        userId: user.id,
        weddingId: wedding?.id,
        file,
        previousUrl: me.avatarUrl,
      })
      await refresh()
      setStatus({ tone: 'success', text: 'Foto profil berhasil diperbarui.' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto profil. Coba lagi.'
      setStatus({ tone: 'danger', text: msg })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!user || !me) return
    setUploading(true)
    setStatus(null)
    try {
      await deleteProfileAvatar({
        userId: user.id,
        weddingId: wedding?.id,
        previousUrl: me.avatarUrl,
      })
      await refresh()
      setStatus({ tone: 'success', text: 'Foto profil dihapus. Kembali menggunakan avatar inisial.' })
    } catch {
      setStatus({ tone: 'danger', text: 'Gagal menghapus foto profil. Coba lagi.' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink">Foto profil</p>
        <p className="text-xs text-ink-muted">Foto ini akan muncul di profil, catatan kita, dan navigasi aplikasi.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative inline-flex self-start">
          <MemberAvatar member={me} size="xl" className="ring-4 ring-primary/20 shadow-sm" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-[1px]">
              <Loader2 className="size-6 animate-spin" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              icon={uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
            >
              {me.avatarUrl ? 'Ganti foto profil' : 'Unggah foto profil'}
            </Button>
            {me.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                disabled={uploading}
                onClick={() => void handleDelete()}
                icon={<Trash2 className="size-4 text-danger" aria-hidden />}
                className="text-danger hover:bg-danger-soft"
              >
                Hapus foto
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            Format JPG, PNG, atau WebP (maks. 5 MB). Foto dipotong bujur sangkar otomatis.
          </p>
        </div>
      </div>

      {status && <Alert tone={status.tone}>{status.text}</Alert>}
    </div>
  )
}

const accountSchema = z.object({ fullName: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(120, 'Nama terlalu panjang.') })

function AccountCard() {
  const { user, signOut } = useAuth()
  const { refresh, me } = useWorkspace()
  const [status, setStatus] = useState<Status>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: { fullName: String(me?.name ?? user?.user_metadata?.full_name ?? '') },
  })

  async function onSubmit({ fullName }: z.infer<typeof accountSchema>) {
    setStatus(null)
    const demo = getCurrentDemoAccount()
    if (demo && user) {
      updateDemoMemberName(demo.id, user.id, fullName)
      await refresh()
      reset({ fullName })
      setStatus({ tone: 'success', text: 'Nama profil berhasil diperbarui.' })
      return
    }

    // RLS: hanya baris profil dengan id = auth.uid() yang bisa diubah.
    const [profile, meta] = await Promise.all([
      db().from('profiles').update({ full_name: fullName }).eq('id', user!.id),
      db().auth.updateUser({ data: { full_name: fullName } }),
    ])
    if (profile.error || meta.error) return setStatus({ tone: 'danger', text: 'Nama gagal disimpan. Coba lagi.' })
    await refresh()
    reset({ fullName })
    setStatus({ tone: 'success', text: 'Profil akun tersimpan.' })
  }

  return (
    <Card>
      <CardHeader title="Profil & Akun" description="Kelola foto profil, identitas, dan data akunmu." />
      <CardBody className="space-y-6">
        <ProfilePhotoSection />

        <div className="border-t border-border pt-6">
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
        </div>
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
  const { user } = useAuth()
  const { me, partner, members, refresh, sidesSupported, setMySide } = useWorkspace()
  const [sideSaving, setSideSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarStatus, setAvatarStatus] = useState<Status>(null)
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

  async function handleAvatarUpload(file: File) {
    if (!user) return
    const errorMsg = validateAvatarFile(file)
    if (errorMsg) {
      setAvatarStatus({ tone: 'danger', text: errorMsg })
      return
    }
    setAvatarUploading(true)
    setAvatarStatus(null)
    try {
      await uploadProfileAvatar({ userId: user.id, weddingId: wedding?.id, file, previousUrl: me?.avatarUrl })
      await refresh()
      setAvatarStatus({ tone: 'success', text: 'Foto profil diperbarui.' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto. Coba lagi.'
      setAvatarStatus({ tone: 'danger', text: msg })
    } finally {
      setAvatarUploading(false)
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
        {avatarStatus && <Alert tone={avatarStatus.tone}>{avatarStatus.text}</Alert>}
        <ul className="divide-y divide-border rounded-xl border border-border">
          {members.map((mem) => (
            <li key={mem.userId} className="flex items-center gap-3 p-3.5">
              {mem.isMe ? (
                <AvatarUploadButton member={mem} onUpload={(f) => void handleAvatarUpload(f)} loading={avatarUploading} />
              ) : (
                <MemberAvatar member={mem} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">
                  {mem.name} {mem.isMe && <span className="font-normal text-ink-muted">(kamu)</span>}
                </p>
                <p className="text-sm text-ink-muted">
                  {mem.side ? SIDE_LABEL[mem.side].long : 'Peran belum dipilih'}
                  {mem.role === 'owner' && ' · pembuat workspace'}
                </p>
              </div>
              {mem.side && (
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold tracking-wide', SIDE_TONE[mem.side].soft, SIDE_TONE[mem.side].text)}>
                  {SIDE_LABEL[mem.side].short}
                </span>
              )}
            </li>
          ))}
        </ul>
        {sidesSupported && (
          <div>
            <p className="text-sm font-semibold text-ink">Peranku</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Menentukan warna aplikasi (CPP biru, CPW pink) dan pembagian berkas KUA.
              {partner ? ` Peran ${firstName(partner.name)} ikut bertukar.` : ''}
            </p>
            <SidePicker
              value={me.side}
              disabledSide={partner?.side}
              className="mt-3"
              onChange={(s) => {
                if (s === me.side || sideSaving) return
                setSideSaving(true)
                setAvatarStatus(null)
                setMySide(s)
                  .then(() => setAvatarStatus({ tone: 'success', text: `Peran disimpan: ${SIDE_LABEL[s].long}.` }))
                  .catch((e: unknown) => {
                    if (me.side) applySideTheme(me.side)
                    setAvatarStatus({ tone: 'danger', text: e instanceof Error ? e.message : 'Peran gagal disimpan.' })
                  })
                  .finally(() => setSideSaving(false))
              }}
            />
          </div>
        )}
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
