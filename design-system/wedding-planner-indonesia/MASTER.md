# Design System — Serasi (MASTER)

Sumber kebenaran visual. Halaman tertentu boleh punya override di `pages/<halaman>.md`.
Token diimplementasikan di `src/index.css` (`@theme`). Komponen tidak boleh memakai hex mentah.

## Arah
- **Gaya:** Minimalism / Swiss dengan sentuhan editorial hangat. Bersih, lapang, grid jelas,
  bayangan tipis. Bukan template undangan tradisional, bukan glassmorphism.
- **Rasa:** premium, elegan, modern, hangat, dapat dipercaya (data keuangan).
- **Hasil pencarian ui-ux-pro-max:** palet "Wedding/Event" (pink) dan gaya "Liquid Glass" ditolak:
  PRD menetapkan deep green/ivory/gold, dan efek blur/translusen menurunkan keterbacaan angka.

## Warna — dua tema mengikuti peran (2026-10-13)
Satu akun berdua: **CPP** (calon pengantin pria) dan **CPW** (calon pengantin wanita). Tema mengikuti peran user yang login,
dipasang di `<html data-side="cpp|cpw">` (`src/lib/side.ts`, skrip kecil di `index.html` mencegah kedip). Tanpa peran (landing/login) = CPP.
Hijau/maroon lama tidak dipakai lagi. Palet dari pencarian ui-ux-pro-max: "Luxury navy + gold" (Hotel/Hospitality) dan
"Romantic pink + elegant gold" (Wedding), lalu digelapkan agar terasa premium dan lolos kontras.

| Token | CPP · Midnight Sapphire | CPW · Rosé Champagne | Pakai untuk |
|---|---|---|---|
| primary | #1E3A6E (11:1 putih) | #A3385E (6.4:1 putih) | CTA, nav aktif, fokus ring, hero |
| primary-hover | #172D57 | #872C4D | hover CTA |
| primary-soft | #E7ECF6 | #F9E8EE | latar chip/nav aktif |
| partner / -soft / -light | #A3385E / #F9E8EE / #E9B4C6 | #1E3A6E / #E7ECF6 / #A9BEE3 | warna **pasangan** dari sudut pandang yang login |
| gold-on-dark | #D9BE85 (6.2:1) | #F6E6C4 (5.2:1) | teks emas di atas primary |
| canvas | #F7F8FB porcelain | #FCF8F8 blush porcelain | latar halaman |
| surface-muted | #EEF1F7 | #F7EDEF | latar sekunder |
| border / -strong | #DDE2EC / #C3CBDA | #EEDDE1 / #DCC4CA | garis |
| ink / -muted / -subtle | #141B2D / #4E5668 / #626A7C | #2A1A20 / #5E4C53 / #6E5B62 | teks (subtle ≥ 4.5:1) |

Tetap (tidak ikut tema): `cpp` #1E3A6E, `cpp-soft`, `cpw` #A3385E, `cpw-soft` — untuk label/avatar/batang yang menunjuk orang
tertentu (badge CPP/CPW, avatar, tab Berkas). Gold #C9A66B, gold-text #84652A, gold-soft #F5ECD9, status success/warning/danger sama di kedua tema.

Status tidak pernah disampaikan hanya dengan warna — selalu ada ikon dan/atau teks.

## Simbol pasangan
**Biru = CPP, pink = CPW** di mana pun (avatar, batang tabungan, kolom berkas). Urutan tampil selalu CPP dulu lalu CPW
(`couple` dari `useWorkspace`, `sortCouple`). Peran disimpan di `wedding_members.side`; pilih lewat `SidePicker`
(onboarding, dialog sekali untuk akun lama `SideGate`, Pengaturan). Mengganti peran otomatis menukar peran pasangan (RPC `set_my_side`).

## Foto
- Foto bawaan: `public/images/default-cover.webp/.jpg`. Hero landing memakai bingkai lengkung (arch) + parallax halus.
- Foto pengguna: privat (signed URL), fade-in + scale saat termuat; teks di atas foto selalu diberi gradien gelap.

