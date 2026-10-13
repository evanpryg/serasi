import type { Session, User } from '@supabase/supabase-js'
import type { Member } from '@/auth/WorkspaceProvider'
import type { DashboardData } from '@/hooks/useDashboardData'
import type { DeepTalkData, PersonalityData } from '@/hooks/useCoupleData'
import type {
  BudgetCategory,
  Expense,
  Guest,
  Payment,
  RundownItem,
  Task,
  Wedding,
  WeddingVendor,
  MemberSide,
} from './database.types'
import { buildInitialTasks } from './checklistTemplates'

export type DemoAccountId = 'demo-gratis' | 'demo-premium'

export type DemoAccount = {
  id: DemoAccountId
  email: string
  label: string
  tierLabel: string
  badgeTone: 'primary' | 'gold'
  isPremium: boolean
  description: string
  user: User
  partner: Member
  me: Member
  wedding: Wedding
  dashboardData: DashboardData
  personalityData: PersonalityData
  deepTalkData: DeepTalkData
  guests: Guest[]
  rundown: RundownItem[]
  vendors: WeddingVendor[]
  categories: BudgetCategory[]
  expenses: Expense[]
  payments: Payment[]
  tasks: Task[]
}

export const DEMO_ACCOUNTS: Record<DemoAccountId, DemoAccount> = {
  'demo-gratis': {
    id: 'demo-gratis',
    email: 'demo.gratis@serasi.app',
    label: 'Demo 1: Versi Gratis',
    tierLabel: 'Paket Gratis',
    badgeTone: 'primary',
    isPremium: false,
    description: 'Bayu & Citra · Pasangan ISTP & ENFJ · Akun Siap Pakai (Bebas Tambah & Coba Data)',
    user: {
      id: 'demo-user-gratis-1',
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'Bayu Pratama' },
      aud: 'authenticated',
      confirmation_sent_at: '2026-10-13T00:00:00Z',
      created_at: '2026-10-13T00:00:00Z',
      email: 'demo.gratis@serasi.app',
      email_confirmed_at: '2026-10-13T00:00:00Z',
      phone: '',
      role: 'authenticated',
      updated_at: '2026-10-13T00:00:00Z',
    },
    me: {
      userId: 'demo-user-gratis-1',
      role: 'owner',
      side: 'cpp',
      name: 'Bayu Pratama',
      avatarUrl: null,
      isMe: true,
    },
    partner: {
      userId: 'demo-user-gratis-2',
      role: 'partner',
      side: 'cpw',
      name: 'Citra Lestari',
      avatarUrl: null,
      isMe: false,
    },
    wedding: {
      id: 'demo-wedding-gratis',
      owner_id: 'demo-user-gratis-1',
      title: 'Pernikahan Bayu & Citra',
      partner_names: 'Bayu & Citra',
      wedding_date: '2026-11-28',
      city: 'Bandung',
      event_types: ['resepsi', 'akad'],
      guest_estimate: 350,
      budget_target: 85000000,
      available_funds: 68000000,
      wedding_style: 'Modern Tradisional',
      tradition: 'Sunda',
      cover_photo_path: null,
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
    categories: [
      { id: 'c1', wedding_id: 'demo-wedding-gratis', name: 'Katering & Gedung', planned_amount: 45000000, is_archived: false, is_reserve: false, sort_order: 1, notes: 'Gedung kapasitas 600 org & katering prasmanan 700 pax', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'c2', wedding_id: 'demo-wedding-gratis', name: 'Dekorasi & Pelaminan Sunda', planned_amount: 18000000, is_archived: false, is_reserve: false, sort_order: 2, notes: 'Pelaminan gebyok modern & pergola masuk', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'c3', wedding_id: 'demo-wedding-gratis', name: 'Foto & Video Dokumentasi', planned_amount: 12000000, is_archived: false, is_reserve: false, sort_order: 3, notes: 'Liputan akad & resepsi + album cetak', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'c4', wedding_id: 'demo-wedding-gratis', name: 'Busana & Rias Pengantin', planned_amount: 8000000, is_archived: false, is_reserve: false, sort_order: 4, notes: 'Rias Sunda Siger, beskap, orang tua & pager ayu', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'c5', wedding_id: 'demo-wedding-gratis', name: 'Undangan & Souvenir', planned_amount: 4000000, is_archived: false, is_reserve: false, sort_order: 5, notes: '300 undangan fisik + souvenir pouch batik', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'c7', wedding_id: 'demo-wedding-gratis', name: 'Seserahan', planned_amount: 5000000, is_archived: false, is_reserve: false, sort_order: 6, notes: '7 nampan: alat sholat, busana, sepatu, skincare, parfum, kue, buah', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'c6', wedding_id: 'demo-wedding-gratis', name: 'Dana Darurat / Cadangan', planned_amount: 10000000, is_archived: false, is_reserve: true, sort_order: 6, notes: 'Alokasi aman untuk kebutuhan mendadak hari H', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    expenses: [
      { id: 'e1', wedding_id: 'demo-wedding-gratis', category_id: 'c1', vendor_id: null, title: 'DP Gedung & Katering Puri Suryalaya', amount: 15000000, status: 'paid', expense_date: '2026-09-20', fund_source: 'Tabungan Bersama', proof_path: null, link_url: null, notes: 'Bukti transfer via BCA', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'e2', wedding_id: 'demo-wedding-gratis', category_id: 'c2', vendor_id: null, title: 'DP Dekorasi Sekar Arum', amount: 5000000, status: 'paid', expense_date: '2026-10-05', fund_source: 'Bayu Pratama', proof_path: null, link_url: null, notes: 'Kunci tema rustic-sunda', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'e3', wedding_id: 'demo-wedding-gratis', category_id: 'c3', vendor_id: null, title: 'DP Foto & Video Kala Cerita', amount: 4000000, status: 'paid', expense_date: '2026-10-10', fund_source: 'Citra Lestari', proof_path: null, link_url: null, notes: 'Termin 1 dari 3', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'e4', wedding_id: 'demo-wedding-gratis', category_id: 'c5', vendor_id: null, title: 'Cetak 300 Pcs Undangan Hardcover', amount: 1800000, status: 'paid', expense_date: '2026-10-12', fund_source: 'Tabungan Bersama', proof_path: null, link_url: null, notes: 'Percetakan Pagarsih Bandung', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'e6', wedding_id: 'demo-wedding-gratis', category_id: 'c7', vendor_id: null, title: 'Set alat sholat + Al-Quran', amount: 650000, status: 'paid', expense_date: '2026-10-08', fund_source: null, proof_path: null, link_url: 'https://shopee.co.id/search?keyword=set%20seserahan%20alat%20sholat', notes: 'Warna sage, sudah sampai', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'e7', wedding_id: 'demo-wedding-gratis', category_id: 'c7', vendor_id: null, title: 'Skincare set', amount: 1200000, status: 'planned', expense_date: null, fund_source: null, proof_path: null, link_url: 'https://www.tokopedia.com/search?q=skincare%20set%20seserahan', notes: 'Tunggu promo 11.11', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'e8', wedding_id: 'demo-wedding-gratis', category_id: 'c7', vendor_id: null, title: 'Sepatu & tas', amount: 900000, status: 'planned', expense_date: null, fund_source: null, proof_path: null, link_url: null, notes: 'Ukuran sepatu 38', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'e5', wedding_id: 'demo-wedding-gratis', category_id: 'c5', vendor_id: null, title: 'Souvenir Pouch Batik Halus (350 pcs)', amount: 2000000, status: 'planned', expense_date: null, fund_source: 'Citra Lestari', proof_path: null, link_url: null, notes: 'Estimasi pengrajin Pasar Baru', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    vendors: [
      {
        id: 'v1',
        wedding_id: 'demo-wedding-gratis',
        vendor_id: null,
        category_id: 'c1',
        custom_name: 'Puri Suryalaya & Catering Bandung',
        vendor_category: 'venue',
        status: 'dipilih',
        quoted_amount: 47000000,
        contract_amount: 45000000,
        service_scope: 'Gedung utama AC 4 jam + 700 porsi prasmanan + 4 stand gubukan khas Sunda (Empal Gentong, Siomay, Es Goyobod, Zuppa Soup).',
        extra_costs_note: 'Biaya kebersihan sudah termasuk, penambahan porsi Rp 55.000/pax.',
        contact_note: 'Ibu Maya (0812-2345-6789) - Puri Suryalaya Buah Batu',
        notes: 'Sudah deal potongan paket Rp 2.000.000 dari harga publish.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
      {
        id: 'v2',
        wedding_id: 'demo-wedding-gratis',
        vendor_id: null,
        category_id: 'c3',
        custom_name: 'Kala Cerita Fotografi',
        vendor_category: 'foto_video',
        status: 'dipilih',
        quoted_amount: 13000000,
        contract_amount: 12000000,
        service_scope: '2 Fotografer + 1 Videografer, Album Kolase 20x30 magnetic box, teaser 1 menit reels, video dokumenter cinematic 3 menit, semua file mentah via GDrive.',
        extra_costs_note: 'Luar kota Bandung dikenakan transport. Lokasi di kota aman tanpa charge.',
        contact_note: 'Mas Reza (0813-8765-4321) @kalaceritaphoto',
        notes: 'Gaya foto warm tone & candid natural yang disukai Citra.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
      {
        id: 'v3',
        wedding_id: 'demo-wedding-gratis',
        vendor_id: null,
        category_id: 'c4',
        custom_name: 'Sanggar Rias D’Larasati (Sunda Siger)',
        vendor_category: 'mua',
        status: 'dipilih',
        quoted_amount: 8500000,
        contract_amount: 8000000,
        service_scope: 'Rias & busana akad Sunda Siger lengkap ronce melati, rias resepsi modern, beskap pengantin pria 2 pasang, busana 2 ibu & 2 bapak, busana 4 pasang pager ayu.',
        extra_costs_note: 'Melati segar disiapkan H-1 malam.',
        contact_note: 'Teh Nita (0819-1234-5678) Jl. R.E. Martadinata',
        notes: 'Portofolio Sunda Siger sangat rapi dan kokoh.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
      {
        id: 'v4',
        wedding_id: 'demo-wedding-gratis',
        vendor_id: null,
        category_id: 'c2',
        custom_name: 'Sekar Arum Dekorasi Pelaminan',
        vendor_category: 'dekorasi',
        status: 'dipertimbangkan',
        quoted_amount: 18000000,
        contract_amount: null,
        service_scope: 'Pelaminan gebyok modern 10 meter, taman bunga segar panggung, standing flowers karpet merah, gate masuk pergola, dekor photobooth 3x3m.',
        extra_costs_note: 'Bunga lokal segar fresh cut.',
        contact_note: 'Kang Dani (0821-9876-5432)',
        notes: 'Sedang menunggu revisi sketsa 3D untuk lorong masuk.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
      {
        id: 'v5',
        wedding_id: 'demo-wedding-gratis',
        vendor_id: null,
        category_id: null,
        custom_name: 'Harmoni Acoustic Bandung',
        vendor_category: 'hiburan',
        status: 'dihubungi',
        quoted_amount: 4500000,
        contract_amount: null,
        service_scope: 'Akustik 4 personil (Vokal wanita, Gitar akustik, Saxophone, Bass) + sound system 3000 watt.',
        extra_costs_note: 'Request lagu maksimal 15 judul lagu favorit pengantin.',
        contact_note: 'Kang Ari (0857-1122-3344)',
        notes: 'Citra ingin lagu pembuka Can’t Help Falling in Love versi akustik.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
    ],
    payments: [
      { id: 'p1', wedding_id: 'demo-wedding-gratis', wedding_vendor_id: 'v1', amount: 15000000, payment_date: '2026-09-20', due_date: '2026-09-20', status: 'paid', payment_type: 'dp', fund_source: 'Tabungan Bersama', proof_path: null, notes: 'DP booking gedung & tanggal', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p2', wedding_id: 'demo-wedding-gratis', wedding_vendor_id: 'v1', amount: 30000000, payment_date: null, due_date: '2026-11-15', status: 'scheduled', payment_type: 'pelunasan', fund_source: 'Tabungan Bersama', proof_path: null, notes: 'Pelunasan H-13 sebelum acara', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p3', wedding_id: 'demo-wedding-gratis', wedding_vendor_id: 'v2', amount: 4000000, payment_date: '2026-10-10', due_date: '2026-10-10', status: 'paid', payment_type: 'dp', fund_source: 'Citra Lestari', proof_path: null, notes: 'DP kunci tim fotografer', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p4', wedding_id: 'demo-wedding-gratis', wedding_vendor_id: 'v2', amount: 8000000, payment_date: null, due_date: '2026-11-20', status: 'scheduled', payment_type: 'pelunasan', fund_source: 'Bayu Pratama', proof_path: null, notes: 'Pelunasan sisa termin foto', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    tasks: buildInitialTasks('demo-wedding-gratis', '2026-11-28'),
    guests: [
      { id: 'g1', wedding_id: 'demo-wedding-gratis', name: 'Keluarga Besar Abah Sukarna', group_name: 'Keluarga Pria', guest_count: 5, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Menginap di hotel dekat venue', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'g2', wedding_id: 'demo-wedding-gratis', name: 'Om Dedi & Tante Rita', group_name: 'Keluarga Wanita', guest_count: 2, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Saksi akad dari pihak wanita', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'g3', wedding_id: 'demo-wedding-gratis', name: 'Dr. Hendra Gunawan, Sp.A & Istri', group_name: 'VIP', guest_count: 2, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Tempat duduk VIP baris depan', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'g4', wedding_id: 'demo-wedding-gratis', name: 'Rekan Divisi Jaringan Telkom Bandung', group_name: 'Rekan Kerja', guest_count: 8, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Rombongan kantor Bayu', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'g5', wedding_id: 'demo-wedding-gratis', name: 'Alumni SMAN 3 Bandung (Citra)', group_name: 'Sahabat', guest_count: 6, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Foto bersama di sesi resepsi 12.00', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'g6', wedding_id: 'demo-wedding-gratis', name: 'Kang Asep Kusnadi & Keluarga', group_name: 'Keluarga Pria', guest_count: 3, invitation_status: 'terkirim', rsvp_status: 'menunggu', notes: 'Belum konfirmasi tiket kereta dari Tasik', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'g7', wedding_id: 'demo-wedding-gratis', name: 'Tim Marketing Ruang Guru Citra', group_name: 'Rekan Kerja', guest_count: 5, invitation_status: 'terkirim', rsvp_status: 'menunggu', notes: 'Konfirmasi via WhatsApp grup', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'g8', wedding_id: 'demo-wedding-gratis', name: 'Ibu Ratna Dewi, M.Pd (Kepala Sekolah)', group_name: 'VIP', guest_count: 2, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Diberikan souvenir VIP khusus', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'g9', wedding_id: 'demo-wedding-gratis', name: 'Rina Anggraeni & Suami', group_name: 'Sahabat', guest_count: 2, invitation_status: 'terkirim', rsvp_status: 'tidak_hadir', notes: 'Titip kado, berhalangan karena melahirkan', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'g10', wedding_id: 'demo-wedding-gratis', name: 'Bpk. Ketua RT 04 & Pengurus RW Sukajadi', group_name: 'VIP', guest_count: 3, invitation_status: 'belum', rsvp_status: 'menunggu', notes: 'Undangan fisik akan diantar langsung oleh Bayu', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    rundown: [
      { id: 'r1', wedding_id: 'demo-wedding-gratis', title: 'Makeup & Busana Akad Nikah (Sunda Siger)', starts_at: '2026-11-28T05:00:00+07:00', ends_at: '2026-11-28T07:00:00+07:00', location: 'Ruang Rias Pengantin Puri Suryalaya', person_in_charge: 'Teh Nita (MUA D’Larasati)', sort_order: 1, notes: 'Sarapan hangat disiapkan sebelum pemasangan siger melati.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'r2', wedding_id: 'demo-wedding-gratis', title: 'Penyambutan Rombongan Calon Pengantin Pria', starts_at: '2026-11-28T07:00:00+07:00', ends_at: '2026-11-28T07:30:00+07:00', location: 'Pintu Masuk Utama Gedung', person_in_charge: 'Kang Denny (WO) & Perwakilan Keluarga', sort_order: 2, notes: 'Pengalungan melati oleh Ibunda CPW kepada Bayu, diiringi kecapi suling lembut.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'r3', wedding_id: 'demo-wedding-gratis', title: 'Akad Nikah Khidmat & Ijab Qabul', starts_at: '2026-11-28T07:30:00+07:00', ends_at: '2026-11-28T08:45:00+07:00', location: 'Meja Akad Pelaminan Utama', person_in_charge: 'Penghulu KUA Sukajadi & Saksi Nikah', sort_order: 3, notes: 'Sound mic dan mahar logam mulia 10 gram sudah diposisikan siap di meja.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'r4', wedding_id: 'demo-wedding-gratis', title: 'Sungkeman & Prosesi Adat Sunda (Sawer, Huap Lingkung, Bakakak)', starts_at: '2026-11-28T08:45:00+07:00', ends_at: '2026-11-28T09:45:00+07:00', location: 'Area Pelaminan & Depan Panggung', person_in_charge: 'MC Adat Sunda (Kang Ujang)', sort_order: 4, notes: 'Siapkan beras kuning, payung sawer, dan ayam bakakak di piring daun.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'r5', wedding_id: 'demo-wedding-gratis', title: 'Istirahat, Makan Pagi Pengantin & Retouch Busana Resepsi', starts_at: '2026-11-28T09:45:00+07:00', ends_at: '2026-11-28T10:45:00+07:00', location: 'Ruang VIP Pengantin', person_in_charge: 'Teh Nita & Pendamping Keluarga', sort_order: 5, notes: 'Pengantin wajib istirahat santai minum air hangat dan makan porsi cukup.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'r6', wedding_id: 'demo-wedding-gratis', title: 'Kirab Pengantin Resepsi & Pembukaan', starts_at: '2026-11-28T11:00:00+07:00', ends_at: '2026-11-28T11:30:00+07:00', location: 'Karpet Merah ke Pelaminan', person_in_charge: 'Kang Denny (WO) & MC', sort_order: 6, notes: 'Iring-iringan pager ayu & keluarga inti, iringan musik Harmoni Acoustic.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'r7', wedding_id: 'demo-wedding-gratis', title: 'Ramah Tamah, Santap Siang & Foto Bersama Tamu Undangan', starts_at: '2026-11-28T11:30:00+07:00', ends_at: '2026-11-28T13:30:00+07:00', location: 'Ballroom & Pelaminan', person_in_charge: 'Kala Cerita Fotografi & Tim Katering', sort_order: 7, notes: 'Antrean foto dipandu per grup: VIP, Keluarga, Rekan Kantor, Sahabat.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'r8', wedding_id: 'demo-wedding-gratis', title: 'Lempar Handbouquet & Penutupan Acara', starts_at: '2026-11-28T13:30:00+07:00', ends_at: '2026-11-28T14:00:00+07:00', location: 'Tengah Ballroom Gedung', person_in_charge: 'MC & WO', sort_order: 8, notes: 'Momen heboh bersama sahabat bujang & gadis yang hadir.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'r9', wedding_id: 'demo-wedding-gratis', title: 'Pengecekan Kotak Angpao, Serah Terima Souvenir & Packing', starts_at: '2026-11-28T14:00:00+07:00', ends_at: '2026-11-28T15:00:00+07:00', location: 'Ruang Panitia & Keamanan', person_in_charge: 'Om Dedi & Bendahara Keluarga', sort_order: 9, notes: 'Kotak angpao disegel dan dibawa mobil keluarga inti.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    dashboardData: {
      categories: [
        { id: 'c1', name: 'Katering & Gedung', planned_amount: 45000000, is_archived: false, is_reserve: false },
        { id: 'c2', name: 'Dekorasi & Pelaminan Sunda', planned_amount: 18000000, is_archived: false, is_reserve: false },
        { id: 'c3', name: 'Foto & Video Dokumentasi', planned_amount: 12000000, is_archived: false, is_reserve: false },
        { id: 'c4', name: 'Busana & Rias Pengantin', planned_amount: 8000000, is_archived: false, is_reserve: false },
        { id: 'c5', name: 'Undangan & Souvenir', planned_amount: 4000000, is_archived: false, is_reserve: false },
        { id: 'c6', name: 'Dana Darurat / Cadangan', planned_amount: 10000000, is_archived: false, is_reserve: true },
      ],
      expenses: [
        { category_id: 'c1', amount: 15000000, status: 'paid' },
        { category_id: 'c2', amount: 5000000, status: 'paid' },
        { category_id: 'c3', amount: 4000000, status: 'paid' },
        { category_id: 'c5', amount: 1800000, status: 'paid' },
      ],
      vendors: [
        { id: 'v1', category_id: 'c1', status: 'dipilih', contract_amount: 45000000, custom_name: 'Puri Suryalaya & Catering Bandung' },
        { id: 'v2', category_id: 'c3', status: 'dipilih', contract_amount: 12000000, custom_name: 'Kala Cerita Fotografi' },
        { id: 'v3', category_id: 'c4', status: 'dipilih', contract_amount: 8000000, custom_name: 'Sanggar Rias D’Larasati (Sunda Siger)' },
      ],
      payments: [
        { id: 'p1', wedding_vendor_id: 'v1', amount: 15000000, status: 'paid', due_date: '2026-09-20' },
        { id: 'p2', wedding_vendor_id: 'v1', amount: 30000000, status: 'scheduled', due_date: '2026-11-15' },
        { id: 'p3', wedding_vendor_id: 'v2', amount: 4000000, status: 'paid', due_date: '2026-10-10' },
        { id: 'p4', wedding_vendor_id: 'v2', amount: 8000000, status: 'scheduled', due_date: '2026-11-20' },
      ],
      tasks: [
        { id: 't4', title: 'Fitting pertama kebaya Sunda Siger & beskap', status: 'todo', due_date: '2026-10-25', priority: 'high', is_archived: false },
        { id: 't5', title: 'Kunci menu katering dan tester prasmanan final', status: 'in_progress', due_date: '2026-10-30', priority: 'medium', is_archived: false },
        { id: 't6', title: 'Distribusi 300 undangan fisik ke keluarga besar', status: 'todo', due_date: '2026-11-08', priority: 'high', is_archived: false },
        { id: 't1', title: 'DP Gedung & Booking Tanggal 28 November', status: 'done', due_date: '2026-09-20', priority: 'high', is_archived: false },
      ],
    },
    personalityData: {
      results: [
        {
          wedding_id: 'demo-wedding-gratis',
          user_id: 'demo-user-gratis-1',
          type_code: 'ISTP',
          scores: { E: 20, S: 80, T: 85, J: 25 },
          answers: {},
          completed_at: '2026-10-13T00:00:00Z',
        },
        {
          wedding_id: 'demo-wedding-gratis',
          user_id: 'demo-user-gratis-2',
          type_code: 'ENFJ',
          scores: { E: 75, S: 30, T: 25, J: 80 },
          answers: {},
          completed_at: '2026-10-13T00:00:00Z',
        },
      ],
      completedBy: ['demo-user-gratis-1', 'demo-user-gratis-2'],
    },
    deepTalkData: {
      answers: [],
      answered: new Set(),
    },
  },

  'demo-premium': {
    id: 'demo-premium',
    email: 'demo.premium@serasi.app',
    label: 'Demo 2: Versi Berbayar (Premium)',
    tierLabel: '👑 Paket Premium Aktif',
    badgeTone: 'gold',
    isPremium: true,
    description: 'Dimas & Aluna · Pasangan INTJ & INFJ · Akun Premium Lengkap (Bebas Tambah & Coba Data)',
    user: {
      id: 'demo-user-premium-1',
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'Dimas Wicaksono' },
      aud: 'authenticated',
      confirmation_sent_at: '2026-10-13T00:00:00Z',
      created_at: '2026-10-13T00:00:00Z',
      email: 'demo.premium@serasi.app',
      email_confirmed_at: '2026-10-13T00:00:00Z',
      phone: '',
      role: 'authenticated',
      updated_at: '2026-10-13T00:00:00Z',
    },
    me: {
      userId: 'demo-user-premium-1',
      role: 'owner',
      side: 'cpp',
      name: 'Dimas Wicaksono',
      avatarUrl: null,
      isMe: true,
    },
    partner: {
      userId: 'demo-user-premium-2',
      role: 'partner',
      side: 'cpw',
      name: 'Aluna Saraswati',
      avatarUrl: null,
      isMe: false,
    },
    wedding: {
      id: 'demo-wedding-premium',
      owner_id: 'demo-user-premium-1',
      title: 'Pernikahan Dimas & Aluna',
      partner_names: 'Dimas & Aluna',
      wedding_date: '2026-12-19',
      city: 'Jakarta Selatan',
      event_types: ['resepsi', 'akad'],
      guest_estimate: 450,
      budget_target: 150000000,
      available_funds: 165000000,
      wedding_style: 'Elegance Garden',
      tradition: 'Nasional Modern',
      cover_photo_path: null,
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
    categories: [
      { id: 'p-c1', wedding_id: 'demo-wedding-premium', name: 'Venue & Plataran Dharmawangsa', planned_amount: 70000000, is_archived: false, is_reserve: false, sort_order: 1, notes: 'Outdoor-indoor garden ballroom eksklusif', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-c2', wedding_id: 'demo-wedding-premium', name: 'Catering Premium Buffet & Stalls', planned_amount: 45000000, is_archived: false, is_reserve: false, sort_order: 2, notes: 'Buffet internasional & premium live cooking stalls', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-c3', wedding_id: 'demo-wedding-premium', name: 'Dekorasi & Ambience Lighting', planned_amount: 25000000, is_archived: false, is_reserve: false, sort_order: 3, notes: 'Glass house concept + fairy lights', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-c4', wedding_id: 'demo-wedding-premium', name: 'Dokumentasi Sinematik (The Leonardi)', planned_amount: 15000000, is_archived: false, is_reserve: false, sort_order: 4, notes: 'Same-day edit video & foto cetak premium box', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-c5', wedding_id: 'demo-wedding-premium', name: 'Busana Pengantin & MUA Couture', planned_amount: 12000000, is_archived: false, is_reserve: false, sort_order: 5, notes: 'Desainer lokal + MUA flawless glam', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-c6', wedding_id: 'demo-wedding-premium', name: 'Dana Cadangan Keluarga', planned_amount: 10000000, is_archived: false, is_reserve: true, sort_order: 6, notes: 'Buffer kontinjensi untuk pengeluaran tak terduga', template_key: null, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    expenses: [
      { id: 'p-e1', wedding_id: 'demo-wedding-premium', category_id: 'p-c1', vendor_id: null, title: 'DP 50% Venue Plataran Dharmawangsa', amount: 35000000, status: 'paid', expense_date: '2026-08-15', fund_source: 'Rekening Bersama Mandiri', proof_path: null, link_url: null, notes: 'Kontrak sewa penuh venue & taman', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-e2', wedding_id: 'demo-wedding-premium', category_id: 'p-c2', vendor_id: null, title: 'DP Catering & Food Tasting', amount: 20000000, status: 'paid', expense_date: '2026-09-05', fund_source: 'Dimas Wicaksono', proof_path: null, link_url: null, notes: 'Menu western & signature nusantara', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-e3', wedding_id: 'demo-wedding-premium', category_id: 'p-c3', vendor_id: null, title: 'DP Dekorasi & Lighting', amount: 10000000, status: 'paid', expense_date: '2026-09-25', fund_source: 'Aluna Saraswati', proof_path: null, link_url: null, notes: 'Tema botanical white & champagne', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-e4', wedding_id: 'demo-wedding-premium', category_id: 'p-c4', vendor_id: null, title: 'DP Sinematografi The Leonardi', amount: 7500000, status: 'paid', expense_date: '2026-10-01', fund_source: 'Dimas Wicaksono', proof_path: null, link_url: null, notes: 'Termasuk drone aerial shoot', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    vendors: [
      {
        id: 'p-v1',
        wedding_id: 'demo-wedding-premium',
        vendor_id: null,
        category_id: 'p-c1',
        custom_name: 'Plataran Dharmawangsa Jakarta',
        vendor_category: 'venue',
        status: 'dipilih',
        quoted_amount: 75000000,
        contract_amount: 70000000,
        service_scope: 'Eksklusif seluruh area The Dharmawangsa Garden + Grand Pavilion, kapasitas 500 orang, valet parking 50 mobil, ruang VIP pengantin & keluarga.',
        extra_costs_note: 'Sudah termasuk perizinan musik outdoor hingga pukul 21.00 WIB.',
        contact_note: 'Bpk. Aris (0811-9988-7766) Banquet Manager Plataran',
        notes: 'Tempat impian Aluna dengan pohon beringin tua dan nuansa kolonial mewah.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
      {
        id: 'p-v2',
        wedding_id: 'demo-wedding-premium',
        vendor_id: null,
        category_id: 'p-c4',
        custom_name: 'The Leonardi Cinema & Photography',
        vendor_category: 'foto_video',
        status: 'dipilih',
        quoted_amount: 16500000,
        contract_amount: 15000000,
        service_scope: '3 Fotografer, 2 Videografer, 1 Drone Pilot, Same-Day-Edit (SDE) diputar saat resepsi malam, 2 Leather Album 30x40.',
        extra_costs_note: 'SDE editing onsite dengan tim editor studio.',
        contact_note: 'Glenn (0812-7766-5544) Senopati Jakarta Selatan',
        notes: 'Hasil video sangat sinematik dan berkelas.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
      {
        id: 'p-v3',
        wedding_id: 'demo-wedding-premium',
        vendor_id: null,
        category_id: 'p-c3',
        custom_name: 'Stupa Caspea Floral & Decor',
        vendor_category: 'dekorasi',
        status: 'dipilih',
        quoted_amount: 28000000,
        contract_amount: 25000000,
        service_scope: 'Bunga impor putih & blush pink, pergola kaca gantung kristal, instalasi lampu taman fairy lights 100m, photo gallery mirror installation.',
        extra_costs_note: 'Bunga impor Holland didatangkan H-2.',
        contact_note: 'Mba Vivi (0815-3344-5566)',
        notes: 'Kombinasi botanical garden yang elegan tanpa terlihat berlebihan.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
      {
        id: 'p-v4',
        wedding_id: 'demo-wedding-premium',
        vendor_id: null,
        category_id: 'p-c5',
        custom_name: 'Marlene Hariman Studio & Couture',
        vendor_category: 'mua',
        status: 'dipilih',
        quoted_amount: 13000000,
        contract_amount: 12000000,
        service_scope: 'Makeup akad soft natural glam Aluna, touchup resepsi evening look, hair stylist profesional, gaun resepsi mermaid custom silk, tuxedo bespoke Dimas.',
        extra_costs_note: 'Trial makeup sudah dilakukan 1 Oktober 2026.',
        contact_note: 'Marlene (0818-0909-8787)',
        notes: 'Aluna merasa sangat cocok dengan karakter riasannya.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
      {
        id: 'p-v5',
        wedding_id: 'demo-wedding-premium',
        vendor_id: null,
        category_id: null,
        custom_name: 'One Heart Wedding Organizer Jakarta',
        vendor_category: 'wedding_organizer',
        status: 'dipilih',
        quoted_amount: 12000000,
        contract_amount: 11000000,
        service_scope: 'Full Day Coordination (10 crew berseragam & HT), pendampingan pengantin 1-on-1, koordinasi vendor H-30, VIP guest concierge.',
        extra_costs_note: 'Termasuk gladi resik H-1 di venue Plataran.',
        contact_note: 'Mas Kevin (0811-2233-4455)',
        notes: 'Sangat rapi dalam menyusun timeline per menit.',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
    ],
    payments: [
      { id: 'p-p1', wedding_id: 'demo-wedding-premium', wedding_vendor_id: 'p-v1', amount: 35000000, payment_date: '2026-08-15', due_date: '2026-08-15', status: 'paid', payment_type: 'dp', fund_source: 'Rekening Bersama Mandiri', proof_path: null, notes: 'DP konfirmasi venue Plataran', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-p2', wedding_id: 'demo-wedding-premium', wedding_vendor_id: 'p-v1', amount: 35000000, payment_date: null, due_date: '2026-11-20', status: 'scheduled', payment_type: 'pelunasan', fund_source: 'Rekening Bersama Mandiri', proof_path: null, notes: 'Pelunasan sisa venue H-30', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-p3', wedding_id: 'demo-wedding-premium', wedding_vendor_id: 'p-v2', amount: 7500000, payment_date: '2026-10-01', due_date: '2026-10-01', status: 'paid', payment_type: 'dp', fund_source: 'Dimas Wicaksono', proof_path: null, notes: 'DP dokumentasi The Leonardi', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-p4', wedding_id: 'demo-wedding-premium', wedding_vendor_id: 'p-v2', amount: 7500000, payment_date: null, due_date: '2026-12-05', status: 'scheduled', payment_type: 'pelunasan', fund_source: 'Dimas Wicaksono', proof_path: null, notes: 'Pelunasan H-14 acara', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-p5', wedding_id: 'demo-wedding-premium', wedding_vendor_id: 'p-v3', amount: 10000000, payment_date: '2026-09-25', due_date: '2026-09-25', status: 'paid', payment_type: 'dp', fund_source: 'Aluna Saraswati', proof_path: null, notes: 'DP Dekorasi Stupa Caspea', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-p6', wedding_id: 'demo-wedding-premium', wedding_vendor_id: 'p-v3', amount: 15000000, payment_date: null, due_date: '2026-12-01', status: 'scheduled', payment_type: 'pelunasan', fund_source: 'Aluna Saraswati', proof_path: null, notes: 'Pelunasan sisa dekorasi', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    tasks: buildInitialTasks('demo-wedding-premium', '2026-12-19'),
    guests: [
      { id: 'p-g1', wedding_id: 'demo-wedding-premium', name: 'Prof. Dr. Ir. Soegito Hardjono & Istri', group_name: 'VIP', guest_count: 2, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Mantan Direktur BUMN, tempat duduk Meja VIP 1', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-g2', wedding_id: 'demo-wedding-premium', name: 'Keluarga Besar Wicaksono Solo', group_name: 'Keluarga Pria', guest_count: 6, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Rombongan keluarga ayah Dimas', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-g3', wedding_id: 'demo-wedding-premium', name: 'Keluarga Besar Aryasuta Yogyakarta', group_name: 'Keluarga Wanita', guest_count: 8, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Keluarga ibu Aluna', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-g4', wedding_id: 'demo-wedding-premium', name: 'Jajaran Direksi & Partner KPMG Jakarta', group_name: 'Rekan Kerja', guest_count: 10, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Kolega kantor Dimas', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-g5', wedding_id: 'demo-wedding-premium', name: 'Alumni Arsitektur ITB 2015', group_name: 'Sahabat', guest_count: 12, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Sahabat dekat kampus Aluna', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-g6', wedding_id: 'demo-wedding-premium', name: 'Bpk. Bambang Pamungkas & Nyonya', group_name: 'VIP', guest_count: 2, invitation_status: 'terkirim', rsvp_status: 'menunggu', notes: 'Kolega bisnis orang tua', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-g7', wedding_id: 'demo-wedding-premium', name: 'Rekan Studio Arsitektur Aluna', group_name: 'Rekan Kerja', guest_count: 6, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'Tim kantor Aluna', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-g8', wedding_id: 'demo-wedding-premium', name: 'Dra. Endang Sulistyowati (Dosen Pembimbing)', group_name: 'VIP', guest_count: 2, invitation_status: 'terkirim', rsvp_status: 'hadir', notes: 'VIP Meja 2', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-g9', wedding_id: 'demo-wedding-premium', name: 'dr. Satria Wibowo & Rekan', group_name: 'Sahabat', guest_count: 2, invitation_status: 'terkirim', rsvp_status: 'tidak_hadir', notes: 'Sedang tugas residensi di luar pulau', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    rundown: [
      { id: 'p-r1', wedding_id: 'demo-wedding-premium', title: 'Executive MUA & Hair Styling Sesi 1 (Akad)', starts_at: '2026-12-19T06:00:00+07:00', ends_at: '2026-12-19T08:00:00+07:00', location: 'The Presidential Suite Plataran', person_in_charge: 'Marlene Hariman Studio', sort_order: 1, notes: 'Sarapan healthy bowl disajikan untuk kedua mempelai.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-r2', wedding_id: 'demo-wedding-premium', title: 'Akad Nikah Khidmat & Penyerahan Mahar', starts_at: '2026-12-19T08:30:00+07:00', ends_at: '2026-12-19T10:00:00+07:00', location: 'The Glass Pavilion Plataran', person_in_charge: 'KUA Kebayoran Baru & One Heart WO', sort_order: 2, notes: 'Pemberkatan & ijab qabul disaksikan 50 keluarga inti.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-r3', wedding_id: 'demo-wedding-premium', title: 'Intimate Family Lunch & Sungkeman', starts_at: '2026-12-19T10:00:00+07:00', ends_at: '2026-12-19T12:00:00+07:00', location: 'Private Dining Room Plataran', person_in_charge: 'Tim Banquet Plataran & WO', sort_order: 3, notes: 'Makan siang santai khusus keluarga sebelum istirahat siang.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-r4', wedding_id: 'demo-wedding-premium', title: 'Istirahat Siang Pengantin & Onsite SDE Video Editing', starts_at: '2026-12-19T12:00:00+07:00', ends_at: '2026-12-19T15:30:00+07:00', location: 'Presidential Suite & Media Room', person_in_charge: 'The Leonardi Media Crew', sort_order: 4, notes: 'Pengantin istirahat penuh; tim video menyelesaikan cut teaser akad.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-r5', wedding_id: 'demo-wedding-premium', title: 'Retouch Evening Makeup & Gaun Resepsi Couture', starts_at: '2026-12-19T15:30:00+07:00', ends_at: '2026-12-19T17:30:00+07:00', location: 'The Presidential Suite Plataran', person_in_charge: 'Marlene Hariman Studio', sort_order: 5, notes: 'Ganti busana malam dan hair down styling.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-r6', wedding_id: 'demo-wedding-premium', title: 'Welcoming Cocktail & Registrasi Barcode Tamu VIP', starts_at: '2026-12-19T18:00:00+07:00', ends_at: '2026-12-19T18:45:00+07:00', location: 'Foyer Taman & Glass Pavilion', person_in_charge: 'One Heart WO Concierge', sort_order: 6, notes: 'Live jazz quartet mengiringi canape & mocktail welcome drink.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-r7', wedding_id: 'demo-wedding-premium', title: 'Grand Entrance Resepsi Malam & Penayangan Same Day Edit (SDE)', starts_at: '2026-12-19T19:00:00+07:00', ends_at: '2026-12-19T19:30:00+07:00', location: 'Grand Garden Ballroom', person_in_charge: 'One Heart WO Lead (Kevin) & AV Team', sort_order: 7, notes: 'Lampu taman meredup, video SDE diputar di videotron LED 6x3m.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-r8', wedding_id: 'demo-wedding-premium', title: 'Dinner Buffet, Toast, & Foto Bersama Tamu Undangan', starts_at: '2026-12-19T19:30:00+07:00', ends_at: '2026-12-19T21:00:00+07:00', location: 'Grand Garden Ballroom & Outdoor Gazebo', person_in_charge: 'Banquet & Fotografer', sort_order: 8, notes: 'Sesi santap malam iringan musik romantis & ramah tamah hangat.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
      { id: 'p-r9', wedding_id: 'demo-wedding-premium', title: 'After Party Akustik & Closing Fireworks Sparkler', starts_at: '2026-12-19T21:00:00+07:00', ends_at: '2026-12-19T22:00:00+07:00', location: 'Outdoor Poolside Plataran', person_in_charge: 'WO & Seluruh Sahabat', sort_order: 9, notes: 'Pelepasan sparkler api dingin bersama para sahabat terdekat.', created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' },
    ],
    dashboardData: {
      categories: [
        { id: 'p-c1', name: 'Venue & Plataran Dharmawangsa', planned_amount: 70000000, is_archived: false, is_reserve: false },
        { id: 'p-c2', name: 'Catering Premium Buffet & Stalls', planned_amount: 45000000, is_archived: false, is_reserve: false },
        { id: 'p-c3', name: 'Dekorasi & Ambience Lighting', planned_amount: 25000000, is_archived: false, is_reserve: false },
        { id: 'p-c4', name: 'Dokumentasi Sinematik (The Leonardi)', planned_amount: 15000000, is_archived: false, is_reserve: false },
        { id: 'p-c5', name: 'Busana Pengantin & MUA Couture', planned_amount: 12000000, is_archived: false, is_reserve: false },
        { id: 'p-c6', name: 'Dana Cadangan Keluarga', planned_amount: 10000000, is_archived: false, is_reserve: true },
      ],
      expenses: [
        { category_id: 'p-c1', amount: 35000000, status: 'paid' },
        { category_id: 'p-c2', amount: 20000000, status: 'paid' },
        { category_id: 'p-c3', amount: 10000000, status: 'paid' },
        { category_id: 'p-c4', amount: 7500000, status: 'paid' },
      ],
      vendors: [
        { id: 'p-v1', category_id: 'p-c1', status: 'dipilih', contract_amount: 70000000, custom_name: 'Plataran Dharmawangsa Jakarta' },
        { id: 'p-v2', category_id: 'p-c4', status: 'dipilih', contract_amount: 15000000, custom_name: 'The Leonardi Cinema & Photography' },
        { id: 'p-v3', category_id: 'p-c3', status: 'dipilih', contract_amount: 25000000, custom_name: 'Stupa Caspea Floral & Decor' },
        { id: 'p-v4', category_id: 'p-c5', status: 'dipilih', contract_amount: 12000000, custom_name: 'Marlene Hariman Studio & Couture' },
        { id: 'p-v5', category_id: null, status: 'dipilih', contract_amount: 11000000, custom_name: 'One Heart Wedding Organizer Jakarta' },
      ],
      payments: [
        { id: 'p-p1', wedding_vendor_id: 'p-v1', amount: 35000000, status: 'paid', due_date: '2026-08-15' },
        { id: 'p-p2', wedding_vendor_id: 'p-v1', amount: 35000000, status: 'scheduled', due_date: '2026-11-20' },
        { id: 'p-p3', wedding_vendor_id: 'p-v2', amount: 7500000, status: 'paid', due_date: '2026-10-01' },
        { id: 'p-p4', wedding_vendor_id: 'p-v2', amount: 7500000, status: 'scheduled', due_date: '2026-12-05' },
        { id: 'p-p5', wedding_vendor_id: 'p-v3', amount: 10000000, status: 'paid', due_date: '2026-09-25' },
        { id: 'p-p6', wedding_vendor_id: 'p-v3', amount: 15000000, status: 'scheduled', due_date: '2026-12-01' },
      ],
      tasks: [
        { id: 'p-t3', title: 'Review rundown acara bersama One Heart WO', status: 'todo', due_date: '2026-11-10', priority: 'high', is_archived: false },
        { id: 'p-t4', title: 'Finalisasi daftar 450 undangan VIP, kolega & keluarga', status: 'in_progress', due_date: '2026-11-15', priority: 'high', is_archived: false },
        { id: 'p-t2', title: 'Fitting Gaun Pengantin Couture & Bespoke Tuxedo', status: 'in_progress', due_date: '2026-10-20', priority: 'high', is_archived: false },
        { id: 'p-t1', title: 'DP Venue Plataran Dharmawangsa & Kunci Tanggal 19 Desember', status: 'done', due_date: '2026-08-15', priority: 'high', is_archived: false },
      ],
    },
    personalityData: {
      results: [
        {
          wedding_id: 'demo-wedding-premium',
          user_id: 'demo-user-premium-1',
          type_code: 'INTJ',
          scores: { E: 20, S: 25, T: 85, J: 85 },
          answers: {},
          completed_at: '2026-10-13T00:00:00Z',
        },
        {
          wedding_id: 'demo-wedding-premium',
          user_id: 'demo-user-premium-2',
          type_code: 'INFJ',
          scores: { E: 25, S: 20, T: 25, J: 80 },
          answers: {},
          completed_at: '2026-10-13T00:00:00Z',
        },
      ],
      completedBy: ['demo-user-premium-1', 'demo-user-premium-2'],
    },
    deepTalkData: {
      answers: [],
      answered: new Set(),
    },
  },
}

export const DEMO_SESSION_KEY = 'serasi:demo_session_id'

export function isDemoEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim()
  return normalized === 'demo.gratis@serasi.app' || normalized === 'demo.premium@serasi.app'
}

export function getDemoAccountIdByEmail(email: string): DemoAccountId | null {
  const normalized = email.toLowerCase().trim()
  if (normalized === 'demo.gratis@serasi.app') return 'demo-gratis'
  if (normalized === 'demo.premium@serasi.app') return 'demo-premium'
  return null
}

export const DEMO_AS_KEY = 'serasi:demo_as'

/**
 * Akun demo bisa dibuka dari sudut pandang CPP (default) atau CPW.
 * Sudut pandang CPW = me/partner ditukar dan user sesi menjadi si CPW.
 */
const demoViews = new Map<string, DemoAccount>()

function viewAs(account: DemoAccount, side: MemberSide): DemoAccount {
  if (side === 'cpp') return account
  const key = `${account.id}:${side}`
  const cached = demoViews.get(key)
  if (cached) return cached
  const view: DemoAccount = {
    ...account,
    user: {
      ...account.user,
      id: account.partner.userId,
      user_metadata: { full_name: account.partner.name },
    },
    me: { ...account.partner, isMe: true },
    partner: { ...account.me, isMe: false },
  }
  demoViews.set(key, view)
  return view
}

export function getDemoSide(): MemberSide {
  return localStorage.getItem(DEMO_AS_KEY) === 'cpw' ? 'cpw' : 'cpp'
}

export function getCurrentDemoAccount(): DemoAccount | null {
  const id = localStorage.getItem(DEMO_SESSION_KEY) as DemoAccountId | null
  if (!id || !DEMO_ACCOUNTS[id]) return null
  return viewAs(DEMO_ACCOUNTS[id], getDemoSide())
}

export function setDemoSession(id: DemoAccountId, side: MemberSide = 'cpp'): DemoAccount {
  localStorage.setItem(DEMO_SESSION_KEY, id)
  localStorage.setItem(DEMO_AS_KEY, side)
  const account = DEMO_ACCOUNTS[id]
  localStorage.setItem('serasi:premium_unlocked', account.isPremium ? 'true' : 'false')
  return viewAs(account, side)
}

export function clearDemoSession(): void {
  localStorage.removeItem(DEMO_SESSION_KEY)
  localStorage.removeItem(DEMO_AS_KEY)
}

export function createMockSession(user: User): Session {
  return {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    expires_in: 3600 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
    token_type: 'bearer',
    user,
  }
}
