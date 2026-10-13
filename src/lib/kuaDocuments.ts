import type { DocumentSide, DocumentStatus, MemberSide, WeddingDocument } from './database.types'

/**
 * Persyaratan pendaftaran nikah di KUA (muslim, di dalam negeri).
 * Sumber utama: Peraturan Menteri Agama No. 30 Tahun 2024 tentang Pencatatan Pernikahan
 * (berlaku 30 Desember 2024, mencabut PMA 22/2024): Pasal 3–7, 11, 12, dan 14.
 * Item "umum" bukan syarat di PMA tetapi lazim diminta KUA; jumlah fotokopi & ukuran
 * foto bisa berbeda per KUA, jadi aplikasi menyarankan konfirmasi ke KUA setempat.
 */

export const KUA_SOURCE = {
  title: 'PMA No. 30 Tahun 2024 tentang Pencatatan Pernikahan',
  simkahUrl: 'https://simkah4.kemenag.go.id',
}

/** wajib = syarat di PMA untuk semua; kondisional = hanya jika situasinya berlaku; umum = lazim diminta KUA. */
export type DocKind = 'wajib' | 'kondisional' | 'umum'
/** each = masing-masing CPP & CPW menyiapkan sendiri; joint = langkah bersama. */
export type DocWho = 'each' | MemberSide | 'joint'

export type KuaDoc = {
  key: string
  title: string
  /** Satu kalimat: apa ini / kapan dibutuhkan. */
  detail: string
  /** Di mana mengurusnya. */
  where?: string
  kind: DocKind
  who: DocWho
  /** Untuk kondisional: pertanyaan singkat "berlaku jika…". */
  condition?: string
  /** Dasar aturan, mis. "Pasal 4 ayat (1) huruf a". */
  basis: string
}

