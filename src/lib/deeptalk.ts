/**
 * Deep talk: pertanyaan untuk mengenal visi, misi, dan nilai pasangan sebelum menikah.
 * Jawaban pasangan baru terbuka setelah kamu menjawab pertanyaan yang sama (dijaga RLS).
 */

export type Alignment = 'sejalan' | 'perlu_dibahas' | 'berbeda'

export type DeepTalkQuestion = { id: string; text: string; hint?: string }
export type DeepTalkTopic = { id: string; title: string; description: string; questions: DeepTalkQuestion[] }

export const TOPICS: DeepTalkTopic[] = [
  {
    id: 'visi',
    title: 'Visi & masa depan',
    description: 'Arah hidup yang ingin kalian tuju bersama.',
    questions: [
      { id: 'visi_10_tahun', text: 'Seperti apa kehidupan kita 10 tahun lagi yang kamu bayangkan?', hint: 'Tempat tinggal, pekerjaan, keluarga, keseharian.' },
      { id: 'visi_makna_nikah', text: 'Apa arti pernikahan bagimu, dan kenapa kamu ingin menikah denganku?' },
      { id: 'visi_tujuan_bersama', text: 'Satu tujuan besar apa yang ingin kita capai bersama?' },
      { id: 'visi_keluarga_berhasil', text: 'Bagaimana kamu mendefinisikan keluarga yang "berhasil"?' },
      { id: 'visi_mimpi_pribadi', text: 'Mimpi pribadi apa yang tetap ingin kamu kejar setelah menikah, dan bagaimana aku bisa mendukungnya?' },
    ],
  },
  {
    id: 'iman',
    title: 'Iman & nilai',
    description: 'Prinsip yang akan menjadi fondasi rumah tangga.',
    questions: [
      { id: 'iman_praktik', text: 'Bagaimana kita akan menjalankan ibadah dan nilai agama di rumah tangga?' },
      { id: 'iman_nilai_utama', text: 'Tiga nilai apa yang paling ingin kita tanamkan di rumah?' },
      { id: 'iman_perbedaan', text: 'Jika kita berbeda pandangan soal prinsip, bagaimana cara kita menyikapinya?' },
      { id: 'iman_tradisi', text: 'Tradisi keluarga mana yang ingin kita lanjutkan, dan mana yang ingin kita ubah?' },
    ],
  },
  {
    id: 'keuangan',
    title: 'Keuangan',
    description: 'Topik yang paling sering memicu konflik bila tidak dibahas sejak awal.',
    questions: [
      { id: 'uang_kelola', text: 'Apakah keuangan kita digabung, dipisah, atau sebagian? Siapa yang mengelolanya?' },
      { id: 'uang_utang', text: 'Adakah utang atau cicilan yang perlu aku ketahui? Bagaimana rencana melunasinya?', hint: 'Termasuk paylater dan pinjaman keluarga.' },
      { id: 'uang_bantu_keluarga', text: 'Berapa porsi yang menurutmu wajar untuk membantu orang tua atau saudara?' },
      { id: 'uang_prioritas', text: 'Urutkan prioritas kita: rumah, kendaraan, pendidikan anak, investasi, dan liburan.' },
      { id: 'uang_belanja_besar', text: 'Pengeluaran sebesar apa yang perlu didiskusikan dulu sebelum dibeli?' },
      { id: 'uang_dana_darurat', text: 'Berapa dana darurat yang membuatmu merasa aman?' },
    ],
  },
  {
    id: 'keluarga',
    title: 'Keluarga besar',
    description: 'Batasan dan peran dua keluarga dalam rumah tangga kalian.',
    questions: [
      { id: 'kel_tempat_tinggal', text: 'Setelah menikah, kita tinggal di mana: sendiri, bersama orang tua, atau mertua? Untuk berapa lama?' },
      { id: 'kel_batas', text: 'Sejauh mana orang tua boleh terlibat dalam keputusan rumah tangga kita?' },
      { id: 'kel_hari_raya', text: 'Bagaimana kita membagi waktu hari raya dan kunjungan ke dua keluarga?' },
      { id: 'kel_konflik_mertua', text: 'Jika aku berselisih dengan keluargamu, apa yang kamu harapkan dariku dan apa yang akan kamu lakukan?' },
    ],
  },
  {
    id: 'anak',
    title: 'Anak & pengasuhan',
    description: 'Harapan tentang keturunan dan cara membesarkan anak.',
    questions: [
      { id: 'anak_keinginan', text: 'Apakah kamu ingin punya anak? Berapa, dan kapan idealnya?' },
      { id: 'anak_belum_diberi', text: 'Jika kita belum dikaruniai anak, bagaimana kita akan menyikapinya?' },
      { id: 'anak_pola_asuh', text: 'Pola asuh seperti apa yang ingin kita terapkan, dan apa yang tidak ingin kita ulangi dari masa kecil kita?' },
      { id: 'anak_pengasuhan', text: 'Siapa yang mengasuh anak sehari-hari? Apakah kamu terbuka dengan pengasuh atau daycare?' },
      { id: 'anak_pendidikan', text: 'Pendidikan seperti apa yang kita inginkan untuk anak?' },
    ],
  },
  {
    id: 'peran',
    title: 'Karier & peran',
    description: 'Pembagian peran di rumah dan rencana karier masing-masing.',
    questions: [
      { id: 'peran_karier', text: 'Bagaimana rencana karier kita masing-masing setelah menikah?' },
      { id: 'peran_pekerjaan_rumah', text: 'Bagaimana kita membagi pekerjaan rumah tangga?' },
      { id: 'peran_pindah_kota', text: 'Jika salah satu dari kita mendapat kesempatan kerja di kota lain, apa yang akan kita lakukan?' },
      { id: 'peran_nafkah', text: 'Bagaimana pandanganmu tentang pencari nafkah dan istri yang bekerja?' },
    ],
  },
  {
    id: 'komunikasi',
    title: 'Komunikasi & konflik',
    description: 'Cara kalian bertengkar dengan sehat dan saling berbaikan.',
    questions: [
      { id: 'kom_saat_marah', text: 'Saat marah, apa yang biasanya kamu lakukan, dan apa yang kamu butuhkan dariku?' },
      { id: 'kom_minta_maaf', text: 'Bagaimana caramu meminta maaf dan menerima permintaan maaf?' },
      { id: 'kom_merasa_dicintai', text: 'Hal kecil apa yang paling membuatmu merasa dicintai?' },
      { id: 'kom_privasi', text: 'Seberapa terbuka kita soal ponsel, media sosial, dan privasi?' },
      { id: 'kom_menenangkan_diri', text: 'Apakah kita sepakat menyelesaikan masalah sebelum tidur? Bagaimana jika salah satu butuh waktu menenangkan diri?' },
      { id: 'kom_pihak_ketiga', text: 'Kapan kita perlu meminta bantuan pihak ketiga, seperti konselor, tokoh agama, atau keluarga?' },
    ],
  },
  {
    id: 'hidup',
    title: 'Gaya hidup & kesehatan',
    description: 'Kebiasaan sehari-hari yang akan kalian jalani bersama.',
    questions: [
      { id: 'hidup_waktu_pribadi', text: 'Berapa banyak waktu pribadi dan waktu bersama teman yang kamu butuhkan?' },
      { id: 'hidup_kesehatan', text: 'Adakah kondisi kesehatan, fisik maupun mental, yang perlu aku ketahui?' },
      { id: 'hidup_kebiasaan', text: 'Kebiasaanku yang mana yang mungkin sulit kamu terima dalam jangka panjang?' },
      { id: 'hidup_waktu_luang', text: 'Seperti apa cara kita menikmati waktu luang dan liburan?' },
      { id: 'hidup_rumah_ideal', text: 'Seperti apa rumah yang nyaman bagimu, dari suasananya sampai kebiasaan sehari-hari di dalamnya?' },
      { id: 'hidup_keintiman', text: 'Apa harapanmu tentang kedekatan dan keintiman dalam pernikahan?' },
    ],
  },
]

