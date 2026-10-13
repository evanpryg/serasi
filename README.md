# Serasi — Wedding planner untuk berdua

Website perencanaan pernikahan untuk calon pengantin Indonesia. **Satu workspace untuk berdua** (calon suami & calon istri): anggaran, vendor, pembayaran, checklist, tamu, rundown, plus **tes kepribadian** dan **deep talk** untuk saling mengenal sebelum menikah.

**Stack:** React 19 + TypeScript + Vite · Tailwind CSS v4 · React Router · Motion (animasi) · Supabase (Auth, Postgres + RLS, Storage) · Netlify.

## Status sprint (PRD §16)

| Sprint | Isi | Status |
|---|---|---|
| 1. Foundation | Vite/React/TS/Tailwind, design system, layout, Supabase client, registrasi/login email, reset password, logout, route privat | ✅ |
| 2. Database & workspace | Skema + migration + RLS, onboarding 3 langkah, dashboard dari data nyata, pengaturan profil, uji isolasi antar-user | ✅ |
| + Pasangan | Akun berdua (undangan link/kode, maks. 2 anggota), foto sampul (default + prewedding), tes kepribadian 16 tipe, deep talk 40 pertanyaan, animasi | ✅ |
| 3. Budgeting | CRUD kategori, transaksi, kontrak & pembayaran vendor, simulasi | ⏳ (rumus & tes sudah ada di `src/lib/finance.ts`) |
| 4. Planning | Checklist, direktori vendor, vendor pribadi & perbandingan | ⏳ |
| 5. Tamu & acara | Daftar tamu + CSV, rundown, ekspor | ⏳ (ekspor JSON sudah ada di Pengaturan) |
| 6. Beta | Hapus akun (server-side), uji end-to-end, deploy | ⏳ |

Halaman Budget/Vendor/Checklist/Tamu/Rundown saat ini menampilkan *empty state* "Segera hadir". Kategori anggaran dan checklist dasar **sudah dibuat di database** saat onboarding dan sudah dihitung di dashboard.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # isi URL & publishable key Supabase
npm run dev                  # http://localhost:5173
```

Tanpa `.env.local`, landing page tetap bisa dibuka; halaman login/aplikasi menampilkan petunjuk konfigurasi.

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Type-check + build produksi ke `dist/` |
| `npm test` | Unit test (format rupiah/tanggal, rumus keuangan, prioritas dashboard, anti open-redirect) |
| `npm run test:db` | Jalankan migration + uji isolasi RLS di Postgres WASM (PGlite), termasuk *mutation test* yang memastikan kebocoran terdeteksi. Tidak perlu Docker. |

## Setup Supabase

1. Buat proyek di [supabase.com](https://supabase.com).
2. Jalankan migration secara berurutan (SQL Editor, atau `supabase db push` dengan Supabase CLI):
   - `supabase/migrations/20261013000001_init_schema.sql` — tabel, constraint, RLS, bucket storage privat `wedding-files`
   - `supabase/migrations/20261013000002_onboarding.sql` — fungsi `create_wedding_workspace` & template checklist
   - `supabase/migrations/20261013000003_couple_personality_deeptalk.sql` — anggota workspace, undangan pasangan, foto sampul, tes kepribadian, deep talk; semua RLS diubah dari *owner* ke *member*
3. **Uji isolasi di proyek sungguhan:** jalankan `supabase/tests/rls_isolation.sql` lalu `supabase/tests/couple_access.sql` di SQL Editor. Hasil yang diharapkan: `SEMUA UJI ISOLASI LULUS` dan `SEMUA UJI AKUN PASANGAN LULUS` (semua data uji di-rollback).
4. Ambil **Project URL** dan **publishable key** (atau anon key lama) dari *Project Settings → API*, isi ke `.env.local`.
   > ⚠️ Jangan pernah menaruh `service_role` / secret key di variabel `VITE_*`: semua variabel `VITE_*` masuk ke bundle browser.
5. *Authentication → URL Configuration*:
   - **Site URL:** `http://localhost:5173` (dev) atau domain produksi
   - **Redirect URLs:** `http://localhost:5173/auth/callback`, `http://localhost:5173/reset-password`, serta versi domain produksi keduanya. Link undangan pasangan (`/join/KODE`) tidak perlu didaftarkan karena bukan redirect OAuth (mis. `https://namasitus.netlify.app/auth/callback`)