export const KUA_DOCS: KuaDoc[] = [
  // ---------------------------------------------------------------- wajib, masing-masing
  {
    key: 'surat_pengantar',
    title: 'Surat pengantar nikah dari desa/kelurahan',
    detail: 'Dari desa/kelurahan sesuai alamat KTP. Biasanya perlu surat pengantar RT/RW lebih dulu.',
    where: 'Kantor desa/kelurahan · bawa KTP & KK',
    kind: 'wajib',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf a',
  },
  {
    key: 'akta_kelahiran',
    title: 'Fotokopi akta kelahiran',
    detail: 'Data nama, tanggal lahir, dan nama orang tua harus sama dengan KTP & KK.',
    where: 'Dari arsip pribadi · hilang? urus ulang di Disdukcapil',
    kind: 'wajib',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf b',
  },
  {
    key: 'ktp',
    title: 'Fotokopi KTP',
    detail: 'KTP elektronik yang masih berlaku. NIK diverifikasi KUA lewat data kependudukan.',
    kind: 'wajib',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf c',
  },
  {
    key: 'kk',
    title: 'Fotokopi kartu keluarga',
    detail: 'KK terbaru. Pastikan status "belum kawin" dan data orang tua sudah benar.',
    kind: 'wajib',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf d',
  },
  {
    key: 'surat_sehat',
    title: 'Surat keterangan sehat',
    detail: 'Dari fasilitas kesehatan. Banyak puskesmas sekaligus melakukan skrining pranikah (aplikasi Elsimil BKKBN).',
    where: 'Puskesmas / klinik / rumah sakit',
    kind: 'wajib',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf f',
  },
  {
    key: 'persetujuan',
    title: 'Surat persetujuan calon pengantin',
    detail: 'Pernyataan bahwa kamu menikah atas kemauan sendiri, ditandatangani CPP & CPW.',
    where: 'Formulir dari kelurahan / KUA',
    kind: 'wajib',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf g',
  },
  {
    key: 'bimwin',
    title: 'Sertifikat bimbingan perkawinan',
    detail: 'Wajib diikuti setelah mendaftar; sertifikatnya diperiksa saat pemeriksaan nikah.',
    where: 'KUA / Kemenag (tatap muka atau mandiri)',
    kind: 'wajib',
    who: 'each',
    basis: 'Pasal 5 & Pasal 6 ayat (2) huruf d',
  },
  {
    key: 'pas_foto',
    title: 'Pas foto',
    detail: 'Tidak diatur di PMA, tetapi umumnya diminta untuk buku/kartu nikah. Ukuran & warna latar ikuti KUA setempat.',
    where: 'Studio foto',
    kind: 'umum',
    who: 'each',
    basis: 'Praktik KUA',
  },

  // ---------------------------------------------------------------- kondisional, masing-masing
  {
    key: 'rekomendasi_nikah',
    title: 'Surat rekomendasi nikah dari KUA domisili',
    condition: 'Akad di luar kecamatan tempat tinggal (KTP)',
    detail: 'Diminta dari KUA kecamatan sesuai KTP, lalu dibawa ke KUA tempat akad.',
    where: 'KUA kecamatan sesuai KTP',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf e',
  },
  {
    key: 'izin_ortu',
    title: 'Izin tertulis orang tua/wali',
    condition: 'Usia belum 21 tahun',
    detail: 'Surat izin dari orang tua atau wali.',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf h',
  },
  {
    key: 'izin_wali_pengasuh',
    title: 'Izin dari wali pengasuh / keluarga sedarah / pengampu',
    condition: 'Belum 21 tahun dan kedua orang tua sudah meninggal atau tidak mampu menyatakan kehendak',
    detail: 'Pengganti izin orang tua.',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf i',
  },
  {
    key: 'izin_pengadilan',
    title: 'Izin dari Pengadilan Agama',
    condition: 'Belum 21 tahun dan tidak ada orang tua, wali, maupun pengampu',
    detail: 'Diajukan ke pengadilan agama sesuai domisili.',
    where: 'Pengadilan Agama',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf j',
  },
  {
    key: 'dispensasi_kawin',
    title: 'Surat dispensasi kawin dari Pengadilan',
    condition: 'Belum berusia 19 tahun pada tanggal akad',
    detail: 'Batas usia minimal menikah 19 tahun untuk pria dan wanita.',
    where: 'Pengadilan Agama',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf k & Pasal 11',
  },
  {
    key: 'izin_atasan',
    title: 'Surat izin atasan / kesatuan',
    condition: 'Anggota TNI atau Polri',
    detail: 'Izin menikah dari atasan atau kesatuan.',
    where: 'Kesatuan / satuan kerja',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf l',
  },
  {
    key: 'akta_cerai',
    title: 'Akta cerai',
    condition: 'Duda/janda cerai',
    detail: 'Untuk perceraian sebelum UU 7/1989: kutipan buku pendaftaran talak atau cerai.',
    where: 'Pengadilan Agama',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf n',
  },
  {
    key: 'akta_kematian',
    title: 'Akta kematian pasangan terdahulu',
    condition: 'Duda/janda ditinggal mati',
    detail: 'Akta kematian suami/istri sebelumnya.',
    where: 'Disdukcapil',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (1) huruf o',
  },
  {
    key: 'izin_poligami',
    title: 'Penetapan izin poligami dari Pengadilan',
    condition: 'Calon suami hendak beristri lebih dari seorang',
    detail: 'Penetapan pengadilan agama.',
    where: 'Pengadilan Agama',
    kind: 'kondisional',
    who: 'cpp',
    basis: 'Pasal 4 ayat (1) huruf m',
  },
  {
    key: 'taukil_wali',
    title: 'Surat taukil wali (kuasa wali nikah)',
    condition: 'Wali nikah tidak bisa hadir saat akad',
    detail: 'Dibuat wali di hadapan PPN/KUA domisili wali, disaksikan 2 orang.',
    where: 'KUA domisili wali',
    kind: 'kondisional',
    who: 'cpw',
    basis: 'Pasal 12 ayat (5)',
  },
  {
    key: 'wna_cni',
    title: 'Surat keterangan tidak ada halangan menikah (CNI)',
    condition: 'Warga negara asing (WNA)',
    detail: 'Dari kedutaan/perwakilan negaramu; negara peserta apostille melampirkan sertifikat apostille. Dokumen asing diterjemahkan penerjemah resmi.',
    where: 'Kedutaan / perwakilan negara asal',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (3) huruf a–b & ayat (4)',
  },
  {
    key: 'wna_paspor',
    title: 'Fotokopi paspor, akta kelahiran & data orang tua (WNA)',
    condition: 'Warga negara asing (WNA)',
    detail: 'Pengganti KTP/KK bagi WNA.',
    kind: 'kondisional',
    who: 'each',
    basis: 'Pasal 4 ayat (3) huruf d, f, g',
  },

  // ---------------------------------------------------------------- langkah bersama
  {
    key: 'daftar_kehendak',
    title: 'Daftar kehendak nikah',
    detail: 'Di KUA tempat akad atau online lewat SIMKAH, paling lambat 10 hari kerja sebelum akad. Kurang dari itu perlu dispensasi camat atau surat pernyataan bermeterai.',
    where: 'KUA tempat akad · simkah4.kemenag.go.id',
    kind: 'wajib',
    who: 'joint',
    basis: 'Pasal 3',
  },
  {
    key: 'ktp_wali_saksi',
    title: 'Fotokopi KTP wali nikah & 2 saksi',
    detail: 'Saksi: 2 laki-laki muslim, balig, berakal. Wali nasab berurutan dari ayah kandung.',
    kind: 'umum',
    who: 'joint',
    basis: 'Pasal 12 & 14 · praktik KUA',
  },
  {
    key: 'pemeriksaan_nikah',
    title: 'Hadiri pemeriksaan nikah di KUA',
    detail: 'CPP, CPW, dan wali hadir; wajah tidak ditutup masker; menandatangani surat pernyataan pertanggungjawaban mutlak.',
    where: 'KUA tempat akad',
    kind: 'wajib',
    who: 'joint',
    basis: 'Pasal 6',
  },
  {
    key: 'lengkapi_berkas',
    title: 'Lengkapi kekurangan berkas (jika ada)',
    detail: 'Bila KUA memberi tahu ada yang kurang, lengkapi paling lambat 1 hari kerja sebelum akad.',
    kind: 'wajib',
    who: 'joint',
    basis: 'Pasal 7',
  },
]