export const ALL_QUESTIONS: (DeepTalkQuestion & { topicId: string })[] = TOPICS.flatMap((t) =>
  t.questions.map((q) => ({ ...q, topicId: t.id })),
)

export const ALIGNMENT_OPTIONS: { value: Alignment; label: string; description: string }[] = [
  { value: 'sejalan', label: 'Sejalan', description: 'Pandangan kami searah' },
  { value: 'perlu_dibahas', label: 'Perlu dibahas', description: 'Ada yang perlu diobrolkan lagi' },
  { value: 'berbeda', label: 'Berbeda', description: 'Pandangan kami cukup jauh' },
]

export type QuestionStatus =
  | 'belum_dijawab' // belum ada yang menjawab
  | 'pasangan_menunggu' // pasangan sudah menjawab, kamu belum
  | 'menunggu_pasangan' // kamu sudah menjawab, pasangan belum
  | 'perlu_dinilai' // keduanya menjawab, penilaian belum lengkap
  | Alignment

/**
 * Status gabungan sebuah pertanyaan.
 * Keduanya "sejalan" → sejalan. Salah satu "berbeda" → berbeda. Selain itu → perlu dibahas.
 */
export function questionStatus(input: {
  mineAnswered: boolean
  partnerAnswered: boolean
  mineAlignment: Alignment | null
  partnerAlignment: Alignment | null
}): QuestionStatus {
  const { mineAnswered, partnerAnswered, mineAlignment, partnerAlignment } = input
  if (!mineAnswered && !partnerAnswered) return 'belum_dijawab'
  if (!mineAnswered) return 'pasangan_menunggu'
  if (!partnerAnswered) return 'menunggu_pasangan'
  if (!mineAlignment || !partnerAlignment) return 'perlu_dinilai'
  if (mineAlignment === 'sejalan' && partnerAlignment === 'sejalan') return 'sejalan'
  if (mineAlignment === 'berbeda' || partnerAlignment === 'berbeda') return 'berbeda'
  return 'perlu_dibahas'
}

export const STATUS_LABEL: Record<QuestionStatus, string> = {
  belum_dijawab: 'Belum dijawab',
  pasangan_menunggu: 'Pasanganmu sudah menjawab',
  menunggu_pasangan: 'Menunggu pasangan',
  perlu_dinilai: 'Beri penilaian',
  sejalan: 'Sejalan',
  perlu_dibahas: 'Perlu dibahas',
  berbeda: 'Berbeda',
}