## Tipografi
- **Display:** Bodoni Moda (variabel, optical size) 500–700 — judul saja (hero, judul halaman/seksi). Kesan mewah editorial.
- **Body/UI + angka:** Geist 400–700 — bersih, digit tegak sejajar.
- **Angka besar** (rupiah, persen, hitungan) memakai utilitas `font-num` (Geist + tabular + lining + tracking rapat),
  **bukan** font serif. Cormorant ditolak (2026-10-13): angka gaya lama (old-style) naik-turun dan terlihat jelek.
- Body 16px, line-height 1.55. Teks minimum 12px untuk label kecil.
- Angka rupiah kecil selalu `tabular` (tabular-nums + lining-nums).

## Spasi & bentuk
- Skala 4px; jarak antarkartu 16–24px; padding kartu 20–24px.
- Radius: input/tombol 12px, kartu 16px, sheet 24px.
- Bayangan `shadow-card` tipis; `shadow-pop` untuk dialog/sheet.

## Motion (library `motion`, `src/components/motion`)
- Token: `EASE_OUT` [0.22,1,0.36,1], `SPRING` (380/32) untuk elemen interaktif, `DURATION` fast .18 / base .35 / slow .7.
- Masuk lebih lambat dari keluar (exit ±0.15–0.2 s).
- Pola: `Reveal` (fade-up saat masuk viewport), `Stagger`, `CountUp` (angka rupiah), `Float` (dekoratif), indikator nav `layoutId`,
  accordion tinggi otomatis, kartu deep talk flip 3D.
- Maksimal 1–2 animasi utama per tampilan. Bar progres memakai `scaleX`, bukan `width`.
- Elemen yang dimulai `scaleX: 0` jangan dipicu `whileInView` miliknya sendiri (luas nol) — amati kontainernya.
- `MotionConfig reducedMotion="user"` + `useReducedMotion` mematikan gerak saat sistem meminta.

## Navigasi
- Desktop (≥1024px): sidebar kiri tetap.
- Desktop: grup "Perencanaan" dan "Kita berdua" (Kita, Tes kepribadian, Deep talk).
- Mobile: bottom navigation 5 item (Beranda, Budget, Kita, Checklist, Lainnya);
  "Lainnya" membuka sheet berisi Tabungan bersama, Berkas KUA, Vendor, Tamu, Rundown, Pengaturan, Keluar.
- Aksi yang sering dipakai tapi tersembunyi di "Lainnya" diberi pintasan di Dashboard "Tambah cepat"
  dengan deep link yang langsung memfokuskan field (contoh `/app/tabungan#catat`).
- Target sentuh minimal 44×44px.

## Pola halaman perencanaan (Budget, Vendor, Checklist, Tamu, Rundown)
Komponen di `src/components/ui/PageKit.tsx`. Urutan tetap supaya pengguna tidak perlu belajar ulang:
1. `PageHeader`: judul + satu kalimat "halaman ini untuk apa" + satu aksi utama.
2. `HowTo`: panduan 3 langkah, bisa disembunyikan (tersimpan per browser).
3. Satu kartu ringkasan berisi angka terpenting (`Stat`), memakai bahasa sehari-hari ("Sudah dibayar", "Belum jawab").
4. Filter `ChipGroup` (membungkus, ada jumlah) + `SearchInput` berlabel.
5. Daftar berbentuk kartu/baris, bukan tabel lebar (aman di 375px). Aksi selalu terlihat (bukan hanya saat hover).
6. Hapus selalu lewat `ConfirmDialog` (bukan `window.confirm`); aksi langka/berbahaya di bagian bawah halaman.
- Pencatatan berulang (Tabungan bersama): form inline, bukan modal. Default terisi (tanggal hari ini,
  atas nama user), chip nominal cepat (+100 rb … +5 jt) dan "Sama seperti terakhir", label tombol
  memuat nominal ("Simpan Rp 1.000.000"), konfirmasi sukses inline yang hilang sendiri (4 dtk).
  Target: catat setoran dalam 2 ketukan. Layar ≥1280px: form menempel di kolom kanan.
