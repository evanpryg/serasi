import type { Task, ChecklistEventKey, TaskPriority, TaskStatus } from './database.types'
import type { CategoryGroup, EventSummary, OverallSummary } from './checklistTypes'
import { CHECKLIST_EVENTS } from './checklistTypes'
import { daysBetween, parseDateOnly, toDateOnly } from './format'

export type TemplateTaskDef = {
  template_key: string
  event: ChecklistEventKey
  category: string
  subcategory?: string
  title: string
  notes?: string
  priority: TaskPriority
  status: TaskStatus
  offset_days: number // relatif terhadap wedding_date (misal: -180 = 6 bulan sebelum)
  estimated_cost?: number | null
  actual_cost?: number | null
  quantity?: number | null
  unit?: string
  product_url?: string
  vendor_store_name?: string
  item_status?: string
}

export const INITIAL_CHECKLIST_TEMPLATES: TemplateTaskDef[] = [
  // =========================================================================
  // A. PERSIAPAN LAMARAN
  // =========================================================================
  {
    template_key: 'lamaran_planning_date',
    event: 'lamaran',
    category: 'Perencanaan Acara',
    subcategory: 'Jadwal & Panitia',
    title: 'Menentukan tanggal & tempat acara lamaran',
    notes: 'Disepakati oleh kedua keluarga besar (di rumah calon pengantin wanita / venue luar).',
    priority: 'high',
    status: 'done',
    offset_days: -150,
  },
  {
    template_key: 'lamaran_planning_theme',
    event: 'lamaran',
    category: 'Perencanaan Acara',
    subcategory: 'Jadwal & Panitia',
    title: 'Menentukan tema warna busana & dekorasi lamaran',
    notes: 'Misal: Earthy pastel, sage green, navy champagne.',
    priority: 'medium',
    status: 'done',
    offset_days: -140,
  },
  {
    template_key: 'lamaran_family_meeting',
    event: 'lamaran',
    category: 'Pertemuan Keluarga',
    subcategory: 'Koordinasi',
    title: 'Menghitung jumlah rombongan keluarga yang hadir',
    notes: 'Keluarga inti pria & wanita untuk estimasi tempat duduk dan konsumsi.',
    priority: 'high',
    status: 'done',
    offset_days: -130,
  },
  {
    template_key: 'lamaran_attire_groom',
    event: 'lamaran',
    category: 'Busana Calon Pengantin',
    subcategory: 'Pria',
    title: 'Kemeja batik sutra / tenun calon mempelai pria',
    notes: 'Motif senada dengan kain calon mempelai wanita.',
    priority: 'medium',
    status: 'done',
    offset_days: -120,
    estimated_cost: 650000,
    actual_cost: 600000,
    quantity: 1,
    unit: 'potong',
    vendor_store_name: 'Batik Danar Hadi',
    item_status: 'sudah_dibeli',
  },
  {
    template_key: 'lamaran_attire_bride',
    event: 'lamaran',
    category: 'Busana Calon Pengantin',
    subcategory: 'Wanita',
    title: 'Kebaya modern / dress lamaran calon mempelai wanita',
    notes: 'Warna senada dengan tema lamaran.',
    priority: 'high',
    status: 'done',
    offset_days: -120,
    estimated_cost: 1200000,
    actual_cost: 1100000,
    quantity: 1,
    unit: 'set',
    vendor_store_name: 'Butik Kebaya Lokal',
    item_status: 'sudah_dibeli',
  },
  {
    template_key: 'lamaran_rings',
    event: 'lamaran',
    category: 'Cincin & Simbolis',
    subcategory: 'Tanda Ikatan',
    title: 'Cincin tunangan & kotak cincin estetik',
    notes: 'Simbol pengikat pertunangan kedua calon mempelai.',
    priority: 'high',
    status: 'done',
    offset_days: -110,
    estimated_cost: 4500000,
    actual_cost: 4300000,
    quantity: 1,
    unit: 'pasang',
    vendor_store_name: 'Frank & co. / Toko Emas Lokal',
    item_status: 'sudah_dibeli',
  },
  // Seserahan Lamaran
  {
    template_key: 'lamaran_seserahan_skincare',
    event: 'lamaran',
    category: 'Seserahan Lamaran',
    subcategory: 'Perawatan Diri',
    title: 'Set skincare & body care favorit calon pengantin',
    notes: 'Pembersih wajah, toner, serum, moisturizer, sunscreen & body lotion.',
    priority: 'medium',
    status: 'in_progress',
    offset_days: -90,
    estimated_cost: 850000,
    actual_cost: null,
    quantity: 1,
    unit: 'paket',
    product_url: 'https://shopee.co.id',
    vendor_store_name: 'Official Store Skincare',
    item_status: 'sudah_dipilih',
  },
  {
    template_key: 'lamaran_seserahan_makeup',
    event: 'lamaran',
    category: 'Seserahan Lamaran',
    subcategory: 'Perawatan Diri',
    title: 'Set makeup / kosmetik lengkap',
    notes: 'Lipstik, cushion, palette eyeshadow, bedak.',
    priority: 'medium',
    status: 'todo',
    offset_days: -85,
    estimated_cost: 750000,
    actual_cost: null,
    quantity: 1,
    unit: 'set',
    product_url: 'https://tokopedia.com',
    vendor_store_name: 'Sephora / Sociolla',
    item_status: 'belum_dicari',
  },
  {
    template_key: 'lamaran_seserahan_bag',
    event: 'lamaran',
    category: 'Seserahan Lamaran',
    subcategory: 'Aksesoris & Fashion',
    title: 'Tas pesta / handbag formal wanita',
    notes: 'Warna netral (nude / hitam / cokelat) untuk pesta & kerja.',
    priority: 'medium',
    status: 'done',
    offset_days: -95,
    estimated_cost: 650000,
    actual_cost: 580000,
    quantity: 1,
    unit: 'buah',
    product_url: 'https://zalora.co.id',
    vendor_store_name: 'Charles & Keith Official',
    item_status: 'sudah_dibeli',
  },
  {
    template_key: 'lamaran_seserahan_shoes',
    event: 'lamaran',
    category: 'Seserahan Lamaran',
    subcategory: 'Aksesoris & Fashion',
    title: 'Sepatu heels calon mempelai wanita',
    notes: 'Ukuran disesuaikan dengan kenyamanan kaki pengantin.',
    priority: 'medium',
    status: 'in_progress',
    offset_days: -90,
    estimated_cost: 550000,
    actual_cost: null,
    quantity: 1,
    unit: 'pasang',
    product_url: 'https://tokopedia.com',
    vendor_store_name: 'Zaxy / Melissa Store',
    item_status: 'sudah_dipilih',
  },
  {
    template_key: 'lamaran_seserahan_prayer',
    event: 'lamaran',
    category: 'Seserahan Lamaran',
    subcategory: 'Perlengkapan Ibadah',
    title: 'Set mukena sutra premium, sajadah & Al-Quran terjemah',
    notes: 'Simbol kesiapan membangun rumah tangga yang taat.',
    priority: 'high',
    status: 'done',
    offset_days: -100,
    estimated_cost: 800000,
    actual_cost: 750000,
    quantity: 1,
    unit: 'set',
    vendor_store_name: 'Toko Perlengkapan Muslim',
    item_status: 'sudah_dibeli',
  },
  {
    template_key: 'lamaran_seserahan_box',
    event: 'lamaran',
    category: 'Seserahan Lamaran',
    subcategory: 'Kemasan & Dekorasi',
    title: 'Jasa hias kotak seserahan akrilik transparan (6 kotak)',
    notes: 'Dekorasi bunga artifisial & pita senada tema.',
    priority: 'medium',
    status: 'in_progress',
    offset_days: -75,
    estimated_cost: 900000,
    actual_cost: 900000,
    quantity: 6,
    unit: 'kotak',
    vendor_store_name: 'Sanggar Hias Seserahan',
    item_status: 'sudah_dipesan',
  },
  // Konsumsi Lamaran
  {
    template_key: 'lamaran_food_menu',
    event: 'lamaran',
    category: 'Konsumsi',
    subcategory: 'Menu Makanan',
    title: 'Menentukan menu prasmanan / nasi box untuk 50 tamu lamaran',
    notes: 'Menu ramah keluarga: nasi gurih, sup hangat, ayam bumbu, sayuran, dan sambal.',
    priority: 'high',
    status: 'done',
    offset_days: -70,
    estimated_cost: 3500000,
    actual_cost: 3500000,
    quantity: 50,
    unit: 'pax',
    vendor_store_name: 'Katering Rumahan Terpercaya',
    item_status: 'sudah_dipesan',
  },
  {
    template_key: 'lamaran_decor_backdrop',
    event: 'lamaran',
    category: 'Dekorasi',
    subcategory: 'Backdrop',
    title: 'Backdrop lamaran minimalis & welcome sign akrilik',
    notes: 'Ukuran 2.5 x 2.5m dengan nama calon kedua mempelai.',
    priority: 'medium',
    status: 'done',
    offset_days: -60,
    estimated_cost: 1500000,
    actual_cost: 1400000,
    quantity: 1,
    unit: 'set',
    vendor_store_name: 'Dekor Lamaran Studio',
    item_status: 'sudah_dipesan',
  },
  {
    template_key: 'lamaran_photo_doc',
    event: 'lamaran',
    category: 'Dokumentasi',
    subcategory: 'Foto & Video',
    title: 'Fotografer dokumentasi momen lamaran & foto keluarga',
    notes: 'Liputan 3 jam selama prosesi lamaran berlangsung.',
    priority: 'medium',
    status: 'done',
    offset_days: -60,
    estimated_cost: 1200000,
    actual_cost: 1000000,
    quantity: 1,
    unit: 'layanan',
    vendor_store_name: 'Fotografer Lamaran Rekanan',
    item_status: 'sudah_dipesan',
  },

  // =========================================================================
  // B. PERSIAPAN PERNIKAHAN
  // =========================================================================
  {
    template_key: 'nikah_venue_booking',
    event: 'pernikahan',
    category: 'Venue & Gedung',
    subcategory: 'Lokasi Acara',
    title: 'Booking tanggal & kunci venue akad / resepsi',
    notes: 'Survei kapasitas listrik, AC, ruang rias pengantin & kantong parkir.',
    priority: 'high',
    status: 'done',
    offset_days: -180,
  },
  {
    template_key: 'nikah_catering_test',
    event: 'pernikahan',
    category: 'Catering',
    subcategory: 'Menu Prasmanan & Gubukan',
    title: 'Food tasting & finalisasi menu katering utama',
    notes: 'Hitung rasio porsi: 2x total undangan (1 porsi prasmanan + 4 porsi gubukan per tamu).',
    priority: 'high',
    status: 'in_progress',
    offset_days: -90,
  },
  {
    template_key: 'nikah_decor_concept',
    event: 'pernikahan',
    category: 'Dekorasi',
    subcategory: 'Pelaminan',
    title: 'Persetujuan sketsa dekorasi pelaminan, lorong jalan, & photobooth',
    notes: 'Pastikan tata letak panggung musik, meja penerima tamu, dan lorong kirab lapang.',
    priority: 'high',
    status: 'in_progress',
    offset_days: -75,
  },
  {
    template_key: 'nikah_attire_fitting1',
    event: 'pernikahan',
    category: 'Busana Pengantin',
    subcategory: 'Fitting',
    title: 'Fitting busana akad & resepsi pengantin pria & wanita',
    notes: 'Jadwalkan fitting pertama untuk penyesuaian lingkar pinggang, lengan & panjang gaun/beskap.',
    priority: 'high',
    status: 'in_progress',
    offset_days: -45,
  },
  {
    template_key: 'nikah_mua_test',
    event: 'pernikahan',
    category: 'Makeup Artist (MUA)',
    subcategory: 'Rias Pengantin',
    title: 'Tes rias wajah / trial makeup bersama MUA pilihan',
    notes: 'Uji ketahanan foundation, warna lipstik, dan gaya sanggul / hijab.',
    priority: 'medium',
    status: 'todo',
    offset_days: -40,
  },
  {
    template_key: 'nikah_photo_briefing',
    event: 'pernikahan',
    category: 'Dokumentasi Foto & Video',
    subcategory: 'Briefing',
    title: 'Briefing shot list foto & video bersama tim dokumentasi',
    notes: 'Sampaikan daftar momen penting (candid orang tua, ekspresi akad, foto VIP, detail cincin).',
    priority: 'medium',
    status: 'todo',
    offset_days: -30,
  },
  {
    template_key: 'nikah_invitation_print',
    event: 'pernikahan',
    category: 'Undangan',
    subcategory: 'Cetak & Digital',
    title: 'Distribusi undangan fisik VIP & sebar link undangan digital',
    notes: 'Undangan luar kota dikirim H-30 agar tamu sempat mengatur transportasi & akomodasi.',
    priority: 'high',
    status: 'todo',
    offset_days: -30,
  },
  {
    template_key: 'nikah_mahar_rings',
    event: 'pernikahan',
    category: 'Mahar & Cincin',
    subcategory: 'Simbol Akad',
    title: 'Penyusunan frame hias mahar & pembersihan cincin kawin',
    notes: 'Pastikan nominal atau gramasi emas sesuai akad tanpa merusak keutuhan uang asli.',
    priority: 'high',
    status: 'in_progress',
    offset_days: -25,
  },
  {
    template_key: 'nikah_mc_rundown',
    event: 'pernikahan',
    category: 'Hiburan & MC',
    subcategory: 'Koordinasi Panggung',
    title: 'Sinkronisasi rundown dan pelafalan gelar nama bersama MC',
    notes: 'Sertakan daftar nama saksi, orang tua, dan susunan kata sambutan keluarga.',
    priority: 'medium',
    status: 'todo',
    offset_days: -20,
  },
  {
    template_key: 'nikah_souvenir_qc',
    event: 'pernikahan',
    category: 'Souvenir',
    subcategory: 'Pengecekan',
    title: 'Pengecekan jumlah souvenir & tempel ucapan terima kasih',
    notes: 'Pastikan jumlah souvenir mencukupi total estimasi undangan + 10% cadangan.',
    priority: 'medium',
    status: 'todo',
    offset_days: -15,
  },
  {
    template_key: 'nikah_vendor_tm',
    event: 'pernikahan',
    category: 'Koordinasi Vendor',
    subcategory: 'Technical Meeting',
    title: 'Technical meeting gabungan seluruh vendor di venue acara',
    notes: 'Dihadiri WO, katering, dekorasi, sound system, fotografer, dan pihak venue.',
    priority: 'high',
    status: 'todo',
    offset_days: -10,
  },

  // =========================================================================
  // C. ACARA ADAT DAN TRADISI (Opsional)
  // =========================================================================
  {
    template_key: 'adat_slametan_tumpeng',
    event: 'adat',
    category: 'Slametan / Syukuran Pra-Nikah',
    subcategory: 'Hidangan & Doa',
    title: 'Pemesanan tumpeng robyong & nasi kotak syukuran keluarga',
    notes: 'Untuk syukuran memohon kelancaran doa bersama tetangga & keluarga terdekat.',
    priority: 'medium',
    status: 'todo',
    offset_days: -14,
    estimated_cost: 1500000,
    actual_cost: null,
    quantity: 1,
    unit: 'paket tumpeng',
    vendor_store_name: 'Dapur Nasi Kuning Tradisional',
  },
  {
    template_key: 'adat_pengajian_souvenir',
    event: 'adat',
    category: 'Pengajian Pra-Nikah',
    subcategory: 'Perlengkapan',
    title: 'Cetak buku doa / surat Al-Matsurat & souvenir pengajian',
    notes: 'Desain cover dengan nama kedua mempelai.',
    priority: 'medium',
    status: 'in_progress',
    offset_days: -10,
    estimated_cost: 750000,
    actual_cost: null,
    quantity: 50,
    unit: 'buku',
    product_url: 'https://tokopedia.com',
    vendor_store_name: 'Percetakan Buku Pengajian',
    item_status: 'sudah_dipesan',
  },
  {
    template_key: 'adat_siraman_flowers',
    event: 'adat',
    category: 'Siraman / Ngebakan',
    subcategory: 'Perlengkapan Adat',
    title: 'Penyediaan bunga 7 rupa wangi & ronce melati penutup dada',
    notes: 'Bunga segar diambil H-1 malam agar wangi dan segar saat prosesi.',
    priority: 'high',
    status: 'todo',
    offset_days: -3,
    estimated_cost: 600000,
    actual_cost: null,
    quantity: 1,
    unit: 'set melati',
    vendor_store_name: 'Pasar Bunga Rawa Belong / Wastukencana',
  },
  {
    template_key: 'adat_siraman_water',
    event: 'adat',
    category: 'Siraman / Ngebakan',
    subcategory: 'Air Suci',
    title: 'Pengumpulan air dari 7 sumber mata air & gentong siraman',
    notes: 'Gentong tanah liat dan gayung batok kelapa berhias bunga.',
    priority: 'medium',
    status: 'todo',
    offset_days: -2,
  },
  {
    template_key: 'adat_midodareni_kembar',
    event: 'adat',
    category: 'Midodareni / Malam Bainai',
    subcategory: 'Simbol',
    title: 'Sepasang kembar mayang & hidangan malam menjelang akad',
    notes: 'Penyambutan calon mempelai pria untuk perkenalan santai malam H-1.',
    priority: 'medium',
    status: 'todo',
    offset_days: -1,
  },
  {
    template_key: 'adat_panggih_equipment',
    event: 'adat',
    category: 'Temu Manten / Saweran Sunda',
    subcategory: 'Prosesi Hari H',
    title: 'Perlengkapan balangan sirih, beras kuning, koin sawer & ayam bakakak',
    notes: 'Diserahkan kepada pemandu adat / MC adat sebelum prosesi dimulai.',
    priority: 'high',
    status: 'todo',
    offset_days: 0,
  },

  // =========================================================================
  // D. BERKAS DAN LEGALITAS PERNIKAHAN
  // =========================================================================
  {
    template_key: 'legal_ktp_kk_akta',
    event: 'legalitas',
    category: 'Dokumen KUA Muslim (Standar)',
    subcategory: 'Identitas Diri',
    title: 'Fotokopi KTP, Kartu Keluarga, Akta Kelahiran & Ijazah (3 rangkap)',
    notes: 'Dokumen dasar identitas kedua calon pengantin untuk verifikasi NIK di KUA.',
    priority: 'high',
    status: 'done',
    offset_days: -90,
  },
  {
    template_key: 'legal_pas_foto_biru',
    event: 'legalitas',
    category: 'Dokumen KUA Muslim (Standar)',
    subcategory: 'Foto Formal',
    title: 'Pas foto background biru ukuran 2x3 (4 lbr) dan 4x6 (2 lbr)',
    notes: 'Pakaian kemeja putih berkerah rapi (wanita berjilbab sopan) untuk Buku Nikah resmi.',
    priority: 'high',
    status: 'done',
    offset_days: -75,
    estimated_cost: 50000,
    actual_cost: 50000,
    quantity: 6,
    unit: 'lembar',
    vendor_store_name: 'Studio Foto Terdekat',
    item_status: 'sudah_dibeli',
  },
  {
    template_key: 'legal_surat_rt_kelurahan',
    event: 'legalitas',
    category: 'Dokumen KUA Muslim (Standar)',
    subcategory: 'Pengantar Kelurahan',
    title: 'Surat Pengantar RT/RW & Formulir Kelurahan (Model N1, N2, N4)',
    notes: 'Surat keterangan status belum pernah menikah dan persetujuan calon mempelai.',
    priority: 'high',
    status: 'done',
    offset_days: -60,
  },
  {
    template_key: 'legal_elsimil_puskesmas',
    event: 'legalitas',
    category: 'Dokumen KUA Muslim (Standar)',
    subcategory: 'Pemeriksaan Kesehatan',
    title: 'Pemeriksaan kesehatan pra-nikah di Puskesmas & Sertifikat ELSIMIL',
    notes: 'Pengecekan hemoglobin, lingkar lengan atas, suntik tetanus toksoid (TT) jika dianjurkan.',
    priority: 'high',
    status: 'done',
    offset_days: -50,
  },
  {
    template_key: 'legal_daftar_simkah',
    event: 'legalitas',
    category: 'Dokumen KUA Muslim (Standar)',
    subcategory: 'Pendaftaran Online',
    title: 'Pendaftaran di portal SIMKAH Kemenag (simkah.kemenag.go.id)',
    notes: 'Booking jadwal nikah & konfirmasi nama penghulu yang bertugas.',
    priority: 'high',
    status: 'done',
    offset_days: -45,
  },
  {
    template_key: 'legal_bimwin_kursus',
    event: 'legalitas',
    category: 'Dokumen KUA Muslim (Standar)',
    subcategory: 'Bimbingan Perkawinan',
    title: 'Mengikuti Bimbingan Perkawinan (Bimwin) mandiri atau KUA',
    notes: 'Mendapatkan sertifikat bimbingan sebagai bekal pondasi rumah tangga.',
    priority: 'medium',
    status: 'in_progress',
    offset_days: -30,
  },
  // Dokumen Kondisional
  {
    template_key: 'legal_surat_rekomendasi_n8',
    event: 'legalitas',
    category: 'Dokumen Kondisional (Sesuai Situasi)',
    subcategory: 'Pernikahan Beda Kecamatan',
    title: 'Surat Rekomendasi Nikah (N8) dari KUA Kecamatan asal [Kondisional]',
    notes: 'Wajib jika akad nikah dilangsungkan di luar kecamatan domisili KTP pengantin.',
    priority: 'high',
    status: 'done',
    offset_days: -40,
  },
  {
    template_key: 'legal_wali_nikah',
    event: 'legalitas',
    category: 'Dokumen Kondisional (Sesuai Situasi)',
    subcategory: 'Wali Nikah',
    title: 'Surat Taukil Wali Nikah jika wali nasab berhalangan hadir [Kondisional]',
    notes: 'Dibuat di hadapan Kepala KUA domisili wali untuk penyerahan kuasa kepada penghulu.',
    priority: 'high',
    status: 'todo',
    offset_days: -20,
  },
  {
    template_key: 'legal_kontrak_venue_katering',
    event: 'legalitas',
    category: 'Dokumen Operasional Vendor',
    subcategory: 'Arsip Kontrak',
    title: 'Arsip surat kontrak kerja & tanda terima pelunasan vendor utama',
    notes: 'Kumpulkan dalam 1 map bening: venue, katering, dekorasi, foto/video, MUA.',
    priority: 'high',
    status: 'in_progress',
    offset_days: -14,
  },

  // =========================================================================
  // E. HARI H DAN PASCA PERNIKAHAN
  // =========================================================================
  {
    template_key: 'harih_emergency_kit',
    event: 'hari_h_pasca',
    category: 'Barang Bawaan Pengantin',
    subcategory: 'Perlengkapan Darurat',
    title: 'Tas emergency kit: jarum pentul, peniti, bedak, tisu, obat lambung, plester',
    notes: 'Dipegang oleh bridesmaid / saudara perempuan pendamping pengantin.',
    priority: 'high',
    status: 'todo',
    offset_days: -2,
    estimated_cost: 150000,
    actual_cost: null,
    quantity: 1,
    unit: 'pouch',
  },
  {
    template_key: 'harih_mahar_rings_holder',
    event: 'hari_h_pasca',
    category: 'Pemeriksaan Perlengkapan',
    subcategory: 'Logistik Akad',
    title: 'Serah terima kotak cincin & mahar kepada PIC keluarga yang ditunjuk',
    notes: 'Jangan sampai tertinggal di rumah / kamar hotel saat rombongan berangkat.',
    priority: 'high',
    status: 'todo',
    offset_days: -1,
  },
  {
    template_key: 'harih_breakfast_bride',
    event: 'hari_h_pasca',
    category: 'Koordinasi Hari H',
    subcategory: 'Kesehatan Mempelai',
    title: 'Sarapan hangat berprotein tinggi sebelum sesi rias makeup subuh',
    notes: 'Pengantin wajib makan porsi cukup agar tidak lemas saat berdiri di pelaminan.',
    priority: 'high',
    status: 'todo',
    offset_days: 0,
  },
  {
    template_key: 'harih_angpao_lockbox',
    event: 'hari_h_pasca',
    category: 'Koordinasi Hari H',
    subcategory: 'Keamanan',
    title: 'Kotak angpao tergembok & serah terima kunci ke orang tua / bendahara',
    notes: 'Setelah acara resepsi selesai, kotak langsung dipindahkan ke mobil keluarga.',
    priority: 'high',
    status: 'todo',
    offset_days: 0,
  },
  {
    template_key: 'pasca_rental_return',
    event: 'hari_h_pasca',
    category: 'Pengembalian & Pelunasan',
    subcategory: 'Logistik Pasca Acara',
    title: 'Pengembalian busana sewaan sanggar, beskap, kebaya, & aksesoris',
    notes: 'Cek kelengkapan bros, keris, selop, dan kain agar tidak kena denda deposit sewa.',
    priority: 'high',
    status: 'todo',
    offset_days: 2,
  },
  {
    template_key: 'pasca_thank_you_notes',
    event: 'hari_h_pasca',
    category: 'Apresiasi & Hadiah',
    subcategory: 'Ucapan Terima Kasih',
    title: 'Mengirimkan pesan apresiasi & ucapan terima kasih kepada vendor & keluarga',
    notes: 'Kirim via WhatsApp dan berikan ulasan positif bintang 5 untuk vendor.',
    priority: 'medium',
    status: 'todo',
    offset_days: 3,
  },
  {
    template_key: 'pasca_ktp_kk_disdukcapil',
    event: 'hari_h_pasca',
    category: 'Administrasi Setelah Menikah',
    subcategory: 'Kependudukan Sipil',
    title: 'Pengurusan perubahan status KTP & Kartu Keluarga baru di Disdukcapil',
    notes: 'Bawa Buku Nikah asli, KK lama kedua orang tua, dan surat pengantar kelurahan.',
    priority: 'high',
    status: 'todo',
    offset_days: 14,
  },
  {
    template_key: 'pasca_bpjs_update',
    event: 'hari_h_pasca',
    category: 'Administrasi Setelah Menikah',
    subcategory: 'Asuransi & Kesehatan',
    title: 'Penggabungan faskes & kepesertaan BPJS Kesehatan suami istri',
    notes: 'Bisa dilakukan melalui aplikasi Mobile JKN dengan melampirkan KK baru.',
    priority: 'medium',
    status: 'todo',
    offset_days: 21,
  },
]

