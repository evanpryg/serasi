/**
 * Tes kepribadian 16 tipe (4 dimensi), terinspirasi kerangka 16Personalities / MBTI®.
 * Diformulasikan khusus untuk konteks dinamika pasangan dan kehidupan rumah tangga di Indonesia.
 */

export type Dimension = 'EI' | 'SN' | 'TF' | 'JP'
export type Letter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
export type TypeCode = `${'E' | 'I'}${'S' | 'N'}${'T' | 'F'}${'J' | 'P'}`

export type Question = { id: string; text: string; dimension: Dimension; pole: Letter }

/** Skala jawaban 1–5. */
export const LIKERT = [
  { value: 1, label: 'Sangat tidak sesuai' },
  { value: 2, label: 'Tidak sesuai' },
  { value: 3, label: 'Netral' },
  { value: 4, label: 'Sesuai' },
  { value: 5, label: 'Sangat sesuai' },
] as const

/**
 * 40 butir pertanyaan berimbang (10 butir per dimensi: 5 kutub pertama, 5 kutub kedua).
 * Disesuaikan khusus dengan situasi nyata pernikahan, komunikasi, emosi, dan rumah tangga.
 */
const RAW: Question[] = [
  // --- DIMENSI EI (Energi Sosial & Ruang Pribadi) ---
  { id: 'e1', dimension: 'EI', pole: 'E', text: 'Setelah seharian lelah beraktivitas, mengobrol dan berkumpul dengan pasangan atau teman membuat energiku cepat pulih.' },
  { id: 'i1', dimension: 'EI', pole: 'I', text: 'Saat pulang ke rumah dalam keadaan lelah, aku butuh waktu tenang menyendiri sejenak sebelum siap diajak bicara panjang lebar.' },
  { id: 'e2', dimension: 'EI', pole: 'E', text: 'Aku merasa nyaman dan mudah mencairkan suasana saat harus berbaur dengan keluarga besar atau teman-teman baru pasangan.' },
  { id: 'i2', dimension: 'EI', pole: 'I', text: 'Acara keluarga besar atau kumpul ramai yang berlangsung terlalu lama sering kali membuat energiku terasa terkuras habis.' },
  { id: 'e3', dimension: 'EI', pole: 'E', text: 'Saat menghadapi masalah dalam hubungan, aku terbiasa memproses pikiran sambil mengucapkannya secara langsung kepada pasangan.' },
  { id: 'i3', dimension: 'EI', pole: 'I', text: 'Saat ada ketegangan, aku perlu waktu untuk merenung dan menata pikiran sendiri dulu sebelum siap mendiskusikannya.' },
  { id: 'e4', dimension: 'EI', pole: 'E', text: 'Aku senang membayangkan rumah kami kelak hangat dan sering dikunjungi teman, kerabat, atau mengadakan acara kumpul bersama.' },
  { id: 'i4', dimension: 'EI', pole: 'I', text: 'Aku lebih mendambakan rumah tangga yang tenang dan privat, di mana rumah benar-benar menjadi tempat perlindungan berdua dari hiruk-pikuk luar.' },
  { id: 'e5', dimension: 'EI', pole: 'E', text: 'Aku cepat merasa gelisah atau jenuh jika akhir pekan dihabiskan hanya berdiam diri di rumah tanpa agenda keluar.' },
  { id: 'i5', dimension: 'EI', pole: 'I', text: 'Akhir pekan ideal bagiku adalah bersantai berdua di rumah atau melakukan aktivitas tenang tanpa perlu bepergian ke tempat ramai.' },

  // --- DIMENSI SN (Pola Pikir, Informasi & Realitas Rumah Tangga) ---
  { id: 's1', dimension: 'SN', pole: 'S', text: 'Dalam merencanakan masa depan, aku lebih berpegang pada fakta nyata, angka riil, dan pengalaman yang sudah terbukti.' },
  { id: 'n1', dimension: 'SN', pole: 'N', text: 'Aku sering berimajinasi tentang berbagai kemungkinan mimpi besar dan visi jangka panjang untuk keluarga kami.' },
  { id: 's2', dimension: 'SN', pole: 'S', text: 'Saat berdiskusi soal rumah tangga, aku lebih suka langsung fokus pada detail praktis harian seperti anggaran bulanan, jadwal, dan pembagian tugas.' },
  { id: 'n2', dimension: 'SN', pole: 'N', text: 'Saat berdiskusi, aku lebih tertarik membicarakan gambaran besar, filosofi hidup, dan makna di balik keputusan yang kami ambil.' },
  { id: 's3', dimension: 'SN', pole: 'S', text: 'Aku merasa lebih aman mengikuti pola dan tradisi yang sudah lazim berjalan di keluarga daripada bereksperimen dengan cara baru.' },
  { id: 'n3', dimension: 'SN', pole: 'N', text: 'Aku senang mencari cara-cara baru yang tidak konvensional dalam mengelola hubungan dan rumah tangga kami.' },
  { id: 's4', dimension: 'SN', pole: 'S', text: 'Saat menceritakan kejadian hari ini ke pasangan, aku cenderung runut menceritakan detail kejadian apa adanya sesuai fakta.' },
  { id: 'n4', dimension: 'SN', pole: 'N', text: 'Saat bercerita, aku cenderung langsung lompat ke kesimpulan, pesan tersirat, atau makna dari apa yang kurasakan.' },
  { id: 's5', dimension: 'SN', pole: 'S', text: 'Aku memperhatikan detail fisik di sekitarku, seperti kondisi perabotan rumah, kebersihan barang, atau perubahan fisik pasangan.' },
  { id: 'n5', dimension: 'SN', pole: 'N', text: 'Aku lebih peka menangkap perubahan suasana hati atau firasat yang tersirat daripada memperhatikan detail benda di sekelilingku.' },

  // --- DIMENSI TF (Pengambilan Keputusan, Konflik & Emosi) ---
  { id: 't1', dimension: 'TF', pole: 'T', text: 'Saat mengambil keputusan penting bersama pasangan, pertimbangan logika dan efisiensi harus diutamakan di atas perasaan emosional.' },
  { id: 'f1', dimension: 'TF', pole: 'F', text: 'Saat mengambil keputusan, dampaknya terhadap perasaan pasangan dan keharmonisan batin kami adalah prioritas paling utama.' },
  { id: 't2', dimension: 'TF', pole: 'T', text: 'Aku menghargai kejujuran yang lugas dan to-the-point dari pasangan, meskipun kalimatnya mungkin terdengar tegas atau keras.' },
  { id: 'f2', dimension: 'TF', pole: 'F', text: 'Cara penyampaian dan kelembutan nada bicara sangat penting bagiku; kritik yang terlalu keras bisa membuat hatiku terluka mendalam.' },
  { id: 't3', dimension: 'TF', pole: 'T', text: 'Ketika pasangan mengeluhkan suatu masalah, naluri pertamaku adalah segera menganalisis akar masalah dan mencari jalan keluar konkret.' },
  { id: 'f3', dimension: 'TF', pole: 'F', text: 'Ketika pasangan sedang sedih atau curhat, yang terpenting bagiku adalah mendengarkan, memeluk, dan memvalidasi perasaannya dulu sebelum memberi solusi.' },
  { id: 't4', dimension: 'TF', pole: 'T', text: 'Saat terjadi perdebatan rumah tangga, aku fokus membela apa yang menurut data dan nalar benar, bukan sekadar mengalah demi damai.' },
  { id: 'f4', dimension: 'TF', pole: 'F', text: 'Menjaga perasaan pasangan dan kedamaian suasana rumah jauh lebih berharga bagiku daripada memenangkan adu argumen.' },
  { id: 't5', dimension: 'TF', pole: 'T', text: 'Dalam situasi krisis atau saat sedang tertekan, aku mampu menahan emosi dan tetap berpikir secara dingin serta objektif.' },
  { id: 'f5', dimension: 'TF', pole: 'F', text: 'Saat ada ketegangan atau pasangan cemberut, suasana hatiku langsung ikut terpengaruh dan sulit bagiku untuk bersikap acuh tak acuh.' },

  // --- DIMENSI JP (Gaya Hidup, Perencanaan & Spontanitas) ---
  { id: 'j1', dimension: 'JP', pole: 'J', text: 'Aku merasa tenang dan nyaman jika agenda harian, rencana liburan, dan urusan keuangan rumah tangga sudah terjadwal jelas.' },
  { id: 'p1', dimension: 'JP', pole: 'P', text: 'Aku lebih menikmati rencana yang fleksibel dan santai, di mana kita bisa memutuskan aktivitas secara spontan mengikuti suasana.' },
  { id: 'j2', dimension: 'JP', pole: 'J', text: 'Aku selalu berusaha menyelesaikan kewajiban dan tagihan rumah tangga jauh hari sebelum tanggal jatuh tempo.' },
  { id: 'p2', dimension: 'JP', pole: 'P', text: 'Aku cenderung lebih termotivasi menyelesaikan pekerjaan atau urusan administrasi ketika sudah mendekati batas akhir.' },
  { id: 'j3', dimension: 'JP', pole: 'J', text: 'Rumah yang rapi, barang-barang yang tertata di tempat semestinya, dan aturan yang jelas sangat membantu menjaga kestabilan mood-ku.' },
  { id: 'p3', dimension: 'JP', pole: 'P', text: 'Sedikit ketidakteraturan di rumah tidak menggangguku, yang penting suasananya santai dan tidak kaku dengan aturan yang membatasi.' },
  { id: 'j4', dimension: 'JP', pole: 'J', text: 'Perubahan jadwal yang tiba-tiba dari pasangan atau pembatalan janji mendadak sangat mudah membuatku merasa terganggu.' },
  { id: 'p4', dimension: 'JP', pole: 'P', text: 'Aku mudah beradaptasi dan tidak terlalu terbebani jika rencana yang sudah disusun bersama harus berubah sewaktu-waktu.' },
  { id: 'j5', dimension: 'JP', pole: 'J', text: 'Sebelum mengambil komitmen belanja besar, aku harus membuat perbandingan matang dan memastikan anggarannya sudah dialokasikan.' },
  { id: 'p5', dimension: 'JP', pole: 'P', text: 'Kadang aku senang melakukan pembelian atau mencoba hal baru secara impulsif jika saat itu dirasa menyenangkan dan menarik.' },
]

export const QUESTIONS: readonly Question[] = RAW

export type Answers = Record<string, number>

/** Persentase kecenderungan ke huruf pertama tiap dimensi (E, S, T, J). */
export type Scores = Record<'E' | 'S' | 'T' | 'J', number>

const FIRST: Record<Dimension, Letter> = { EI: 'E', SN: 'S', TF: 'T', JP: 'J' }
const SECOND: Record<Dimension, Letter> = { EI: 'I', SN: 'N', TF: 'F', JP: 'P' }
export const DIMENSIONS: Dimension[] = ['EI', 'SN', 'TF', 'JP']