- Angka keuangan di halaman mana pun memakai `calculateFinance` (lib/finance) agar sama dengan Dashboard.
- Anggaran (2026-10-18): **Acara → Pos → Item.** Lamaran, Prewedding, Wedding, Honeymoon = acara bawaan (`budget_events`,
  CRUD lewat lembar "Kelola acara": nama, ikon dari daftar `lib/budgetIcons`, tanggal opsional). Pos dengan nama sama boleh ada
  di acara berbeda (Make up lamaran ≠ Make up wedding). Hapus acara tidak menghapus pos (pindah ke "Tanpa acara").
  Urutan: kartu ringkasan **gelap** (gradien primary-deep→primary, cincin emas dekoratif, angka putih, 3 stat kaca:
  Aktual terpakai / Belum dibayar / Uang yang ada) → kartu pilih acara (ikon + "aktual / anggaran", geser horizontal di mobile)
  → per acara: kepala berwarna (tile ikon, tanggal, Anggaran/Aktual/Sisa) + pos → jadwal bayar vendor.
  Warna acara bergilir primary/gold/partner/success; selalu disertai ikon + nama.
  **Realisasi:** `expenses.amount` = harga rencana, `actual_amount` = yang benar-benar dibayar (null = sama). Mencentang item membuka
  panel "Berapa yang benar-benar dibayar?" (nominal default = harga, tanggal hari ini, "Sesuai harga"). Item lunas dihitung
  `expenseValue()` di lib/finance. Selisih ditampilkan "hemat"/"lebih" (ikon + teks). Badge pos "Hemat Rp …" hanya bila item dibayar
  lebih murah dari rencananya — sisa jatah yang belum dibelanjakan tetap disebut "sisa", bukan hemat.
  Tidak ada catatan pengeluaran terpisah (dihapus 2026-10-19): uang keluar dicatat hanya lewat centang item (nominal aktual) atau
  pembayaran vendor, agar tidak ada dua jalur input dan setiap pengeluaran pasti punya acara + pos.
  Ikon pos ditebak dari nama (`posIcon`): kuas = make up, bunga = dekor, kamera = dokumentasi, dst.
  Pos = kartu accordion (`h3 > button`, isi hanya span): tile ikon · nama + chevron, baris 2 badge · "aktual Rp … / anggaran Rp …"
  dan "sisa Rp …" di kanan. Tombol tambah pos ada di bawah tiap acara.
  Isi pos: baris item ringkas (centang bulat = lunas · foto kecil · nama · harga). Ketuk item → detail:
  foto besar (ketuk = layar penuh), kartu pratinjau link (nama produk dibaca dari URL Shopee/Tokopedia,
  tanpa jaringan), catatan, Tambah foto / Ubah / Hapus. Form **tidak** langsung tampil: tombol "+ Tambah item"
  membuka form (nama + harga, foto, link & catatan dilipat); setelah simpan form tetap terbuka untuk item
  berikutnya, "Selesai" menutup. Foto item disimpan di `expenses.proof_path` (bucket privat `wedding-files/<id>/items/`,
  dikompres WebP ≤1280px; akun demo: data URL). Pos yang terbuka disimpan di hash `#pos-<id>`.
- Checklist: **sederhana, bukan formulir administratif.** Kartu progres (persen + bar + tombol "n tugas lewat target"),
  chip bagian (geser horizontal di mobile), kolom tambah cepat (ketik + Enter, masuk grup "Tugas kami"),
  daftar per kategori: centang · judul · tanggal kecil di bawahnya. Yang sudah beres disembunyikan (tombol tampilkan).
  Ketuk tugas → lembar bawah berisi nama, target, catatan, bagian, hapus. Biaya/jumlah/toko tidak ditampilkan
  (belanja dicatat di Anggaran). ID tugas baru selalu `crypto.randomUUID()` (kolom uuid).