/**
 * Bangun daftar tugas dari template.
 * `fresh: true` (mulai ulang oleh pengguna) = semua belum dicentang dan tanpa contoh biaya/toko;
 * tanpa opsi, contoh progres ikut terisi (dipakai akun demo).
 */
export function buildInitialTasks(weddingId: string, weddingDateStr: string | null, opts: { fresh?: boolean } = {}): Task[] {
  const weddingDate = weddingDateStr ? parseDateOnly(weddingDateStr) : null
  const now = new Date()

  return INITIAL_CHECKLIST_TEMPLATES.map((source, index) => {
    const tmpl: TemplateTaskDef = opts.fresh
      ? { ...source, status: 'todo', actual_cost: null, vendor_store_name: undefined, product_url: undefined, item_status: undefined }
      : source
    let dueDate: string | null = null
    if (weddingDate) {
      const targetDate = new Date(weddingDate)
      targetDate.setDate(targetDate.getDate() + tmpl.offset_days)
      dueDate = toDateOnly(targetDate)
    }

    return {
      id: `task_${weddingId}_${tmpl.template_key}`,
      wedding_id: weddingId,
      title: tmpl.title,
      event: tmpl.event,
      category: tmpl.category,
      subcategory: tmpl.subcategory ?? null,
      notes: tmpl.notes ?? null,
      status: tmpl.status,
      priority: tmpl.priority,
      due_date: dueDate,
      assignee: null,
      is_archived: false,
      sort_order: index + 1,
      template_key: tmpl.template_key,
      completed_at: tmpl.status === 'done' ? now.toISOString() : null,
      estimated_cost: tmpl.estimated_cost ?? null,
      actual_cost: tmpl.actual_cost ?? null,
      quantity: tmpl.quantity ?? null,
      unit: tmpl.unit ?? null,
      product_url: tmpl.product_url ?? null,
      vendor_store_name: tmpl.vendor_store_name ?? null,
      item_status: tmpl.item_status ?? null,
      is_custom: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }
  })
}

