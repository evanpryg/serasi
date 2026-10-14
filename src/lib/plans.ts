/**
 * Pembagian paket Gratis vs Premium — satu sumber untuk landing page, halaman Premium,
 * dan semua kunci fitur. Batas yang berlaku sebenarnya dijaga database
 * (migration 20261014000009_premium_payments.sql); angka di sini harus sama.
 */
import { TOPICS } from './deeptalk'

export const PREMIUM_PLAN_ID = 'premium'
/** Harga tampilan sebelum data `plans` termuat. Nominal yang ditagih selalu dihitung server. */
export const PREMIUM_FALLBACK_PRICE = 99_000

/** = public.free_guest_limit() */
export const FREE_GUEST_LIMIT = 100

/** = public.deeptalk_question_is_free() (prefiks id pertanyaan: visi_, iman_, kom_) */
export const FREE_DEEPTALK_TOPICS: readonly string[] = ['visi', 'iman', 'komunikasi']

export function isFreeDeepTalkTopic(topicId: string): boolean {
  return FREE_DEEPTALK_TOPICS.includes(topicId)
}

const countQuestions = (topicIds?: readonly string[]) =>
  TOPICS.filter((t) => !topicIds || topicIds.includes(t.id)).reduce((s, t) => s + t.questions.length, 0)

export const DEEPTALK_FREE_COUNT = countQuestions(FREE_DEEPTALK_TOPICS)
export const DEEPTALK_TOTAL_COUNT = countQuestions()

/** Baris tabel perbandingan. `true` = termasuk, `false` = tidak, teks = termasuk dengan batas. */
export type PlanRow = { label: string; free: boolean | string; premium: boolean | string }

export const PLAN_ROWS: PlanRow[] = [
  { label: 'Akses berdua (CPP & CPW) dalam satu workspace', free: true, premium: true },
  { label: 'Budget, tabungan bersama, vendor & pembayaran', free: true, premium: true },
  { label: 'Checklist, Berkas KUA & rundown', free: true, premium: true },
  { label: 'Daftar tamu & RSVP', free: `${FREE_GUEST_LIMIT} undangan`, premium: 'Tanpa batas' },
  { label: 'Foto barang & bukti bayar di anggaran', free: false, premium: true },
  { label: 'Tes kepribadian berdua', free: 'Ringkasan', premium: 'Analisis lengkap' },
  { label: 'Deep talk', free: `${DEEPTALK_FREE_COUNT} pertanyaan`, premium: `${DEEPTALK_TOTAL_COUNT} pertanyaan` },
  { label: 'Unduh semua data (JSON)', free: true, premium: true },
]

/** Alasan utama upgrade, untuk kartu ringkas. */
export const PREMIUM_HIGHLIGHTS = [
  { title: 'Tamu tanpa batas', text: `Paket Gratis berhenti di ${FREE_GUEST_LIMIT} undangan.` },
  { title: 'Analisis kepribadian lengkap', text: 'Perkiraan konflik rumah tangga, panduan saat marah, mertua, dan keuangan.' },
  { title: `Semua ${DEEPTALK_TOTAL_COUNT} pertanyaan deep talk`, text: 'Termasuk keuangan, keluarga besar, anak, peran, dan keintiman.' },
  { title: 'Foto di anggaran', text: 'Simpan foto barang seserahan, tangkapan layar toko, dan bukti bayar.' },
] as const

/** Dari mana pengguna datang ke halaman Premium (judul kontekstual). */
export type UpgradeSource = 'tamu' | 'kepribadian' | 'deeptalk' | 'foto'

export const UPGRADE_REASON: Record<UpgradeSource, string> = {
  tamu: `Daftar tamu sudah mencapai ${FREE_GUEST_LIMIT} undangan`,
  kepribadian: 'Buka analisis kepribadian lengkap',
  deeptalk: `Buka semua ${DEEPTALK_TOTAL_COUNT} pertanyaan deep talk`,
  foto: 'Simpan foto di anggaran',
}

export function isUpgradeSource(v: unknown): v is UpgradeSource {
  return typeof v === 'string' && v in UPGRADE_REASON
}
