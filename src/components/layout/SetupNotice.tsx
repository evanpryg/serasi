import { Database } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Card, CardBody } from '@/components/ui/Card'

/** Tampil saat VITE_SUPABASE_* belum diisi, sehingga fitur privat belum bisa dipakai. */
export function SetupNotice() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-canvas px-4 py-12">
      <Logo />
      <Card className="w-full max-w-lg">
        <CardBody className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gold-soft text-gold-text">
            <Database className="size-6" aria-hidden />
          </div>
          <h1 className="font-display text-3xl font-semibold">Supabase belum terhubung</h1>
          <p className="text-ink-muted">
            Isi <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">VITE_SUPABASE_URL</code> dan{' '}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">VITE_SUPABASE_PUBLISHABLE_KEY</code> di file{' '}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">.env.local</code> (lokal) atau di Environment Variables
            Netlify, lalu jalankan ulang aplikasi. Panduan lengkap ada di README.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