export function calculateEventSummary(tasks: Task[]): Record<ChecklistEventKey, EventSummary> {
  const result: Record<ChecklistEventKey, EventSummary> = {
    lamaran: { eventKey: 'lamaran', title: CHECKLIST_EVENTS.lamaran.title, totalCount: 0, doneCount: 0, pendingCount: 0, completionPercent: 0, estimatedCost: 0, actualCost: 0, costVariance: 0, overdueCount: 0 },
    pernikahan: { eventKey: 'pernikahan', title: CHECKLIST_EVENTS.pernikahan.title, totalCount: 0, doneCount: 0, pendingCount: 0, completionPercent: 0, estimatedCost: 0, actualCost: 0, costVariance: 0, overdueCount: 0 },
    adat: { eventKey: 'adat', title: CHECKLIST_EVENTS.adat.title, totalCount: 0, doneCount: 0, pendingCount: 0, completionPercent: 0, estimatedCost: 0, actualCost: 0, costVariance: 0, overdueCount: 0 },
    legalitas: { eventKey: 'legalitas', title: CHECKLIST_EVENTS.legalitas.title, totalCount: 0, doneCount: 0, pendingCount: 0, completionPercent: 0, estimatedCost: 0, actualCost: 0, costVariance: 0, overdueCount: 0 },
    hari_h_pasca: { eventKey: 'hari_h_pasca', title: CHECKLIST_EVENTS.hari_h_pasca.title, totalCount: 0, doneCount: 0, pendingCount: 0, completionPercent: 0, estimatedCost: 0, actualCost: 0, costVariance: 0, overdueCount: 0 },
  }

  const today = new Date()

  for (const t of tasks) {
    if (t.is_archived) continue
    const ev = (t.event as ChecklistEventKey) || 'pernikahan'
    if (!result[ev]) continue

    const sum = result[ev]
    sum.totalCount++
    if (t.status === 'done') {
      sum.doneCount++
    } else {
      sum.pendingCount++
      if (t.due_date && daysBetween(today, parseDateOnly(t.due_date)) < 0) {
        sum.overdueCount++
      }
    }

    if (t.estimated_cost) sum.estimatedCost += t.estimated_cost
    if (t.actual_cost) sum.actualCost += t.actual_cost
  }

  for (const key of Object.keys(result) as ChecklistEventKey[]) {
    const sum = result[key]
    sum.completionPercent = sum.totalCount > 0 ? Math.round((sum.doneCount / sum.totalCount) * 100) : 0
    sum.costVariance = sum.estimatedCost - sum.actualCost
  }

  return result
}