export function isComplete(answers: Answers): boolean {
  return QUESTIONS.every((q) => {
    const v = answers[q.id]
    return Number.isInteger(v) && v! >= 1 && v! <= 5
  })
}

/**
 * Skor: setiap jawaban digeser ke rentang −2..+2 lalu diarahkan ke kutub butir.
 * Persentase = posisi total pada rentang [−maks, +maks] menuju huruf pertama.
 * Seri (50%) dihitung sebagai huruf pertama.
 */
export function scoreAnswers(answers: Answers): { type: TypeCode; scores: Scores } {
  if (!isComplete(answers)) throw new Error('Jawaban belum lengkap')
  const scores = {} as Scores
  let type = ''
  for (const dim of DIMENSIONS) {
    const items = QUESTIONS.filter((q) => q.dimension === dim)
    const max = items.length * 2
    const total = items.reduce((acc, q) => acc + (answers[q.id]! - 3) * (q.pole === FIRST[dim] ? 1 : -1), 0)
    const pct = Math.round(((total + max) / (2 * max)) * 100)
    scores[FIRST[dim] as keyof Scores] = pct
    type += pct >= 50 ? FIRST[dim] : SECOND[dim]
  }
  return { type: type as TypeCode, scores }
}

export const LETTER_INFO: Record<Letter, { name: string; short: string }> = {
  E: { name: 'Ekstrovert', short: 'Mengisi energi dari interaksi & lingkungan sosial' },
  I: { name: 'Introvert', short: 'Mengisi energi dari waktu tenang & ruang privat' },
  S: { name: 'Pengamat (Observant)', short: 'Berpijak pada fakta nyata, data & pengalaman konkret' },
  N: { name: 'Intuitif (Intuitive)', short: 'Tertarik pada visi masa depan, makna & kemungkinan baru' },
  T: { name: 'Pemikir (Thinking)', short: 'Memutuskan dengan analisis logika & nalar objektif' },
  F: { name: 'Perasa (Feeling)', short: 'Memutuskan dengan empati, keharmonisan & nilai hati' },
  J: { name: 'Terencana (Judging)', short: 'Nyaman dengan struktur, kepastian & jadwal jelas' },
  P: { name: 'Fleksibel (Prospecting)', short: 'Nyaman dengan spontanitas, adaptasi & kebebasan' },
}

export type MaritalFriction = {
  issue: string
  cause: string
  solution: string
}

export type AngerManagement = {
  behavior: string
  doThis: string
  dontDoThis: string
}

export type SocialInLaws = {
  style: string
  advice: string
}

export type DomesticLifestyle = {
  commStyle: string
  financialTendency: string
  spaceAndHabit: string
}

export type TypeProfile = {
  nickname: string
  roleName: string
  roleGroup: 'Explorers' | 'Sentinels' | 'Analysts' | 'Diplomats'
  summary: string
  strengths: string[]
  watchouts: string[]
  feelsLoved: string
  approach: string[]
  maritalFrictions: MaritalFriction[]
  whenAngry: AngerManagement
  socialAndInLaws: SocialInLaws
  domesticLifestyle: DomesticLifestyle
}

