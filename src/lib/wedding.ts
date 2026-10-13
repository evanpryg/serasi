import { z } from 'zod'
import type { EventType } from './database.types'

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string; description: string }[] = [
  { value: 'lamaran', label: 'Lamaran', description: 'Acara pinangan antar keluarga' },
  { value: 'akad', label: 'Akad nikah', description: 'Akad/pemberkatan saja' },
  { value: 'resepsi', label: 'Resepsi', description: 'Resepsi saja' },
  { value: 'akad_resepsi', label: 'Akad dan resepsi', description: 'Di hari atau tempat yang sama' },
  { value: 'keluarga', label: 'Acara keluarga lainnya', description: 'Pengajian, siraman, ngunduh mantu, dll.' },
]

export const WEDDING_STYLE_OPTIONS = [
  'Modern',
  'Tradisional',
  'Intimate',
  'Garden / Outdoor',
  'Rustic',
  'Islami',
  'Internasional',
].map((s) => ({ value: s, label: s }))

export const TRADITION_OPTIONS = [
  'Tanpa adat khusus',
  'Jawa',
  'Sunda',
  'Betawi',
  'Minangkabau',
  'Batak',
  'Melayu',
  'Palembang',
  'Bugis/Makassar',
  'Bali',
  'Banjar',
  'Aceh',
  'Manado',
  'Tionghoa',
  'Lainnya',
].map((s) => ({ value: s, label: s }))

export const CITY_SUGGESTIONS = [
  'Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi', 'Bandung', 'Semarang', 'Yogyakarta', 'Solo', 'Surabaya',
  'Malang', 'Denpasar', 'Medan', 'Padang', 'Palembang', 'Pekanbaru', 'Batam', 'Lampung', 'Pontianak', 'Banjarmasin',
  'Balikpapan', 'Samarinda', 'Makassar', 'Manado', 'Mataram', 'Kupang', 'Ambon', 'Jayapura',
]

const rupiah = (label: string) =>
  z
    .number({ error: `${label} wajib diisi.` })
    .int()
    .min(0, `${label} tidak boleh negatif.`)
    .max(1_000_000_000_000, `${label} terlalu besar.`)

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter.`)
    .transform((v) => (v === '' ? null : v))
    .nullable()

/** Validasi profil pernikahan; dipakai onboarding & pengaturan. */
export const weddingSchema = z.object({
  title: z.string().trim().min(1, 'Nama pasangan atau judul acara wajib diisi.').max(120, 'Maksimal 120 karakter.'),
  partnerNames: optionalText(160),
  weddingDate: z
    .string()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine((v) => v == null || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Tanggal belum valid.'),
  city: z.string().trim().min(1, 'Kota atau area wajib diisi.').max(80, 'Maksimal 80 karakter.'),
  eventTypes: z.array(z.enum(['lamaran', 'akad', 'resepsi', 'akad_resepsi', 'keluarga'])).min(1, 'Pilih minimal satu jenis acara.'),
  guestEstimate: z.number().int().min(0, 'Jumlah tamu tidak boleh negatif.').max(100_000, 'Jumlah tamu terlalu besar.').nullable(),
  budgetTarget: rupiah('Target anggaran'),
  availableFunds: rupiah('Dana tersedia'),
  weddingStyle: optionalText(60),
  tradition: optionalText(60),
})

export type WeddingFormInput = z.input<typeof weddingSchema>
export type WeddingFormValues = z.output<typeof weddingSchema>