- Tamu (`/app/guests`, 2026-10-18): dirancang untuk **ratusan undangan** di HP. Setiap tamu punya pihak (`guests.side` cpp/cpw,
  label "Pria"/"Wanita", warna cpp/cpw + huruf P/W, bukan warna saja) dan kategori baku di `group_name`
  (`src/lib/guests.ts`: Saudara, Teman/Sahabat, Rekan kerja, Tetangga, Kenalan orang tua, Tokoh/VIP, Lainnya; kategori sendiri boleh).
  Urutan: ringkasan jawaban → **Rekap per kategori** (tabel kategori × Pria/Wanita/Total, angka = undangan + "n org", ketuk sel = saring daftar)
  → segmen pihak (Semua/Pria/Wanita) + cari + saring kategori/jawaban → daftar per kategori (judul seksi lengket berisi jumlah).
  Baris ±56px: P/W · nama · "n orang · catatan" · badge jawaban (ikon+teks) · tombol amplop 44px. Ketuk baris → lembar bawah
  (jawaban & undangan langsung tersimpan, ubah data, hapus). Tambah tamu: lembar tetap terbuka setelah simpan, pihak & kategori diingat.
- Berkas KUA (`/app/berkas`): daftar resmi PMA No. 30 Tahun 2024 di `src/lib/kuaDocuments.ts` (setiap item mencantumkan pasal).
  Kartu progres 3 kolom (CPP · CPW · Bersama) + batas daftar 10 hari kerja sebelum akad, tab per orang (hash `#cpp/#cpw/#joint`),
  bagian "Wajib disiapkan" (centang bulat warna peran) dan "Hanya jika berlaku" (saklar Berlaku, baru bisa dicentang setelah menyala).
  Item "umum" (pas foto, KTP wali/saksi) diberi badge "Biasanya diminta" karena bukan syarat di PMA. Status di tabel `wedding_documents`.

## Premium (2026-10-14)
- **Satu paket berbayar**, sekali bayar per workspace untuk berdua (bukan langganan). Pembagian di `src/lib/plans.ts`; batas dijaga database.
- Fitur terkunci memakai `LockedPanel` / `PremiumBadge` (`src/components/premium/Premium.tsx`): selalu jelaskan apa yang terbuka,
  tampilkan harga, satu CTA ke `/app/premium?dari=<sumber>`. Jangan pernah modal yang "mengaktifkan" Premium di browser.
- Pilihan yang terkunci tetap terlihat (ikon gembok + label "Premium"), tidak disembunyikan; data lama tetap bisa dilihat/dihapus.
- Halaman `/app/premium`: kartu harga paling atas di mobile → tabel perbandingan (kolom Premium berlatar `gold-soft`) → FAQ.
  Checkout: 3 langkah, nominal besar + salin, QR hitam-putih murni (pengecualian token warna demi pemindai), tombol
  "Simpan gambar QR" untuk bayar dari HP yang sama, nama merchant QRIS ditampilkan agar pembayar tidak ragu.
- Akun demo tidak pernah menampilkan QR yang bisa dibayar.
- **Workspace Premium harus terasa beda di setiap halaman** (`data-premium` di root AppShell): latar `.app-backdrop` bercahaya emas
  + garis emas 3px di tepi atas, sidebar & header mobile berbingkai emas, kartu pasangan berbingkai gradien emas + badge "Premium aktif",
  kartu "Serasi Premium" gelap-emas menggantikan ajakan upgrade, chip "Premium" di header mobile, kilau `.premium-sheen` sekali lewat
  (mati saat reduced motion).

## Latar
- `.app-backdrop` (index.css): dua cahaya radial (primary + gold) + pola titik tipis yang memudar ke bawah. Kartu tetap putih solid
  agar angka mudah dibaca; jangan pakai glassmorphism pada data keuangan (kecuali stat di atas kartu ringkasan gelap).

## Format lokal
- Rupiah: `Rp 12.500.000` (Intl `id-ID`, tanpa desimal). Singkat: `Rp 12,5 jt`.
- Tanggal: `13 Oktober 2026`; singkat `13 Okt 2026`.
- Bahasa Indonesia natural, sapaan "kamu".

## Anti-pola
- Emoji sebagai ikon (pakai Lucide SVG).
- Statistik/testimoni/jumlah vendor fiktif di landing page.
- Label hanya placeholder; error hanya di atas form.
- Ikon tanpa label aksesibel; menghapus focus ring.