export const TYPE_PROFILES: Record<TypeCode, TypeProfile> = {
  ISTP: {
    nickname: 'Si Pemecah Masalah Praktis',
    roleName: 'Virtuoso (ISTP)',
    roleGroup: 'Explorers',
    summary: 'Tenang, mandiri, dan berorientasi pada tindakan nyata. Menyukai kebebasan ruang pribadi dan lebih memilih membuktikan cinta lewat perbuatan daripada janji manis.',
    strengths: [
      'Sangat tenang dan sigap mencari solusi konkret saat terjadi krisis rumah tangga',
      'Tidak banyak menuntut hal yang rumit dan mudah diajak hidup santai',
      'Terampil memperbaiki dan mengurus kebutuhan teknis fisik rumah tangga',
      'Menghormati privasi dan batasan pribadi pasangannya',
    ],
    watchouts: [
      'Cenderung menutup diri saat stres sehingga terkesan dingin atau cuek',
      'Sulit mengungkapkan perasaan secara verbal dan enggan membahas topik emosional yang berlarut-larut',
      'Bisa bersikap impulsif terhadap hobi atau minat pribadinya tanpa izin terlebih dahulu',
    ],
    feelsLoved: 'Saat pasangannya memberikan ruang privasi tanpa curiga, tidak menuntut drama emosi, dan menikmati kebersamaan santai lewat aktivitas nyata.',
    approach: [
      'Jangan memaksanya langsung berbicara saat ia sedang tertekan; beri waktu jeda untuk menenangkan diri',
      'Sampaikan keluhan secara to-the-point dan berbasis fakta, hindari nada bicara yang berputar-putar penuh sindiran',
      'Hargai baktinya lewat bantuan fisik (seperti antar-jemput atau merapikan perkakas), karena itulah bahasa cintanya',
    ],
    maritalFrictions: [
      {
        issue: 'Menarik diri total (Stonewalling) saat konflik emosi memuncak',
        cause: 'Karakter Introvert & Thinking membuatnya kewalahan saat dihadapi luapan emosi tinggi, sehingga otaknya memilih "mati suri" atau diam membisu.',
        solution: 'Sepakati kode jeda (time-out): beri ia waktu 30-60 menit untuk berpikir sendiri, dengan komitmen pasti bahwa ia akan kembali berdiskusi dengan tenang setelahnya.',
      },
      {
        issue: 'Keputusan impulsif terkait hobi atau petualangan pribadi',
        cause: 'Sifat Prospecting (fleksibel) dan kecintaan pada eksperimen membuatnya tergoda membeli perkakas/hobi baru tanpa diskusi anggaran terlebih dahulu.',
        solution: 'Buat pos anggaran khusus "Uang Pribadi Tanpa Intervensi" setiap bulan, sehingga ia memiliki kebebasan menikmati hobinya tanpa mengganggu keuangan bersama.',
      },
      {
        issue: 'Pasangan merasa kesepian karena minimnya obrolan hati ke hati',
        cause: 'Ia merasa bahwa jika tidak ada masalah praktis yang rusak, maka tidak ada hal yang perlu dibicarakan.',
        solution: 'Ajak ngobrol saat sedang melakukan aktivitas bersama (seperti berkendara atau berjalan santai), karena ISTP jauh lebih terbuka berbicara saat tangannya aktif bergerak.',
      },
    ],
    whenAngry: {
      behavior: 'Cenderung diam membeku, memotong pembicaraan dengan sarkasme tajam, atau langsung pergi menyibukkan diri dengan motor, gadget, atau hobi fisiknya.',
      doThis: 'Beri ia ruang dan udara segar tanpa mengejarnya. Bicaralah kembali beberapa jam kemudian dengan nada santai dan kepala dingin.',
      dontDoThis: 'Jangan mengejar ke kamarnya sambil menangis menuntut penjelasan instan, dan jangan pernah melabelinya "tidak punya hati" atau "egois".',
    },
    socialAndInLaws: {
      style: 'Cenderung pasif dalam obrolan basa-basi keluarga besar atau arisan, namun sangat suka membantu hal teknis di balik layar.',
      advice: 'Jangan memaksanya menjadi pusat perhatian di depan keluarga mertua. Beri ia peran praktis (seperti membantu menyajikan hidangan atau menyetir) agar ia merasa nyaman dan tetap dinilai santun.',
    },
    domesticLifestyle: {
      commStyle: 'Lugas, ringkas, dan praktis. Menghindari retorika dan benci perdebatan teoretis.',
      financialTendency: 'Sederhana dalam kebutuhan primer, namun rela merogoh kocek untuk peralatan berkualitas tinggi yang awet.',
      spaceAndHabit: 'Sangat membutuhkan satu sudut khusus di rumah sebagai "bengkel" atau ruang pribadinya yang tidak boleh diubah sembarangan.',
    },
  },

  ISTJ: {
    nickname: 'Si Penjaga Amanah',
    roleName: 'Logistician (ISTJ)',
    roleGroup: 'Sentinels',
    summary: 'Sangat dapat diandalkan, tertib, dan setia pada komitmen. Menjaga kestabilan rumah tangga dengan rutinitas yang teratur dan pengelolaan finansial yang sangat disiplin.',
    strengths: [
      'Pilar kestabilan rumah tangga: konsisten, tepat janji, dan memegang teguh komitmen',
      'Pengelola keuangan dan administrasi rumah tangga yang teliti dan terencana',
      'Selalu siap sedia melindungi dan menafkahi keluarga dengan penuh dedikasi',
      'Tenang dan berkepala dingin dalam menghadapi masalah keluarga',
    ],
    watchouts: [
      'Kaku terhadap perubahan mendadak dan sulit menerima cara baru di luar kebiasaannya',
      'Mudah cemas jika rencana tidak berjalan sesuai jadwal atau anggaran',
      'Jarang memuji atau mengekspresikan kemesraan secara spontan',
    ],
    feelsLoved: 'Saat pasangannya menghormati komitmen bersama, menjaga kerapihan rumah, dan menghargai kerja kerasnya dalam menafkahi keluarga.',
    approach: [
      'Beri kabar jauh-jauh hari jika ada rencana yang perlu diubah agar ia tidak kaget',
      'Tunjukkan bukti konkret saat mengusulkan ide baru, bukan hanya firasat',
      'Apresiasi usahanya secara teratur dan spesifik',
    ],
    maritalFrictions: [
      {
        issue: 'Perdebatan sengit saat rencana belanja atau jadwal keluarga berubah mendadak',
        cause: 'Kebutuhan tinggi akan prediktabilitas membuatnya merasa tidak aman jika jadwal diacak tanpa pemberitahuan.',
        solution: 'Gunakan kalender bersama dan agendakan rapat mingguan singkat (15 menit) untuk menyepakati agenda dan pos belanja bersama.',
      },
      {
        issue: 'Pasangan merasa hubungan terasa seperti rekan kerja korporat ketimbang suami-istri',
        cause: 'Terlalu fokus pada pemenuhan tugas logistik rumah tangga hingga lupa menyisipkan kemesraan emosional.',
        solution: 'Jadwalkan kencan rutin yang terjadwal resmi di kalender agar ia menganggap waktu romantis sebagai kewajiban yang wajib dipenuhi.',
      },
      {
        issue: 'Kritik yang terkesan kaku terhadap cara pasangan mengurus rumah',
        cause: 'Standar kerapihan dan prosedurnya sangat tinggi sehingga ia spontan mengoreksi apa yang dinilainya salah.',
        solution: 'Sepakati pembagian teritorial: berikan area tertentu di mana pasangan memiliki kebebasan penuh mengaturnya tanpa dikoreksi.',
      },
    ],
    whenAngry: {
      behavior: 'Wajah mengeras, menarik diri secara formal, dan berbicara dengan nada dingin penuh fakta kesalahan yang terjadi.',
      doThis: 'Akui fakta yang memang benar terjadi, mintalah maaf secara lugas tanpa alasan berbelit, dan fokus pada langkah koreksi.',
      dontDoThis: 'Jangan menuduhnya terlalu kaku atau pelit, dan jangan membalas dengan drama tangisan tanpa solusi konkret.',
    },
    socialAndInLaws: {
      style: 'Sangat menghormati norma adat, tata krama, dan kewajiban formal terhadap orang tua dan mertua.',
      advice: 'Jadikan ia garda depan dalam urusan formal keluarga besar (seperti acara lamaran atau musyawarah keluarga), ia akan membawakannya dengan sangat terhormat.',
    },
    domesticLifestyle: {
      commStyle: 'Faktual, prosedural, dan menghargai kejelasan hitam di atas putih.',
      financialTendency: 'Sangat konservatif; mengutamakan tabungan dana darurat, asuransi, dan investasi berisiko rendah.',
      spaceAndHabit: 'Menginginkan rumah yang selalu rapi, bersih, dan barang tersimpan sesuai tempatnya.',
    },
  },

  ISFJ: {
    nickname: 'Si Pengasuh Setia',
    roleName: 'Defender (ISFJ)',
    roleGroup: 'Sentinels',
    summary: 'Hangat, penuh perhatian pada detail kebutuhan pasangan, dan rela berkorban. Menjadikan kenyamanan rumah dan keluarga besar sebagai pengabdian hidupnya.',
    strengths: [
      'Sangat peka dan penuh perhatian merawat kebutuhan jasmani dan rohani pasangan',
      'Penyayang keluarga dan jembatan keharmonisan dengan mertua dan sanak saudara',
      'Sabar, telaten, dan selalu mengingat momen-momen berharga dalam hubungan',
      'Menciptakan suasana rumah yang hangat, nyaman, dan penuh kasih',
    ],
    watchouts: [
      'Sering memendam kekecewaan demi menjaga suasana hingga akhirnya meledak lelah batin',
      'Sulit menolak permintaan keluarga besar meski mengorbankan waktu keluarga inti',
      'Sangat sensitif terhadap kritik yang ditujukan pada caranya mengurus rumah tangga',
    ],
    feelsLoved: 'Saat pengorbanan kecilnya diperhatikan, dipeluk, dan diucapkan terima kasih dengan tulus oleh pasangan.',
    approach: [
      'Inisiatif tanyakan keadaannya: "Capek ya hari ini? Ada yang bisa kubantu?"',
      'Bantu ia menetapkan batasan yang sehat terhadap tuntutan keluarga besar',
      'Jangan mengkritik masakannya atau caranya merawat rumah di depan orang lain',
    ],
    maritalFrictions: [
      {
        issue: 'Kelelahan emosional (Burnout) akibat selalu mengalah dan melayani semua orang',
        cause: 'Rasa bersalah jika menolak permintaan pasangan atau mertua, sehingga ia menanggung beban di atas kapasitasnya.',
        solution: 'Pasangan harus proaktif mengambil alih tugas rumah tangga tertentu tanpa menunggu diminta olehnya.',
      },
      {
        issue: 'Konflik batas dengan mertua atau ipar yang terlalu mencampuri urusan rumah tangga',
        cause: 'Kecintaannya pada harmoni keluarga membuatnya enggan menegur intervensi keluarga besarnya sendiri.',
        solution: 'Sepakati prinsip: setiap orang bertanggung jawab mengomunikasikan batasan ke keluarganya masing-masing demi melindungi privasi rumah tangga.',
      },
      {
        issue: 'Pasif-agresif saat memendam unek-unek selama berminggu-minggu',
        cause: 'Takut memicu pertengkaran jika berbicara jujur, sehingga memilih menelan rasa sakit hati.',
        solution: 'Ciptakan "Ruang Aman Mingguan": waktu berdua tanpa gangguan di mana ia diajak menumpahkan isi hati tanpa dihakimi.',
      },
    ],
    whenAngry: {
      behavior: 'Menangis dalam diam, melakukan pekerjaan rumah tangga dengan gerakan berlebihan, atau melayani pasangan dengan sikap dingin kaku.',
      doThis: 'Dekati dengan lembut, sentuh tangannya, dan tanyakan apa yang membuatnya terluka dengan penuh kehangatan.',
      dontDoThis: 'Jangan bersikap acuh tak acuh seolah tidak ada apa-apa, dan jangan menyuruhnya "jangan lebay/baper".',
    },
    socialAndInLaws: {
      style: 'Sangat disayangi mertua karena perhatian, santun, dan selalu membawakan buah tangan atau hidangan kesukaan.',
      advice: 'Pasangan harus menjadi pelindung agar kebaikannya tidak dimanfaatkan berlebihan oleh pihak keluarga yang manipulatif.',
    },
    domesticLifestyle: {
      commStyle: 'Lembut, penuh empati, dan memperhatikan nada suara serta pemilihan kata.',
      financialTendency: 'Hemat untuk diri sendiri, namun murah hati membelanjakan kebutuhan anak, pasangan, dan keluarga.',
      spaceAndHabit: 'Rumah adalah sarang kehangatan; menyukai dekorasi yang nyaman, wangi, dan penuh foto kenangan.',
    },
  },

  INFJ: {
    nickname: 'Si Penasihat Bijak',
    roleName: 'Advocate (INFJ)',
    roleGroup: 'Diplomats',
    summary: 'Mendalam, idealis, dan memiliki intuisi tajam memahami jiwa pasangan. Mencari keterhubungan batin yang sejati dan visi spiritual dalam pernikahan.',
    strengths: [
      'Mampu memahami perasaan dan luka batin pasangan bahkan sebelum terucap',
      'Memiliki visi jangka panjang yang luhur untuk masa depan keluarga',
      'Setia tanpa syarat dan berkomitmen mendalam pada pertumbuhan pasangan',
      'Pendengar yang tulus dan penasihat yang sangat bijaksana',
    ],
    watchouts: [
      'Menuntut kesempurnaan batin dan mudah kecewa jika kenyataan tidak seindah idealismenya',
      'Bisa melakukan "Doorslam" (menutup pintu hati seketika) jika merasa dikhianati berulang kali',
      'Mudah lelah menyerap energi emosional di sekitarnya',
    ],
    feelsLoved: 'Saat pasangannya benar-benar berusaha memahami isi pikirannya yang rumit dan menghargai nilai-nilai hidupnya.',
    approach: [
      'Ajak obrolan mendalam tentang makna hidup, bukan hanya seputar urusan uang dan belanja',
      'Beri ia waktu sendiri di tempat hening untuk menyegarkan batinnya',
      'Jangan pernah memanipulasi atau berpura-pura, ia memiliki intuisi membaca kebohongan',
    ],
    maritalFrictions: [
      {
        issue: 'Kekecewaan mendalam terhadap realitas kebiasaan harian pasangan yang tidak sempurna',
        cause: 'Ekspektasi idealis yang tinggi terhadap gambaran pernikahan yang harmonis dan suci.',
        solution: 'Bantu ia membumikan harapan: ingatkan bahwa ketidaksempurnaan manusiawi adalah bagian indah dari perjalanan saling menerima.',
      },
      {
        issue: 'Menarik diri ke dunia batinnya sendiri saat merasa tidak dipahami',
        cause: 'Merasa lelah menjelaskan isi hatinya yang kompleks kepada pasangan yang terlalu praktis.',
        solution: 'Pasangan cukup menunjukkan kesediaan untuk mendengarkan tanpa harus buru-buru memahami seluruh kerumitannya.',
      },
      {
        issue: 'Mengabaikan kebutuhan praktis fisik (kelelahan, makan tidak teratur) demi memikirkan orang lain',
        cause: 'Fokus berlebih pada intuisi dan empati hingga melupakan kebutuhan ragawi diri sendiri.',
        solution: 'Pasangan bertindak sebagai pengingat praktis: sediakan makanan hangat dan ajak ia beristirahat fisik secara teratur.',
      },
    ],
    whenAngry: {
      behavior: 'Menjadi sangat dingin, tatapan mata berjarak, dan menarik diri ke kesendirian mutlak.',
      doThis: 'Beri waktu untuk merenung, lalu kirimkan pesan singkat penuh ketulusan bahwa kamu siap mendengarkan kapan pun ia siap.',
      dontDoThis: 'Jangan memaksa membicarakan masalah saat ia sedang terluka, dan jangan membalas dengan argumen dangkal yang manipulatif.',
    },
    socialAndInLaws: {
      style: 'Sopan dan hangat namun menjaga jarak privasi yang tegas; tidak suka basa-basi pura-pura akrab.',
      advice: 'Lindungi ia dari kewajiban sosial keluarga besar yang melelahkan agar batinnya tidak mudah rapuh.',
    },
    domesticLifestyle: {
      commStyle: 'Mendalam, metaforis, dan mencari makna di balik setiap peristiwa.',
      financialTendency: 'Mengalokasikan dana untuk buku, kesehatan mental, dan kegiatan amal/pertumbuhan spiritual.',
      spaceAndHabit: 'Membutuhkan sudut baca atau ruang hening di rumah untuk merenung dan mengisi ulang sukma.',
    },
  },

  INTJ: {
    nickname: 'Si Perancang Strategi',
    roleName: 'Architect (INTJ)',
    roleGroup: 'Analysts',
    summary: 'Visioner, mandiri, dan analitis. Memandang pernikahan sebagai kemitraan strategis jangka panjang yang harus terus bertumbuh, efisien, dan memiliki arah masa depan yang kokoh.',
    strengths: [
      'Perencana keuangan, investasi, dan masa depan keluarga yang luar biasa matang',
      'Tenang, objektif, dan tidak mudah panik dalam situasi genting',
      'Mendorong pasangan untuk terus berkembang dan mencapai potensi tertingginya',
      'Setia pada komitmen jangka panjang yang telah disepakatinya',
    ],
    watchouts: [
      'Bisa terkesan arogan, terlalu kritis, atau menyepelekan emosi pasangan yang dianggap tidak logis',
      'Kurang peka terhadap kebutuhan validasi perasaan dan kata-kata manis',
      'Sulit berkompromi jika merasa rencananya adalah yang paling objektif dan benar',
    ],
    feelsLoved: 'Saat pasangannya menghargai pemikirannya, mendukung target besar masa depan, dan menjadi mitra diskusi intelektual yang setara.',
    approach: [
      'Gunakan argumen berbasis data dan logika yang masuk akal saat berbeda pendapat',
      'Ingatkan dengan lembut bahwa emosi manusia adalah fakta psikologis yang sah, bukan sekadar kelemahan nalar',
      'Hormati waktu fokus dan konsentrasinya saat ia sedang mendalami proyek keluarga',
    ],
    maritalFrictions: [
      {
        issue: 'Kritik yang terlalu tajam merontokkan rasa percaya diri pasangan',
        cause: 'Niat awalnya adalah memperbaiki kekurangan agar efisien, namun disampaikan tanpa filter empati.',
        solution: 'Terapkan aturan komunikasi: sebelum memberi masukan kritis, sebutkan 2 hal yang sudah dilakukan pasangan dengan sangat baik.',
      },
      {
        issue: 'Memaksakan sistem dan aturan efisiensi yang terlalu kaku di rumah tangga',
        cause: 'Benci pemborosan waktu dan energi, sehingga memperlakukan rumah tangga seperti sistem organisasi.',
        solution: 'Sepakati bahwa rumah adalah tempat beristirahat dan bersenang-senang, bukan hanya tentang produktivitas maksimal.',
      },
      {
        issue: 'Mengabaikan momen romantis spontan karena dianggap tidak ada dalam rencana',
        cause: 'Semua hal harus terjadwal dalam cetak biru masa depannya.',
        solution: 'Masukkan jadwal kencan kejutan ke dalam agenda tahunan sebagai target penting pemeliharaan kemitraan asmara.',
      },
    ],
    whenAngry: {
      behavior: 'Menghakimi secara dingin dengan argumen logis yang mematikan atau mengisolasi diri di ruang kerja.',
      doThis: 'Ajak bicara dengan kepala dingin, sampaikan data dan sudut pandang objektif tanpa luapan emosi berlebihan.',
      dontDoThis: 'Jangan menyerang dengan argumen emosional tanpa dasar, dan jangan menyela saat ia sedang menyusun penjelasannya.',
    },
    socialAndInLaws: {
      style: 'Sangat selektif bersosialisasi; tidak tahan terhadap obrolan gosip keluarga besar atau basa-basi kosong.',
      advice: 'Sepakati peran: biarkan pasangan yang ramah menjembatani obrolan sosial, sementara INTJ membackup urusan logistik dan strategis.',
    },
    domesticLifestyle: {
      commStyle: 'Lugas, konseptual, dan langsung menuju inti kesimpulan.',
      financialTendency: 'Sangat strategis; fokus pada aset produktif, investasi masa depan anak, dan kemandirian finansial.',
      spaceAndHabit: 'Membutuhkan ruang kerja mandiri yang privat, hening, dan bebas gangguan.',
    },
  },

  ISFP: {
    nickname: 'Si Seniman Lembut',
    roleName: 'Adventurer (ISFP)',
    roleGroup: 'Explorers',
    summary: 'Lembut, peka estetika, dan hidup di saat ini. Mengekspresikan cinta lewat tindakan manis, sentuhan fisik, dan menciptakan keindahan visual di dalam rumah tangga.',
    strengths: [
      'Menerima pasangan apa adanya dengan kehangatan dan toleransi tinggi',
      'Menciptakan suasana rumah yang estetik, damai, dan nyaman dihuni',
      'Fleksibel, tidak menuntut, dan menyenangkan diajak menikmati momen hidup',
      'Sangat setia dan tulus dalam menjaga komitmen pernikahan',
    ],
    watchouts: [
      'Menghindari konfrontasi masalah hingga persoalan menumpuk di bawah karpet',
      'Sangat rapuh terhadap kritik dan mudah merasa tidak dihargai',
      'Kurang tertarik pada perencanaan anggaran keuangan jangka panjang yang kaku',
    ],
    feelsLoved: 'Saat pasangannya memuji selera estetikanya, memberi kasih sayang fisik, dan membiarkannya menjadi diri sendiri secara otentik.',
    approach: [
      'Kritik dengan sangat lembut dan secara pribadi, jangan pernah merendahkannya di depan orang lain',
      'Bantu ia menangani urusan administratif dan keuangan tanpa terkesan menggurui',
      'Beri ruang untuk mengekspresikan kreativitas dan hobinya di rumah',
    ],
    maritalFrictions: [
      {
        issue: 'Masalah rumah tangga yang dibiarkan berlarut-larut karena takut berdebat',
        cause: 'Kecemasan ekstrem terhadap konflik membuatnya memilih bungkam dan berpura-pura semuanya baik-baik saja.',
        solution: 'Ciptakan suasana diskusi yang santai (sambil makan malam atau jalan-jalan sore), gunakan bahasa "Aku merasa..." bukan "Kamu selalu...".',
      },
      {
        issue: 'Ketidaksiapan mengelola anggaran bulanan dan pos tabungan masa depan',
        cause: 'Lebih menikmati momen hari ini dan mudah tergiur membeli hal-hal indah yang memanjakan panca indera.',
        solution: 'Gunakan sistem tabungan otomatis di awal bulan, sehingga sisa uang di rekening bebas dibelanjakan tanpa rasa cemas.',
      },
      {
        issue: 'Merasa terkekang oleh aturan dan jadwal kaku yang dipaksakan pasangan',
        cause: 'Jiwa senimannya membutuhkan kebebasan bergerak dan spontanitas.',
        solution: 'Beri kelonggaran dalam rutinitas harian asalkan tanggung jawab utama tetap terselesaikan.',
      },
    ],
    whenAngry: {
      behavior: 'Merajuk dalam diam, menarik diri dari sentuhan fisik, atau menangis di kamar sendirian.',
      doThis: 'Beri pelukan hangat, dengarkan perasaannya tanpa menyela, dan tunjukkan bahwa cintamu tidak berkurang sedikit pun.',
      dontDoThis: 'Jangan mendebat perasaannya dengan logika kasar, dan jangan mendesaknya berbicara saat ia masih tersedu-sedu.',
    },
    socialAndInLaws: {
      style: 'Manis dan ramah namun pemalu; lebih suka mengamati dan menikmati kebersamaan daripada tampil di panggung utama.',
      advice: 'Bantu ia merasa aman di tengah keluarga besar; temani dan dampingi saat berinteraksi dengan mertua.',
    },
    domesticLifestyle: {
      commStyle: 'Halus, tidak menggurui, dan mengekspresikan perhatian lewat gestur fisik.',
      financialTendency: 'Spontan menikmati hal-hal indah; butuh sistem pendampingan finansial yang simpel.',
      spaceAndHabit: 'Menghargai ruang yang asri, penuh tanaman, wewangian aromaterapi, dan pencahayaan yang hangat.',
    },
  },

  INFP: {
    nickname: 'Si Pemimpi Tulus',
    roleName: 'Mediator (INFP)',
    roleGroup: 'Diplomats',
    summary: 'Penuh empati, idealis, dan mendambakan cinta sejati yang bermakna mendalam. Sangat setia pada nilai-nilai batin dan selalu memperjuangkan kebahagiaan pasangan.',
    strengths: [
      'Empati luar biasa yang mampu menjadi tempat bersandar paling nyaman bagi pasangan',
      'Kreatif menghidupkan romantisme dan sentuhan puitis dalam pernikahan',
      'Sangat setia, berpikiran terbuka, dan menghargai keunikan pasangannya',
      'Mendukung mimpi-mimpi besar pasangan dengan ketulusan hati',
    ],
    watchouts: [
      'Cenderung overthinking, baper, dan memendam luka batin berlarut-larut',
      'Kesulitan menghadapi urusan logistik praktis, dokumen, dan angka keuangan',
      'Mudah merasa bersalah dan memikul beban emosi yang bukan tanggung jawabnya',
    ],
    feelsLoved: 'Saat pasangannya menerima sisi terdalam dirinya tanpa menghakimi, mendengarkan curahan hatinya, dan menghargai kelembutan jiwanya.',
    approach: [
      'Validasi perasaannya terlebih dahulu sebelum mencoba memberikan jalan keluar logis',
      'Bantu urusan administratif dan teknis rumah tangga dengan sabar',
      'Beri kepastian cinta secara verbal secara berkala agar ia tidak overthinking',
    ],
    maritalFrictions: [
      {
        issue: 'Terjebak dalam pusaran overthinking dan merasa tidak dicintai karena hal kecil',
        cause: 'Kecenderungan membaca makna tersirat secara berlebihan dari perubahan nada bicara atau ekspresi pasangan.',
        solution: 'Budayakan klarifikasi langsung: dorong ia bertanya "Apakah kamu sedang marah padaku?" daripada menebak-nebak sendiri.',
      },
      {
        issue: 'Kekacauan dalam pengelolaan dokumen, tagihan, dan kebersihan rumah tangga',
        cause: 'Fokus pikirannya berada di dunia ide dan perasaan, sehingga hal-hal rutin terasa membosankan dan melelahkan.',
        solution: 'Bagi tugas secara adil: serahkan urusan ide kreatif dan keharmonisan padanya, sementara pasangan menangani sistem administrasi dan tagihan.',
      },
      {
        issue: 'Menyimpan dendam emosional tersembunyi karena selalu mengalah',
        cause: 'Sangat menghindari perdebatan hingga mengorbankan nilai pribadinya demi pasangan.',
        solution: 'Beri ia afirmasi bahwa menyatakan perbedaan pendapat bukanlah tanda hilangnya cinta dalam rumah tangga.',
      },
    ],
    whenAngry: {
      behavior: 'Menangis tersedu, mengunci diri di kamar, atau menuliskan pesan panjang penuh luapan luka batin.',
      doThis: 'Baca dan dengarkan perasaannya dengan tulus, dekap tubuhnya, dan sampaikan permohonan maaf atas luka yang ia rasakan.',
      dontDoThis: 'Jangan meremehkan perasaannya sebagai "terlalu lebay/drama", dan jangan membalas dengan argumen dingin tanpa empati.',
    },
    socialAndInLaws: {
      style: 'Sopan, santun, dan peka nilai moral keluarga; namun cepat lelah jika dipaksa terus berinteraksi sosial.',
      advice: 'Beri ia waktu jeda istirahat setelah menghadiri acara keluarga besar agar energinya kembali pulih.',
    },
    domesticLifestyle: {
      commStyle: 'Puitis, lembut, penuh rasa, dan sarat makna simbolik.',
      financialTendency: 'Sederhana dan tidak materialistis; lebih suka membelanjakan uang untuk pengalaman bermakna dan buku.',
      spaceAndHabit: 'Membutuhkan sudut rumah yang nyaman untuk menulis, membaca, atau sekadar melamun damai.',
    },
  },

  INTP: {
    nickname: 'Si Pemikir Analitis',
    roleName: 'Logician (INTP)',
    roleGroup: 'Analysts',
    summary: 'Rasional, obyektif, dan haus akan kebenaran logis. Menyukai diskusi intelektual dan memecahkan teka-teki kehidupan bersama pasangan tanpa drama yang berlebihan.',
    strengths: [
      'Sangat adil, obyektif, dan tidak mudah terbawa bias emosional saat menyelesaikan masalah',
      'Kreatif menemukan solusi tidak biasa untuk memecahkan kendala rumah tangga',
      'Santai, tidak menuntut hal-hal sepele, dan memberi kebebasan penuh pada pasangan',
      'Jujur, tulus, dan tidak pernah bermain intrik atau manipulasi emosi',
    ],
    watchouts: [
      'Sering melupakan hal-hal praktis sehari-hari seperti tanggal penting, kunci, atau janji temu',
      'Terlihat dingin dan tidak peka saat pasangan membutuhkan dukungan emosional murni',
      'Terlalu banyak menganalisis masalah hingga lambat mengambil tindakan nyata',
    ],
    feelsLoved: 'Saat pasangannya menghargai kecerdasannya, memberi kebebasan ruang berpikir, dan mengajak bertukar pikiran secara jujur.',
    approach: [
      'Sampaikan kebutuhan emosionalmu secara eksplisit: "Aku hanya ingin dipeluk, belum butuh solusi"',
      'Gunakan alarm dan pengingat digital bersama untuk hal-hal praktis dan tanggal penting',
      'Jangan memaksanya bersikap romantis dengan cara-cara klise yang terasa palsu baginya',
    ],
    maritalFrictions: [
      {
        issue: 'Pasangan merasa diabaikan karena INTP sering tenggelam dalam dunia riset dan pikirannya sendiri',
        cause: 'Otaknya selalu aktif memproses teori dan konsep, sehingga lupa menyapa dunia nyata di sekitarnya.',
        solution: 'Sepakati "Waktu Hadir Utuh": 30 menit setiap malam tanpa layar gadget untuk saling bercerita dan terkoneksi secara fisik.',
      },
      {
        issue: 'Perdebatan kusir tentang siapa yang logis saat menghadapi perselisihan rumah tangga',
        cause: 'Melihat perdebatan sebagai ajang mencari kebenaran logika, bukan mencari titik temu keharmonisan hati.',
        solution: 'Ingatkan bahwa dalam pernikahan, tujuan komunikasi adalah saling memahami, bukan memenangkan perdebatan ilmiah.',
      },
      {
        issue: 'Tugas-tugas rumah tangga yang terbengkalai karena ditunda-tunda',
        cause: 'Kurang berminat pada hal-hal rutin domestik yang dianggap repetitif dan tidak menantang otak.',
        solution: 'Ubah tugas rumah menjadi tantangan efisiensi atau gunakan teknologi otomasi (seperti mesin cuci pintar/robot vacuum).',
      },
    ],
    whenAngry: {
      behavior: 'Menjadi sangat sinis, membedah kesalahan logika pasangan secara teliti, atau mengurung diri di depan komputer.',
      doThis: 'Beri waktu untuk menata logikanya, lalu bicaralah dengan tenang dan akui poin-poin yang memang masuk akal.',
      dontDoThis: 'Jangan menuduhnya "tidak punya perasaan", dan jangan menggunakan manipulasi rasa bersalah untuk memaksanya menyerah.',
    },
    socialAndInLaws: {
      style: 'Canggung dalam basa-basi sosial; lebih suka menyimak atau mengobrol dengan orang yang memiliki minat bahasan serupa.',
      advice: 'Bantu ia saat menghadapi mertua dengan memberikan topik obrolan yang aman dan tidak menghakiminya yang pendiam.',
    },
    domesticLifestyle: {
      commStyle: 'Eksploratif, logis, jujur apa adanya, dan bebas pretensi.',
      financialTendency: 'Praktis dan hemat, namun tidak ragu membeli buku, software, atau teknologi penunjang rasa ingin tahunya.',
      spaceAndHabit: 'Ruang kerja pribadi yang tenang adalah kebutuhan mutlak untuk menjaga kewarasan pikirannya.',
    },
  },

  ESTP: {
    nickname: 'Si Penggerak Aksi',
    roleName: 'Entrepreneur (ESTP)',
    roleGroup: 'Explorers',
    summary: 'Energik, spontan, dan berani mengambil risiko. Membawa semangat, tawa, dan petualangan nyata dalam kehidupan pernikahan sehari-hari.',
    strengths: [
      'Sangat cekatan bertindak cepat dan adaptif menghadapi situasi darurat keluarga',
      'Menjadikan kehidupan rumah tangga seru, penuh tawa, dan tidak membosankan',
      'Komunikator yang lugas, tidak suka memendam dendam, dan cepat memaafkan',
      'Pandai bergaul dan mencairkan suasana di berbagai lingkungan sosial',
    ],
    watchouts: [
      'Mudah impulsif dalam mengambil keputusan finansial atau petualangan mendadak',
      'Kurang sabar mendengarkan keluh kesah emosional yang panjang dan rumit',
      'Bisa mengabaikan perencanaan masa depan jangka panjang demi kesenangan saat ini',
    ],
    feelsLoved: 'Saat pasangannya ikut bersemangat mencoba hal baru, menghargai keberaniannya, dan tidak mengekangnya dengan aturan kaku.',
    approach: [
      'Bahas rencana masa depan dengan cara yang ringkas, seru, dan berorientasi aksi nyata',
      'Sepakati batas aman pengeluaran spontan bersama agar tidak mengganggu kas utama',
      'Selesaikan masalah langsung saat itu juga; jangan mendiamkannya berhari-hari',
    ],
    maritalFrictions: [
      {
        issue: 'Pengeluaran uang yang bocor halus akibat ajakan nongkrong atau belanja spontan',
        cause: 'Karakter Ekstrovert & Fleksibel yang suka menikmati hidup di saat ini bersama lingkaran sosialnya.',
        solution: 'Kunci dana tabungan dan investasi di rekening terpisah yang tidak memiliki akses kartu debit harian.',
      },
      {
        issue: 'Ketidaksabaran saat pasangan membutuhkan waktu lama untuk menenangkan emosi',
        cause: 'Ingin masalah segera selesai detik itu juga agar suasana kembali ceria.',
        solution: 'Latih diri untuk menahan diri: pahami bahwa pasangan membutuhkan proses pengolahan emosi sebelum siap tersenyum kembali.',
      },
      {
        issue: 'Komitmen rencana jangka panjang yang sering bergeser karena tergiur peluang baru',
        cause: 'Sangat oportunistik dan mudah bosan dengan rutinitas yang monoton.',
        solution: 'Buat target-target jangka pendek yang menantang dan beri reward menyenangkan saat target tercapai bersama.',
      },
    ],
    whenAngry: {
      behavior: 'Meledak cepat dengan suara keras dan kata-kata lugas, namun kemarahannya cepat reda seperti badai lewat.',
      doThis: 'Tetap tenang, tatap matanya, sampaikan fakta dengan tegas dan tidak berbelit-belit.',
      dontDoThis: 'Jangan membalas dengan silent treatment berhari-hari, dan jangan mengungkit kesalahan masa lampau.',
    },
    socialAndInLaws: {
      style: 'Sangat disukai keluarga besar karena ramah, humoris, berani menyapa siapa saja, dan pandai menghidupkan suasana.',
      advice: 'Pastikan ia tetap ingat waktu pulang dan tidak terlalu larut terbawa suasana kumpul-kumpul bersama kerabat/kolega.',
    },
    domesticLifestyle: {
      commStyle: 'Lugas, energik, penuh canda, dan to-the-point.',
      financialTendency: 'Suka perputaran uang yang cepat; berani mengambil peluang usaha atau investasi spekulatif.',
      spaceAndHabit: 'Menyukai rumah yang dinamis, dekat dengan akses olahraga, hiburan, dan ruang terbuka.',
    },
  },

  ESFP: {
    nickname: 'Si Penghidup Suasana',
    roleName: 'Entertainer (ESFP)',
    roleGroup: 'Explorers',
    summary: 'Ceria, hangat, dan murah hati. Mengisi rumah tangga dengan kehangatan cinta, musik, tawa, dan perhatian tulus kepada pasangan dan buah hati.',
    strengths: [
      'Penyayang yang ekspresif; rajin memeluk, memuji, dan membahagiakan pasangan',
      'Peka terhadap suasana hati pasangan dan pandai menghibur saat sedih',
      'Menjadikan rumah tempat yang menyenangkan bagi keluarga dan sahabat',
      'Murah hati dan tidak segan berbagi rezeki dengan orang tersayang',
    ],
    watchouts: [
      'Cenderung menghindari pembicaraan serius atau konflik yang terasa berat',
      'Bisa boros demi gaya hidup, fashion, dekorasi, atau traktiran sosial',
      'Mudah cemas dan sedih jika merasa dikritik atau diabaikan oleh pasangan',
    ],
    feelsLoved: 'Saat pasangan hadir sepenuhnya mendampinginya, memuji penampilannya, dan ikut bersenang-senang menikmati hidup bersamanya.',
    approach: [
      'Bahas masalah serius dalam suasana yang tetap hangat dan tidak mengancam',
      'Bantu ia mencatat keuangan dengan aplikasi yang simpel dan visual menarik',
      'Sering-seringlah memberikan pelukan dan kata-kata pujian cinta setiap hari',
    ],
    maritalFrictions: [
      {
        issue: 'Kebiasaan menghindari perbincangan berat tentang utang atau evaluasi rumah tangga',
        cause: 'Takut suasana ceria rusak dan membenci aura ketegangan di dalam rumah.',
        solution: 'Bungkus evaluasi rumah tangga dengan suasana manis: pesan makanan favorit dan awali dengan apresiasi hal-hal indah.',
      },
      {
        issue: 'Tekanan finansial akibat gaya hidup dan kebiasaan belanja yang impulsif',
        cause: 'Sangat peka tren visual dan senang membahagiakan diri serta orang lain lewat materi.',
        solution: 'Beri ia jatah "uang jajan bulanan" tetap yang bebas digunakan tanpa perlu membuat laporan rincian.',
      },
      {
        issue: 'Terlalu memikirkan omongan orang lain atau media sosial tentang pernikahan ideal',
        cause: 'Sifat sosial yang tinggi membuatnya rentan membandingkan rumah tangganya dengan orang lain.',
        solution: 'Bangun rasa percaya diri keluarga: ingatkan keunikan dan kebahagiaan nyata yang kalian miliki di dunia nyata.',
      },
    ],
    whenAngry: {
      behavior: 'Menangis dramatis, menumpahkan kekecewaan dengan emosional, atau merajuk membutuhkan perhatian penuh.',
      doThis: 'Peluk erat tubuhnya, tenangkan dengan kata-kata manis, dan tunjukkan bahwa kamu sangat peduli padanya.',
      dontDoThis: 'Jangan mencibir perasaannya, jangan meninggalkannya sendirian di ruangan, dan jangan membalas dengan dingin.',
    },
    socialAndInLaws: {
      style: 'Bintang di acara keluarga besar; sangat ramah kepada mertua, pandai memuji masakan, dan disukai anak-anak kecil.',
      advice: 'Dampingi ia agar tidak kelelahan melayani semua orang hingga melupakan waktu istirahat keluarga inti.',
    },
    domesticLifestyle: {
      commStyle: 'Ekspresif, ceria, banyak menggunakan gestur dan bahasa tubuh penuh kasih.',
      financialTendency: 'Sangat royal untuk penampilan, makanan lezat, hadiah, dan kenyamanan keluarga.',
      spaceAndHabit: 'Menyukai rumah yang terang, ceria, penuh warna, dekorasi cantik, dan selalu ada alunan musik.',
    },
  },

  ENFP: {
    nickname: 'Si Penyemangat Kreatif',
    roleName: 'Campaigner (ENFP)',
    roleGroup: 'Diplomats',
    summary: 'Antusias, hangat, dan penuh imajinasi masa depan. Selalu melihat potensi terbaik dalam diri pasangan dan menghidupkan pernikahan dengan cinta yang penuh inspirasi.',
    strengths: [
      'Sangat terbuka, jujur mengekspresikan cinta, dan memotivasi pasangan tumbuh',
      'Kreatif mencari solusi di luar kebiasaan untuk mengatasi kebosanan hubungan',
      'Pendengar yang empatik dan selalu ingin terkoneksi secara mendalam',
      'Membawa energi positif dan optimisme tinggi dalam menghadapi cobaan hidup',
    ],
    watchouts: [
      'Mudah memulai ide baru tetapi kesulitan menuntaskannya hingga selesai',
      'Mudah overthinking saat pasangan sedang lelah atau bersikap dingin',
      'Kerap mengabaikan rutinitas praktis dan detail administratif rumah tangga',
    ],
    feelsLoved: 'Saat pasangannya antusias mendengarkan ide-ide liarnya, memvalidasi perasaannya, dan memberi kebebasan berkreasi.',
    approach: [
      'Bantu memecah ide-ide besarnya menjadi langkah-langkah praktis harian',
      'Beri kepastian cinta saat kamu sedang sibuk agar ia tidak merasa dijauhi',
      'Ajak mencoba hal-hal baru bersama secara berkala untuk menjaga api asmara',
    ],
    maritalFrictions: [
      {
        issue: 'Proyek rumah tangga yang mangkrak di tengah jalan (dekorasi separuh jadi, kursus tidak tuntas)',
        cause: 'Antusiasmenya meledak di awal namun cepat pudar saat harus menghadapi rutinitas teknis yang membosankan.',
        solution: 'Jadilah penuntas (finisher): dukung idenya di awal, lalu sepakati pembagian tugas di mana pasangan membantu mengawasi hingga tuntas.',
      },
      {
        issue: 'Overthinking berlebihan saat pasangan sedang membutuhkan waktu sendiri',
        cause: 'Mengira keheningan pasangan adalah tanda berkurangnya rasa cinta atau adanya kemarahan terpendam.',
        solution: 'Pasangan introvert harus mengomunikasikan dengan jelas: "Aku sayang kamu, tapi energiku habis dan aku butuh 1 jam istirahat ya."',
      },
      {
        issue: 'Keuangan yang tidak stabil karena terlalu banyak mencoba hobi atau kursus baru',
        cause: 'Rasa ingin tahunya yang meluap-luap terhadap berbagai kemungkinan hidup.',
        solution: 'Terapkan aturan masa tunggu 7 hari sebelum mendaftar atau membeli barang terkait minat baru.',
      },
    ],
    whenAngry: {
      behavior: 'Meluapkan kekecewaan dengan kata-kata emosional yang meluas ke berbagai topik masa lalu.',
      doThis: 'Dengarkan dulu curahan perasaannya tanpa menyela, lalu tegaskan kembali komitmen cintamu sebelum membahas logika masalah.',
      dontDoThis: 'Jangan menepis ucapannya sebagai omong kosong, dan jangan meninggalkannya dalam keadaan overthinking sendirian.',
    },
    socialAndInLaws: {
      style: 'Sangat ramah, cepat akrab dengan keluarga mertua, dan disukai karena kehangatan obrolannya.',
      advice: 'Ingatkan batas waktu agar ia tidak terlalu larut mengobrol hingga mengorbankan waktu istirahat bersama.',
    },
    domesticLifestyle: {
      commStyle: 'Hangat, ekspresif, penuh analogi imajinatif, dan suka obrolan mendalam.',
      financialTendency: 'Fleksibel; rela berinvestasi untuk pengalaman, pendidikan anak, perjalanan bersama, dan impian masa depan.',
      spaceAndHabit: 'Menyukai ruang rumah yang fleksibel, penuh papan inspirasi, buku, dan pernak-pernik kenangan perjalanan.',
    },
  },

  ENTP: {
    nickname: 'Si Pendebat Inovatif',
    roleName: 'Debater (ENTP)',
    roleGroup: 'Analysts',
    summary: 'Cerdas, cepat tanggap, dan suka menantang status quo. Membuat pernikahan terasa dinamis, penuh diskusi seru, dan selalu mencari cara cerdas memecahkan persoalan.',
    strengths: [
      'Penyelesai masalah yang sangat cerdas dan cepat melihat jalan keluar alternatif',
      'Humoris, menghibur, dan membuat komunikasi rumah tangga tidak pernah garing',
      'Sangat adaptif terhadap perubahan tak terduga dan tidak mudah panik',
      'Mendorong pasangan untuk berpikir kritis dan mandiri',
    ],
    watchouts: [
      'Bisa berdebat hanya demi menguji argumen hingga melukai perasaan pasangan',
      'Kurang disiplin pada rutinitas domestik yang monoton dan membosankan',
      'Cenderung menunda-nunda pekerjaan administrasi dan tagihan rumah tangga',
    ],
    feelsLoved: 'Saat pasangannya menikmati diskusi dengannya, menghargai pemikirannya yang unik, dan tidak mudah tersinggung oleh gaya bicaranya.',
    approach: [
      'Bedakan dengan jelas kapan waktu untuk berdiskusi ide dan kapan waktu untuk curhat emosional',
      'Tantang pemikirannya secara sehat; ia sangat menghormati pasangan yang berani berargumen',
      'Sepakati pembagian tugas agar urusan rutin harian tetap ada penanggung jawabnya',
    ],
    maritalFrictions: [
      {
        issue: 'Pasangan merasa lelah karena obrolan sepele sering berubah menjadi arena debat kusir',
        cause: 'Kecintaannya pada dialektika logika membuatnya otomatis mencari celah argumen lawan bicara.',
        solution: 'Gunakan kata sandi "Cukup Diskusi": jika pasangan mengucapkannya, ENTP harus segera berhenti berargumen dan beralih ke mode empati.',
      },
      {
        issue: 'Ketidakkonsistenan dalam menaati aturan rumah tangga yang sudah disepakati',
        cause: 'Jiwa bebasnya benci merasa terkekang oleh aturan baku yang dianggapnya bisa dinegosiasikan.',
        solution: 'Libatkan ia dalam merancang aturan rumah tangga, sehingga ia merasa memiliki komitmen logis terhadap aturan tersebut.',
      },
      {
        issue: 'Rencana investasi atau bisnis yang terlalu spekulatif tanpa pengamanan dana darurat',
        cause: 'Terlalu optimis melihat peluang masa depan hingga mengabaikan risiko dasar.',
        solution: 'Tunjuk pasangan sebagai manajer risiko yang memegang kendali atas dana darurat keluarga yang tidak boleh diganggu gugat.',
      },
    ],
    whenAngry: {
      behavior: 'Menyerang dengan argumen logis yang sangat tajam, sarkastik, dan membungkam pasangan dengan kecerdasan bicaranya.',
      doThis: 'Katakan dengan tenang: "Aku tahu kamu pintar berargumen, tapi caramu bicara melukai hatiku. Kita bicara lagi saat kamu bisa lebih lembut."',
      dontDoThis: 'Jangan terbawa emosi berteriak, dan jangan mendebat jika fakta di pihakmu belum lengkap.',
    },
    socialAndInLaws: {
      style: 'Karismatik, cerdas, dan menarik perhatian di acara keluarga; namun bisa memicu ketegangan jika mendebat hal sensitif (agama/politik) dengan mertua.',
      advice: 'Ingatkan sebelum acara keluarga untuk menahan diri dari topik-topik kontroversial demi menjaga keharmonisan dengan orang tua.',
    },
    domesticLifestyle: {
      commStyle: 'Cepat, cerdas, penuh analogi provokatif, dan menyukai candaan intelek.',
      financialTendency: 'Berani mengambil risiko; menyukai peluang bisnis baru dan teknologi mutakhir.',
      spaceAndHabit: 'Sedikit berantakan secara fisik namun teratur dalam pikirannya; butuh ruang yang fleksibel untuk bereksperimen.',
    },
  },

  ESTJ: {
    nickname: 'Si Pengatur Andal',
    roleName: 'Executive (ESTJ)',
    roleGroup: 'Sentinels',
    summary: 'Tegas, disiplin, dan bertanggung jawab penuh. Pemimpin rumah tangga yang memastikan seluruh kebutuhan keluarga terencana dengan baik, aman, dan berjalan sesuai aturan.',
    strengths: [
      'Manajemen rumah tangga, pembagian tugas, dan keuangan yang sangat tertib dan jelas',
      'Sangat dapat diandalkan, konsisten, dan siap menjadi benteng pelindung keluarga',
      'Bekerja keras tanpa mengeluh demi kesejahteraan masa depan anak dan pasangan',
      'Lugas, jujur, dan tidak berbelit-belit dalam menyelesaikan persoalan',
    ],
    watchouts: [
      'Bisa terkesan otoriter, memerintah, dan memaksakan standarnya pada seluruh penghuni rumah',
      'Kurang sabar mendengarkan keluhan emosional yang dianggap tidak ada tindakannya',
      'Kaku terhadap cara orang lain yang berbeda dari standar baku miliknya',
    ],
    feelsLoved: 'Saat pasangannya menghargai kerja kerasnya, mematuhi kesepakatan bersama, dan bekerja sama sebagai tim yang solid.',
    approach: [
      'Ajukan usulan dengan rencana terstruktur dan alasan yang masuk akal',
      'Ingatkan bahwa mendengarkan perasaan adalah bagian dari kepemimpinan keluarga yang baik',
      'Apresiasi pengorbanan dan kepemimpinannya secara terbuka di depan keluarga',
    ],
    maritalFrictions: [
      {
        issue: 'Pasangan dan anak merasa seperti diatur oleh komandan militer di rumah sendiri',
        cause: 'Kebutuhan alaminya untuk mengorganisasi ketidakteraturan membuatnya otomatis mengambil alih kendali dengan nada memerintah.',
        solution: 'Latih gaya komunikasi meminta tolong secara manis daripada langsung memberi instruksi tugas.',
      },
      {
        issue: 'Konflik saat pasangan ingin mencoba cara baru yang belum teruji',
        cause: 'Sangat percaya pada tradisi dan metode terbukti; memandang eksperimen baru sebagai pemborosan risiko.',
        solution: 'Beri ruang uji coba terbatas dengan kesepakatan: jika berhasil kita lanjutkan, jika gagal kita kembali ke cara lama.',
      },
      {
        issue: 'Kemarahan saat jadwal atau target rumah tangga meleset karena hal tak terduga',
        cause: 'Toleransi rendah terhadap ketidakefisienan dan keterlambatan.',
        solution: 'Siapkan ruang toleransi waktu (buffer time) 30 menit di setiap agenda keluarga untuk meredam kekecewaan.',
      },
    ],
    whenAngry: {
      behavior: 'Suara meninggi, nada bicara tegas memerintah, dan langsung memvonis kesalahan secara frontal.',
      doThis: 'Tetap tenang dan tegap; katakan: "Aku menghormatimu, tapi tolong turunkan nada bicaramu agar kita bisa mencari jalan keluar bersama."',
      dontDoThis: 'Jangan membalas dengan bentakan yang menantang egonya, dan jangan lari menghindar dari tanggung jawab.',
    },
    socialAndInLaws: {
      style: 'Sangat dihormati di kalangan keluarga besar karena berwibawa, bertanggung jawab, dan siap membantu urusan keluarga.',
      advice: 'Libatkan ia dalam mengoordinasi acara keluarga besar; kemampuannya mengorganisasi akan bersinar dan menuai pujian.',
    },
    domesticLifestyle: {
      commStyle: 'Tegas, terstruktur, langsung pada instruksi dan solusi tindakan.',
      financialTendency: 'Sangat disiplin; pos anggaran rapi, investasi stabil, dan tidak mentolerir utang konsumtif.',
      spaceAndHabit: 'Menuntut rumah yang tertib, jadwal makan dan tidur yang teratur, serta barang yang selalu kembali ke tempatnya.',
    },
  },

  ESFJ: {
    nickname: 'Si Perekat Keluarga',
    roleName: 'Consul (ESFJ)',
    roleGroup: 'Sentinels',
    summary: 'Ramah, hangat, dan sangat peduli pada keharmonisan. Memastikan rumah tangga selalu dipenuhi cinta, menjalin silaturahmi erat dengan keluarga besar, dan merawat semua orang dengan tulus.',
    strengths: [
      'Sangat hangat, perhatian, dan selalu memastikan kebutuhan pasangan terpenuhi sempurna',
      'Jagoan dalam menjalin hubungan akrab dan penuh kasih dengan mertua dan ipar',
      'Teratur dalam mengelola urusan domestik, hidangan keluarga, dan jadwal anak',
      'Menciptakan tradisi keluarga yang penuh kebersamaan dan kenangan manis',
    ],
    watchouts: [
      'Terlalu memikirkan pandangan orang lain/tetangga/keluarga besar tentang rumah tangganya',
      'Mudah terluka dan merasa tidak dihargai jika kebaikannya tidak dibalas dengan antusias',
      'Suka memaksakan sarannya demi apa yang ia anggap "terbaik untuk pasangan"',
    ],
    feelsLoved: 'Saat pasangannya membalas perhatiannya dengan pelukan hangat, memuji usahanya, dan terlibat aktif dalam kegiatan keluarga besar.',
    approach: [
      'Ucapkan terima kasih dan pujian tulus setiap kali ia menyiapkan sesuatu untukmu',
      'Bahas batasan privasi keluarga besar dengan sangat hati-hati tanpa terkesan menolak keluarganya',
      'Pastikan ia juga meluangkan waktu merawat dirinya sendiri (self-care)',
    ],
    maritalFrictions: [
      {
        issue: 'Tekanan sosial dan pengeluaran berlebih demi menjaga gengsi di mata keluarga besar/teman',
        cause: 'Sangat menjunjung tinggi penerimaan sosial dan takut dinilai kurang mampu atau kurang pantas.',
        solution: 'Sepakati batas anggaran sosial/hadiah bersama dan tegaskan bahwa kebahagiaan internal rumah tangga jauh lebih utama daripada opini luar.',
      },
      {
        issue: 'Pasangan merasa privasi rumah tangganya terlalu banyak diceritakan ke orang tua/sahabat',
        cause: 'Karakter ekstrovert sosial yang terbiasa berbagi cerita dengan orang-orang terdekatnya.',
        solution: 'Tetapkan batas sakral: masalah keuangan internal dan pertengkaran kamar tidur tidak boleh diceritakan ke pihak luar mana pun.',
      },
      {
        issue: 'Merajuk lelah karena merasa selalu dirinya yang berkorban mengurus segalanya',
        cause: 'Standar pelayanannya sangat tinggi dan ia mengharapkan pasangan bisa membaca kebutuhannya tanpa perlu diminta.',
        solution: 'Dorong ia meminta bantuan secara verbal: "Sayang, tolong bantu cuci piring ya", bukan menunggu pasangan peka sendiri.',
      },
    ],
    whenAngry: {
      behavior: 'Menangis tersedu sambil mengungkit seluruh pengorbanan yang telah ia berikan untuk pasangan.',
      doThis: 'Rangkul erat pundaknya, dengarkan keluhannya, dan berikan afirmasi tulus atas seluruh kerja keras dan cintanya.',
      dontDoThis: 'Jangan menuduhnya "pamrih", dan jangan menyepelekan acara keluarga besar yang ia anggap penting.',
    },
    socialAndInLaws: {
      style: 'Menantu idaman; sangat luwes melayani mertua, rajin silaturahmi, dan selalu mengingat ulang tahun kerabat.',
      advice: 'Pasangan harus menjaga agar ESFJ tidak kelelahan fisik dan batin karena terlalu sibuk menyenangkan semua pihak keluarga.',
    },
    domesticLifestyle: {
      commStyle: 'Hangat, santun, ekspresif, dan berorientasi pada keharmonisan hubungan.',
      financialTendency: 'Tertib mengelola belanja dapur dan kebutuhan keluarga, namun perlu rem untuk belanja bingkisan/hadiah sosial.',
      spaceAndHabit: 'Rumah adalah tempat menyambut tamu; selalu bersih, wangi, rapi, dan siap menerima kunjungan keluarga.',
    },
  },

  ENFJ: {
    nickname: 'Si Pembimbing Hangat',
    roleName: 'Protagonist (ENFJ)',
    roleGroup: 'Diplomats',
    summary: 'Karismatik, penuh empati, dan menginspirasi. Berdedikasi mendalam untuk membawa pasangannya bertumbuh, saling menguatkan, dan membangun keluarga yang berdampak positif bagi sesama.',
    strengths: [
      'Komunikator cinta yang luar biasa hangat, peka, dan mampu membakar semangat pasangan',
      'Mampu menyelesaikan perselisihan keluarga dengan kebijaksanaan dan empati tinggi',
      'Sangat setia, visioner, dan menempatkan kebahagiaan pasangan sebagai prioritas hidup',
      'Membangun budaya keluarga yang penuh nilai kebajikan dan saling menghormati',
    ],
    watchouts: [
      'Bisa terlalu mendikte atau mengarahkan pasangan dengan dalih "demi kebaikanmu sendiri"',
      'Mudah kelelahan batin karena selalu memikirkan masalah orang lain di atas kebutuhan pribadinya',
      'Sangat sensitif terhadap kritik yang mempertanyakan ketulusan niat baiknya',
    ],
    feelsLoved: 'Saat pasangannya terbuka mencurahkan isi hati, bertumbuh bersama, dan membalas kepeduliannya dengan cinta yang setara.',
    approach: [
      'Apresiasi niat baik dan visinya terlebih dahulu sebelum menyampaikan batasan pribadimu',
      'Gantian merawat dan memanjakan dirinya; ia terbiasa merawat orang lain tapi lupa merawat diri',
      'Libatkan ia dalam impian-impian terbesarmu, ia akan menjadi pendukung nomor satumu',
    ],
    maritalFrictions: [
      {
        issue: 'Pasangan merasa seperti murid yang sedang dibimbing daripada pasangan yang setara',
        cause: 'Karakter alaminya sebagai mentor dan motivator membuatnya otomatis ingin memperbaiki kebiasaan pasangan.',
        solution: 'Ingatkan dengan hangat: "Aku mencintaimu sebagai suamiku/istriku, bukan sebagai guruku. Terimalah aku apa adanya."',
      },
      {
        issue: 'Rumah tangga terseret masalah keluarga besar atau teman yang dibantu secara berlebihan',
        cause: 'Empatinya yang sangat luas membuatnya sulit menolak orang lain yang datang meminta pertolongan.',
        solution: 'Sepakati batas waktu dan batas finansial untuk membantu orang lain; prioritaskan stabilitas keluarga inti terlebih dahulu.',
      },
      {
        issue: 'Kelelahan emosional tersembunyi karena merasa harus selalu tampil kuat dan bijaksana',
        cause: 'Takut mengecewakan pasangan jika menunjukkan sisi rapuh atau emosi negatifnya.',
        solution: 'Ciptakan ruang di mana ENFJ boleh menangis, mengeluh, dan bersikap tidak berdaya tanpa takut kehilangan rasa hormat dari pasangan.',
      },
    ],
    whenAngry: {
      behavior: 'Berbicara dengan nada sedih yang mendalam, penuh kekecewaan moral, atau menumpahkan beban berat yang selama ini ia pikul sendiri.',
      doThis: 'Dengarkan dengan penuh perhatian, tatap matanya, akui kesalahannya, dan peluk erat tubuhnya.',
      dontDoThis: 'Jangan menuduhnya "mengatur-atur hidup orang", dan jangan bersikap dingin meremehkan kepeduliannya.',
    },
    socialAndInLaws: {
      style: 'Sangat dihormati dan disegani di lingkungan keluarga besar karena bijak, mengayomi, dan karismatik.',
      advice: 'Jadikan ia juru bicara saat keluarga menghadapi masalah besar yang butuh penengah yang adil dan berwibawa.',
    },
    domesticLifestyle: {
      commStyle: 'Inspiratif, hangat, artikulatif, dan selalu memotivasi kebaikan.',
      financialTendency: 'Terencana dengan baik untuk masa depan keluarga, namun perlu pengawasan pada pengeluaran donasi/membantu orang lain.',
      spaceAndHabit: 'Rumah yang harmonis, penuh buku pengembangan diri, ruang berkumpul keluarga yang nyaman dan menyatu.',
    },
  },

  ENTJ: {
    nickname: 'Si Pemimpin Visioner',
    roleName: 'Commander (ENTJ)',
    roleGroup: 'Analysts',
    summary: 'Tegas, strategis, dan berorientasi pada pencapaian masa depan. Membangun fondasi rumah tangga dengan kepemimpinan yang tangguh, efisiensi tinggi, dan visi kemakmuran yang jelas.',
    strengths: [
      'Kepemimpinan finansial dan arah masa depan keluarga yang sangat kokoh dan visioner',
      'Tidak pernah gentar menghadapi rintangan berat hidup dan sangat cepat mencari solusi',
      'Mendorong seluruh anggota keluarga untuk menjadi versi terbaik dari diri mereka',
      'Jujur, percaya diri, adil, dan memegang teguh kata-katanya',
    ],
    watchouts: [
      'Bisa mendominasi keputusan rumah tangga dan tidak sabar pada keraguan pasangan',
      'Terdengar dingin, menuntut, atau memperlakukan pernikahan seperti menjalankan perusahaan',
      'Kurang sabar menghadapi proses emosi pasangan yang membutuhkan waktu tenang',
    ],
    feelsLoved: 'Saat pasangannya menjadi mitra strategis yang setara, percaya pada visinya, dan menghargai kepemimpinannya dalam melindungi keluarga.',
    approach: [
      'Sampaikan pendapatmu dengan tegas dan percaya diri; ia sangat menghormati keberanian pasangannya',
      'Tentukan sejak awal keputusan-keputusan mana yang wajib dimusyawarahkan berdua tanpa veto sepihak',
      'Ingatkan ia untuk sesekali berhenti bekerja, melepas beban kepemimpinan, dan menikmati kemesraan santai',
    ],
    maritalFrictions: [
      {
        issue: 'Dominasi sepihak dalam keputusan besar (pembelian rumah, sekolah anak, investasi)',
        cause: 'Keyakinan dirinya yang sangat tinggi bahwa analisanya adalah yang paling objektif dan menguntungkan keluarga.',
        solution: 'Terapkan aturan "Dua Kunci": keputusan besar keluarga hanya boleh dieksekusi jika kedua belah pihak sama-sama menyetujui tanpa paksaan.',
      },
      {
        issue: 'Pasangan merasa dinilai berdasarkan kinerja (KPI) daripada dicintai tanpa syarat',
        cause: 'Kecenderungannya mengukur segala hal berdasarkan hasil nyata dan produktivitas.',
        solution: 'Ingatkan bahwa pernikahan adalah tempat berlabuh tanpa tuntutan performa: ciptakan waktu santai tanpa agenda produktif.',
      },
      {
        issue: 'Ledakan ketidaksabaran saat pasangan melakukan kesalahan teknis sepele',
        cause: 'Toleransi yang sangat rendah terhadap ketidakefisienan atau kelambanan tindakan.',
        solution: 'Latih pernapasan dan jeda 5 detik sebelum berbicara saat mendapati kesalahan kecil di rumah.',
      },
    ],
    whenAngry: {
      behavior: 'Suara menggelegar tegas, mata menatap tajam, dan membedah kelemahan lawan bicara dengan argumen tanpa ampun.',
      doThis: 'Tatap matanya dengan tenang, jangan mundur ketakutan, dan katakan dengan nada mantap: "Bicaralah dengan tenang dan setara, jangan membentakku."',
      dontDoThis: 'Jangan menangis histeris tanpa bicara, dan jangan membalas dengan manipulasi pasif-agresif.',
    },
    socialAndInLaws: {
      style: 'Sangat berwibawa di hadapan mertua dan keluarga besar; disegani karena sukses dan mampu menjadi pelindung keluarga.',
      advice: 'Pastikan ia tetap bersikap rendah hati dan menghormati para tetua adat di keluarga besar.',
    },
    domesticLifestyle: {
      commStyle: 'Tegas, langsung pada poin utama, analitis, dan berorientasi hasil.',
      financialTendency: 'Sangat visioner; fokus pada diversifikasi aset, bisnis keluarga, dan proteksi kekayaan jangka panjang.',
      spaceAndHabit: 'Menuntut rumah yang tertata modern, efisien, serba otomatis, dan memiliki ruang kerja pribadi kelas eksekutif.',
    },
  },
}