export function calculateOverallSummary(tasks: Task[]): OverallSummary {
  const activeTasks = tasks.filter((t) => !t.is_archived)
  const totalCount = activeTasks.length
  const doneCount = activeTasks.filter((t) => t.status === 'done').length
  const pendingCount = totalCount - doneCount
  const completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  let totalEstimatedCost = 0
  let totalActualCost = 0
  let unpaidItemsCount = 0
  let overdueCount = 0
  const today = new Date()

  for (const t of activeTasks) {
    if (t.estimated_cost) totalEstimatedCost += t.estimated_cost
    if (t.actual_cost) {
      totalActualCost += t.actual_cost
    } else if (t.estimated_cost && t.status !== 'done') {
      unpaidItemsCount++
    }

    if (t.status !== 'done' && t.due_date && daysBetween(today, parseDateOnly(t.due_date)) < 0) {
      overdueCount++
    }
  }

  return {
    totalCount,
    doneCount,
    pendingCount,
    completionPercent,
    totalEstimatedCost,
    totalActualCost,
    costVariance: totalEstimatedCost - totalActualCost,
    unpaidItemsCount,
    overdueCount,
  }
}

export function groupTasksByCategory(tasks: Task[], event: ChecklistEventKey): CategoryGroup[] {
  const eventTasks = tasks.filter((t) => !t.is_archived && ((t.event as ChecklistEventKey) || 'pernikahan') === event)
  const categoryMap = new Map<string, Task[]>()

  for (const t of eventTasks) {
    const cat = t.category || 'Lainnya'
    if (!categoryMap.has(cat)) categoryMap.set(cat, [])
    categoryMap.get(cat)!.push(t)
  }

  const groups: CategoryGroup[] = []

  for (const [catName, items] of categoryMap.entries()) {
    const subcategoryMap = new Map<string, Task[]>()
    const uncategorizedItems: Task[] = []

    for (const item of items) {
      if (item.subcategory && item.subcategory.trim()) {
        const sub = item.subcategory.trim()
        if (!subcategoryMap.has(sub)) subcategoryMap.set(sub, [])
        subcategoryMap.get(sub)!.push(item)
      } else {
        uncategorizedItems.push(item)
      }
    }

    const subcategories = Array.from(subcategoryMap.entries()).map(([name, subItems]) => ({
      name,
      items: subItems,
    }))

    const totalItems = items.length
    const doneItems = items.filter((i) => i.status === 'done').length
    const completionPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0
    const totalEstimated = items.reduce((s, i) => s + (i.estimated_cost ?? 0), 0)
    const totalActual = items.reduce((s, i) => s + (i.actual_cost ?? 0), 0)

    groups.push({
      name: catName,
      event,
      subcategories,
      uncategorizedItems,
      totalItems,
      doneItems,
      completionPercent,
      totalEstimated,
      totalActual,
    })
  }

  return groups
}