/** Dokumen yang berlaku untuk satu kolom (CPP / CPW / bersama). */
export function docsFor(side: DocumentSide): KuaDoc[] {
  if (side === 'joint') return KUA_DOCS.filter((d) => d.who === 'joint')
  return KUA_DOCS.filter((d) => d.who === 'each' || d.who === side)
}

export type DocState = 'todo' | 'done' | 'na' | 'off'

/**
 * Status efektif satu dokumen.
 *  - wajib/umum tanpa baris = todo
 *  - kondisional tanpa baris = off (tidak berlaku, tidak dihitung)
 */
export function docState(doc: KuaDoc, status: DocumentStatus | undefined): DocState {
  if (status) return status
  return doc.kind === 'kondisional' ? 'off' : 'todo'
}

export type DocStatusMap = Map<string, DocumentStatus>

export const statusKey = (docKey: string, side: DocumentSide) => `${side}:${docKey}`

export function toStatusMap(rows: Pick<WeddingDocument, 'doc_key' | 'side' | 'status'>[]): DocStatusMap {
  return new Map(rows.map((r) => [statusKey(r.doc_key, r.side), r.status]))
}

/** Progres satu kolom: hanya dokumen yang berlaku (bukan na/off). */
export function docProgress(side: DocumentSide, map: DocStatusMap): { done: number; total: number } {
  let done = 0
  let total = 0
  for (const doc of docsFor(side)) {
    const st = docState(doc, map.get(statusKey(doc.key, side)))
    if (st === 'na' || st === 'off') continue
    total += 1
    if (st === 'done') done += 1
  }
  return { done, total }
}

/**
 * Batas daftar kehendak nikah: 10 hari kerja (Senin–Jumat) sebelum akad.
 * Libur nasional belum dihitung, jadi tanggal sebenarnya bisa lebih awal.
 */
export function registrationDeadline(akad: Date): Date {
  const d = new Date(akad.getFullYear(), akad.getMonth(), akad.getDate())
  let workdays = 0
  while (workdays < 10) {
    d.setDate(d.getDate() - 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) workdays += 1
  }
  return d
}