export type DimensionInsight = { title: string; text: string; tip: string }

/** Wawasan per dimensi untuk sepasang tipe: sama-sama X, sama-sama Y, atau berbeda. */
const PAIR_INSIGHTS: Record<Dimension, { first: DimensionInsight; second: DimensionInsight; diff: DimensionInsight }> = {
  EI: {
    first: {
      title: 'Sama-sama Ekstrovert (E & E)',
      text: 'Kalian sama-sama berenergi dari interaksi sosial dan kegiatan luar. Rumah tangga kalian kemungkinan besar ramai teman, kerabat, dan agenda akhir pekan.',
      tip: 'Waspadai kelelahan sosial bersama: sengaja jadwalkan "Kencan Tanpa Orang Luar" setiap bulan agar keintiman batin berdua tetap terjaga mendalam.',
    },
    second: {
      title: 'Sama-sama Introvert (I & I)',
      text: 'Kalian sama-sama menghargai ketenangan, privasi, dan waktu santai di rumah. Rumah kalian adalah suaka yang damai dan obrolan berdua bisa sangat intim.',
      tip: 'Waspadai isolasi sosial: sepakati pembagian tugas saat harus menghadiri acara keluarga besar atau silaturahmi mertua agar tidak canggung bersama.',
    },
    diff: {
      title: 'Kombinasi Ekstrovert & Introvert (E & I)',
      text: 'Satu mengisi energi dari keramaian dan bicara langsung, satu butuh keheningan untuk memproses isi kepala. Ini kombinasi yang saling menyeimbangkan jika dipahami.',
      tip: 'Hormati "Baterai Sosial": izinkan pasangan introvert pulang lebih awal atau beristirahat di kamar tanpa rasa bersalah, sementara pasangan ekstrovert tetap bebas bersosialisasi.',
    },
  },
  SN: {
    first: {
      title: 'Sama-sama Pengamat Praktis (S & S)',
      text: 'Kalian sama-sama realistis, berpijak pada fakta riil, dan mudah sepakat soal urusan logistik, anggaran belanja, serta rutinitas konkret harian.',
      tip: 'Waspadai kejenuhan rutinitas: sesekali luangkan waktu untuk berani bermimpi hal baru dan mencoba pengalaman di luar kebiasaan yang lazim.',
    },
    second: {
      title: 'Sama-sama Intuitif Visioner (N & N)',
      text: 'Kalian senang bertukar ide besar, membayangkan masa depan, dan mendiskusikan filosofi hidup. Hubungan terasa kaya imajinasi dan inspiratif.',
      tip: 'Waspadai detail yang tercecer: tunjuk penanggung jawab pasti untuk urusan teknis seperti pembayaran tagihan rutin, dokumen legal, dan anggaran belanja nyata.',
    },
    diff: {
      title: 'Kombinasi Praktis & Visioner (S & N)',
      text: 'Satu melihat detail nyata hari ini (fakta & biaya), satu melihat gambaran besar esok hari (ide & potensi). Ini adalah kekuatan tim yang sangat lengkap.',
      tip: 'Sinergikan peran: biarkan pasangan Intuitif (N) merancang visi masa depan keluarga, lalu biarkan pasangan Praktis (S) menerjemahkannya menjadi langkah-langkah anggaran konkret.',
    },
  },
  TF: {
    first: {
      title: 'Sama-sama Pemikir Logis (T & T)',
      text: 'Diskusi kalian cenderung objektif, rasional, dan cepat mencari solusi teknis. Kalian jarang terseret dalam drama emosi yang berkepanjangan.',
      tip: 'Jangan lupa rawat kehangatan hati: biasakan mengungkapkan kata-kata sayang dan pelukan hangat, bukan hanya membicarakan urusan fungsional rumah tangga.',
    },
    second: {
      title: 'Sama-sama Perasa Peka (F & F)',
      text: 'Kalian saling menjaga perasaan, sangat berempati, dan rumah tangga dipenuhi kelembutan serta kasih sayang yang diekspresikan secara tulus.',
      tip: 'Waspadai menghindari konflik: jangan menumpuk masalah di bawah karpet demi menjaga damai semu; selesaikan masalah faktual dengan jujur dan berani.',
    },
    diff: {
      title: 'Kombinasi Logika & Empati (T & F)',
      text: 'Satu nalurinya langsung menganalisis solusi, satu ingin dipahami dan divalidasi perasaannya dulu. Ini adalah sumber salah paham paling klasik dalam pernikahan.',
      tip: 'Gunakan pertanyaan emas: "Sayang, saat ini kamu sedang butuh didengarkan dan dipeluk, atau butuh kubantu carikan solusi logis?"',
    },
  },
  JP: {
    first: {
      title: 'Sama-sama Terencana (J & J)',
      text: 'Kalian sama-sama menyukai kepastian, jadwal yang tertib, dan keteraturan hidup. Rumah tangga kalian akan sangat terorganisasi dan minim drama mendadak.',
      tip: 'Siapkan ruang kelonggaran: hidup bersama tidak selalu bisa diprediksi; jangan saling menyalahkan saat ada rencana matang yang meleset karena hal di luar kendali.',
    },
    second: {
      title: 'Sama-sama Fleksibel (P & P)',
      text: 'Kalian santai, mudah beradaptasi, dan tidak kaku dengan aturan. Hidup berdua terasa menyenangkan, bebas stres, dan penuh kejutan spontan.',
      tip: 'Gunakan pengingat tenggat otomatis: pastikan urusan tagihan penting, dokumen anak, dan komitmen waktu tidak saling tertunda hingga menumpuk di ujung waktu.',
    },
    diff: {
      title: 'Kombinasi Terencana & Fleksibel (J & P)',
      text: 'Satu ingin semuanya pasti dan terjadwal sejak awal, satu nyaman memutuskan di jalan dan santai dengan perubahan. Keduanya saling menyelamatkan.',
      tip: 'Bagi batasan: sepakati hal-hal yang "Wajib Terjadwal Kaku" (pos dana darurat, tiket perjalanan, komitmen kerja) dan hal-hal yang "Boleh Fleksibel Bebas" (agenda santai liburan).',
    },
  },
}

export function pairInsights(a: TypeCode, b: TypeCode): (DimensionInsight & { dimension: Dimension; same: boolean })[] {
  return DIMENSIONS.map((dim, i) => {
    const la = a[i] as Letter
    const lb = b[i] as Letter
    const set = PAIR_INSIGHTS[dim]
    const insight = la !== lb ? set.diff : la === FIRST[dim] ? set.first : set.second
    return { ...insight, dimension: dim, same: la === lb }
  })
}

export function isTypeCode(value: unknown): value is TypeCode {
  return typeof value === 'string' && /^[EI][SN][TF][JP]$/.test(value)
}