6. *Authentication → Providers → Email*: atur apakah konfirmasi email wajib. Aplikasi menangani kedua mode.

### Login email & reset password

Login hanya memakai email + password (Google OAuth sudah dihapus). Di Supabase → *Authentication*:

1. **URL Configuration:** *Site URL* = domain produksi; *Redirect URLs* tambahkan `https://<domain>/auth/callback` dan `https://<domain>/reset-password` (plus versi `http://localhost:5173/...` untuk lokal).
2. **Providers → Email:** aktifkan. Konfirmasi email boleh aktif maupun nonaktif.
3. Lupa password: `/forgot-password` mengirim link → `/reset-password` (form password baru). Link memakai PKCE sehingga harus dibuka di browser yang sama dengan tempat meminta link.
4. SMTP bawaan Supabase dibatasi beberapa email per jam; untuk produksi pasang SMTP sendiri (*Project Settings → Authentication → SMTP*).

## Deploy ke Netlify

1. Push ke GitHub, lalu *Add new site → Import from Git*.
2. Build command `npm run build`, publish directory `dist` (sudah diatur di `netlify.toml`, termasuk fallback SPA `/* → /index.html` dan security header).
3. `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` sudah diisi di `[build.environment]` pada `netlify.toml` (keduanya nilai publik). Opsional `VITE_CONTACT_EMAIL` lewat *Site configuration → Environment variables*.
4. Tambahkan domain produksi ke Supabase (Site URL + Redirect URLs) .
5. Uji di domain produksi: daftar, login email, lupa & reset password, refresh di `/app/dashboard` (tidak boleh 404).

## Arsitektur & keamanan

```
Browser (React) ──► Supabase Auth      (sesi, reset password)
                └─► Supabase Postgres  (semua akses dibatasi RLS)
                └─► Supabase Storage   (bucket privat wedding-files/<wedding_id>/...)
Netlify hanya menyajikan file statis.
```

- **RLS di semua tabel.** Setiap tabel privat punya kebijakan SELECT/INSERT/UPDATE/DELETE sendiri yang memverifikasi kepemilikan lewat `is_wedding_owner(wedding_id)`.
- **Foreign key komposit** `(id, wedding_id)`: transaksi/pembayaran/vendor tidak bisa dihubungkan ke record workspace lain, bahkan jika ada kebijakan yang keliru.
- **Profil** dibuat oleh trigger `on auth.users insert`; browser tidak pernah mengirim user ID sebagai bukti kepemilikan.
- **Onboarding** memakai fungsi `create_wedding_workspace` (SECURITY INVOKER, satu transaksi): workspace + 14 kategori + checklist. Template checklist idempoten (`template_key` unik), tidak pernah terduplikasi.
- **Direktori vendor** (`vendors`) hanya bisa dibaca publik jika `is_published = true`; tidak ada kebijakan tulis → hanya pengelola (service role) yang dapat mengubahnya.
- **Redirect setelah login** hanya ke path `/app/*` yang tervalidasi (anti open-redirect).

## Fitur pasangan

