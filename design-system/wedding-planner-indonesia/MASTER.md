# Design System — Serasi (MASTER)

Sumber kebenaran visual. Halaman tertentu boleh punya override di `pages/<halaman>.md`.
Token diimplementasikan di `src/index.css` (`@theme`). Komponen tidak boleh memakai hex mentah.

## Arah
- **Gaya:** Minimalism / Swiss dengan sentuhan editorial hangat. Bersih, lapang, grid jelas,
  bayangan tipis. Bukan template undangan tradisional, bukan glassmorphism.
- **Rasa:** premium, elegan, modern, hangat, dapat dipercaya (data keuangan).
- **Hasil pencarian ui-ux-pro-max:** palet "Wedding/Event" (pink) dan gaya "Liquid Glass" ditolak:
  PRD menetapkan deep green/ivory/gold, dan efek blur/translusen menurunkan keterbacaan angka.

## Warna
| Token | Hex | Pakai untuk |
|---|---|---|
| primary | #1F4D3A | CTA utama, nav aktif, fokus ring |
| primary-hover | #173B2C | hover CTA |
| primary-soft | #E6EFE9 | latar chip/nav aktif |
| gold | #C9A66B | ornamen, garis aksen, progress (dekoratif saja) |
| gold-text | #84652A | teks/aksen emas (kontras ≥ 4.5:1 di ivory) |
| gold-soft | #F5ECD9 | badge premium, highlight |
| gold-on-dark | #D9BE85 | teks emas di atas deep green (5.3:1) |
| rose | #8E3B46 | aksen pasangan (partner), dari buku nikah merah (6.9:1 di ivory) |
| rose-soft | #F7E9E8 | latar elemen pasangan |
| rose-light | #E7B7B4 | ornamen/teks di atas latar gelap |
| canvas | #FBF8F2 | latar halaman (ivory) |
| surface | #FFFFFF | kartu |
| surface-muted | #F4EFE5 | latar sekunder |
| border | #E5DDCD | garis kartu/input |
| ink | #1C2420 | teks utama |
| ink-muted | #545D58 | teks sekunder (≈ 6.5:1) |
| danger | #B42318 | peringatan, melebihi anggaran |
| warning | #9A5B07 | jatuh tempo dekat |
| success | #2A6E4C | selesai/lunas |
| ink-subtle | #656C67 | teks tersier/kecil (≥ 4.59:1 di semua latar terang) |

Status tidak pernah disampaikan hanya dengan warna — selalu ada ikon dan/atau teks.

## Simbol pasangan
Warna diambil dari foto bawaan (dua buku nikah): **hijau = owner**, **maroon = partner**. Dipakai konsisten
pada avatar, huruf tipe kepribadian, gelembung jawaban deep talk, dan cincin logo (emas + maroon muda).

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
  "Lainnya" membuka sheet berisi Tabungan bersama, Vendor, Tamu, Rundown, Pengaturan, Keluar.
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
- Anggaran: **tanpa tab**, padat di mobile. Ringkasan = angka sisa + bar + 3 baris (dibayar/belum/uang ada).
  Pos = kartu accordion (`h3 > button`, isi hanya span): baris 1 nama (satu baris) + chevron, baris 2 info
  (badge · n item · jatah singkat "Rp 5 jt") dan "sisa Rp …" di kanan. **Tombol "Tambah pos" hanya di bawah daftar.**
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

## Format lokal
- Rupiah: `Rp 12.500.000` (Intl `id-ID`, tanpa desimal). Singkat: `Rp 12,5 jt`.
- Tanggal: `13 Oktober 2026`; singkat `13 Okt 2026`.
- Bahasa Indonesia natural, sapaan "kamu".

## Anti-pola
- Emoji sebagai ikon (pakai Lucide SVG).
- Statistik/testimoni/jumlah vendor fiktif di landing page.
- Label hanya placeholder; error hanya di atas form.
- Ikon tanpa label aksesibel; menghapus focus ring.
