import type { ReactNode } from 'react'
import { Compass, Store } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Alert, EmptyState } from '@/components/ui/Feedback'
import { APP_NAME } from '@/lib/config'

function Prose({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-5xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-ink-subtle">Draf · terakhir diperbarui {updated}</p>
      <Alert tone="warning" className="mt-6">
        Dokumen ini masih berupa draf dan wajib ditinjau sebelum peluncuran publik.
      </Alert>
      <div className="mt-8 space-y-6 text-ink-muted [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </main>
  )
}

export function PrivacyPage() {
  return (
    <Prose title="Kebijakan Privasi" updated="13 Oktober 2026">
      <p>{APP_NAME} membantu kamu merencanakan pernikahan. Kami hanya meminta data yang diperlukan untuk fitur tersebut.</p>
      <h2>Data yang kami simpan</h2>
      <ul>
        <li>Data akun: nama dan email yang kamu gunakan untuk mendaftar.</li>
        <li>Data perencanaan: profil pernikahan, anggaran, vendor, pembayaran, tugas, tamu, dan rundown yang kamu masukkan.</li>
        <li>File yang kamu unggah, seperti bukti pembayaran atau kontrak, disimpan di penyimpanan privat.</li>
      </ul>
      <h2>Bagaimana data dilindungi</h2>
      <p>
        Data workspace hanya dapat diakses oleh akunmu melalui pembatasan akses di tingkat database. Kami tidak memublikasikan data
        keuangan, daftar tamu, atau dokumen pernikahanmu, dan tidak menjual data pribadi.
      </p>
      <h2>Hak kamu</h2>
      <p>Kamu dapat mengunduh seluruh datamu dari halaman Pengaturan dan meminta penghapusan akun.</p>
    </Prose>
  )
}

export function TermsPage() {
  return (
    <Prose title="Syarat Penggunaan" updated="14 Oktober 2026">
      <p>Dengan menggunakan {APP_NAME}, kamu menyetujui ketentuan berikut.</p>
      <h2>Layanan</h2>
      <p>
        {APP_NAME} adalah alat bantu perencanaan. Kami tidak menjadi pihak dalam kontrak antara kamu dan vendor, tidak memproses
        pembayaran ke vendor, dan tidak terintegrasi dengan KUA maupun Dukcapil.
      </p>
      <h2>Paket Gratis dan Premium</h2>
      <ul>
        <li>Fitur perencanaan inti dapat dipakai gratis. Batas paket Gratis tercantum di halaman Premium dalam aplikasi.</li>
        <li>Premium dibayar sekali per workspace pernikahan melalui QRIS dan berlaku untuk kedua anggota workspace, tanpa langganan.</li>
        <li>Premium aktif setelah pembayaran diverifikasi. Bayarlah persis sesuai nominal yang tertera agar pembayaran dapat dicocokkan.</li>
        <li>Perubahan harga tidak memengaruhi workspace yang sudah Premium.</li>
        <li>Kendala pembayaran dapat disampaikan kepada kami dengan menyertakan kode pembayaran (SRS-…).</li>
      </ul>
      <h2>Informasi vendor</h2>
      <p>
        Informasi vendor dan kisaran harga dapat berubah. Selalu konfirmasi langsung ke vendor sebelum mengambil keputusan.
      </p>
      <h2>Akun</h2>
      <p>Kamu bertanggung jawab menjaga kerahasiaan akunmu dan keakuratan data yang kamu masukkan.</p>
    </Prose>
  )
}

export function VendorDirectoryPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-text">Direktori vendor</p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl font-semibold leading-[1.05]">Vendor pernikahan lokal</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">
        Venue, katering, dekorasi, MUA, busana, fotografi, undangan, souvenir, hiburan, dan wedding organizer di berbagai kota.
      </p>
      <EmptyState
        className="mt-10"
        icon={<Store className="size-7" aria-hidden />}
        title="Direktori sedang disusun"
        description="Kami sedang mengumpulkan dan memverifikasi data vendor dengan izin pemiliknya. Sambil menunggu, kamu sudah bisa mencatat dan membandingkan vendor yang kamu hubungi sendiri."
        action={<ButtonLink to="/register">Mulai catat vendor</ButtonLink>}
      />
    </main>
  )
}

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 sm:px-6">
      <EmptyState
        icon={<Compass className="size-7" aria-hidden />}
        title="Halaman tidak ditemukan"
        description="Alamat yang kamu buka tidak tersedia atau sudah dipindahkan."
        action={<ButtonLink to="/">Kembali ke beranda</ButtonLink>}
      />
    </main>
  )
}