| Fitur | Cara kerja |
|---|---|
| **Akun berdua** | Pembuat workspace (owner) membuat kode undangan di halaman **Kita** → kirim link `/join/KODE` (bisa via WhatsApp). Pasangan daftar/masuk lalu otomatis menjadi *partner*. Maks. 2 anggota; satu akun hanya di satu workspace. Kode 8 karakter acak dari server, berlaku 14 hari, sekali pakai. |
| **Foto sampul** | Bawaan: `public/images/default-cover.*`. Pasangan bisa mengunggah foto prewedding: dikompres di browser (maks. 1920 px, WebP, metadata EXIF/GPS terhapus), disimpan privat di `wedding-files/<wedding_id>/`, ditampilkan lewat signed URL. |
| **Tes kepribadian** | 28 pernyataan (7 per dimensi), skala 1–5, hasil 16 tipe + profil, cara menghadapi pasangan, dan dinamika per dimensi. Hasil pasangan baru terlihat setelah kamu menyelesaikan tes (dijaga RLS). Terinspirasi MBTI®, **bukan instrumen resmi** — disclaimer tampil di aplikasi. |
| **Deep talk** | 40 pertanyaan dalam 8 topik (visi, iman, keuangan, keluarga besar, anak, peran, konflik, gaya hidup). Jawaban pasangan untuk sebuah pertanyaan terbuka setelah kamu menjawab pertanyaan yang sama (dijaga RLS). Keduanya menilai *sejalan / perlu dibahas / berbeda*; status "sejalan" hanya jika keduanya sepakat. Ada **mode kartu** untuk ngobrol langsung. |

Animasi memakai `motion` (dimuat terpisah agar bundle awal ringan) dan otomatis nonaktif saat sistem meminta *reduce motion*.

## Model keuangan

Semua nominal adalah **integer rupiah (BIGINT)**, tidak pernah float. Implementasi & tes: `src/lib/finance.ts`.

| Istilah | Definisi |
|---|---|
| Total anggaran | Σ anggaran kategori aktif (termasuk dana cadangan) |
| Pengeluaran aktual | Σ `expenses` berstatus `paid` + Σ `payments` berstatus `paid` |
| Komitmen vendor | Σ nilai kontrak vendor berstatus `dipilih` |
| Sisa tagihan | Σ max(kontrak − pembayaran `paid`, 0) per vendor |
| Sisa anggaran | Total anggaran − pengeluaran aktual |
| Dana tersedia | Total dana yang sudah terkumpul (input pengguna) |
| Saldo dana | Dana tersedia − pengeluaran aktual |
| Dana belum dialokasikan | Saldo dana − sisa tagihan − pengeluaran `planned` (negatif = kekurangan dana) |

**Anti hitung ganda:** pembayaran kontrak vendor (DP, termin, pelunasan) dicatat di `payments`; `expenses` hanya untuk pengeluaran di luar kontrak vendor. Kontrak adalah komitmen, baru menjadi pengeluaran saat pembayarannya `paid`. Jadwal pelunasan tidak ditambahkan lagi ke sisa tagihan.

## Struktur

```
src/
  auth/            AuthProvider, WorkspaceProvider, guard route, pesan error auth
  components/ui/   Button, Field (Text/Password/Select/Money), Card, Feedback, Logo
  components/layout AppLayout (sidebar desktop + bottom nav mobile), SetupNotice
  lib/             supabase client, tipe DB, format rupiah/tanggal, rumus keuangan, prioritas
  pages/           public (landing, vendor, privasi, syarat), auth, onboarding, app
supabase/
  migrations/      skema, RLS, storage, fungsi onboarding
  tests/           rls_isolation.sql (uji isolasi antar-user)
scripts/test-db.mjs  runner PGlite untuk migration + RLS
design-system/     MASTER.md — token warna, tipografi, aturan UI
```

## Catatan sebelum peluncuran publik

- Kebijakan privasi & syarat penggunaan masih **draf** (`/privasi`, `/syarat`).
- Kode undangan saat ini dibagikan manual (salin/WhatsApp); belum ada email undangan otomatis.
- Hapus akun permanen butuh fungsi server (Netlify Function / Supabase Edge Function dengan service role); belum diimplementasikan.
- Isi `VITE_CONTACT_EMAIL` agar kontak tampil di footer.
- Mengubah tanggal pernikahan belum menghitung ulang tenggat checklist template (rencana Sprint 4).
