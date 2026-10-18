/**
 * Ikon anggaran.
 * - Acara: kunci ikon disimpan di `budget_events.icon` (dibatasi regex di database), dipetakan ke Lucide di sini.
 * - Pos: ikon ditebak dari namanya (tanpa kolom database), mis. "Make up" → kuas, "Dekorasi" → bunga.
 */
import {
  Brush,
  Building,
  Camera,
  Car,
  Crown,
  FileText,
  Flower2,
  Gem,
  Gift,
  HandCoins,
  HeartHandshake,
  Hotel,
  House,
  Mail,
  Moon,
  Music,
  Package,
  PartyPopper,
  Plane,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Tag,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

export const EVENT_ICONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'heart-handshake', label: 'Lamaran', icon: HeartHandshake },
  { key: 'camera', label: 'Foto', icon: Camera },
  { key: 'gem', label: 'Cincin', icon: Gem },
  { key: 'plane', label: 'Perjalanan', icon: Plane },
  { key: 'sparkles', label: 'Kilau', icon: Sparkles },
  { key: 'moon', label: 'Malam', icon: Moon },
  { key: 'flower', label: 'Bunga', icon: Flower2 },
  { key: 'party', label: 'Pesta', icon: PartyPopper },
  { key: 'users', label: 'Keluarga', icon: Users },
  { key: 'house', label: 'Rumah', icon: House },
  { key: 'gift', label: 'Hadiah', icon: Gift },
  { key: 'star', label: 'Bintang', icon: Star },
]

export function eventIcon(key: string | null | undefined): LucideIcon {
  return EVENT_ICONS.find((i) => i.key === key)?.icon ?? Sparkles
}

/**
 * Warna kartu acara bergilir agar tiap acara mudah dibedakan.
 * Semua dari token tema; teks di atas soft tone lolos 4.5:1. Warna bukan satu-satunya penanda (ada ikon + nama).
 */
export type EventTone = { tile: string; from: string; bar: string; border: string }

export const EVENT_TONES: EventTone[] = [
  { tile: 'bg-primary text-on-primary', from: 'from-primary-soft', bar: 'bg-primary', border: 'border-primary/20' },
  { tile: 'bg-gold text-ink', from: 'from-gold-soft', bar: 'bg-gold', border: 'border-gold/40' },
  { tile: 'bg-partner text-white', from: 'from-partner-soft', bar: 'bg-partner', border: 'border-partner/20' },
  { tile: 'bg-success text-white', from: 'from-success-soft', bar: 'bg-success', border: 'border-success/20' },
]

/** Untuk "Semua acara" dan pos tanpa acara. */
export const NEUTRAL_TONE: EventTone = { tile: 'bg-surface-muted text-ink-muted', from: 'from-surface-muted', bar: 'bg-ink-muted', border: 'border-border' }

export function eventTone(index: number): EventTone {
  return EVENT_TONES[((index % EVENT_TONES.length) + EVENT_TONES.length) % EVENT_TONES.length] ?? NEUTRAL_TONE
}

const POS_RULES: [RegExp, LucideIcon][] = [
  [/cadangan|darurat|kontinjensi/i, ShieldCheck],
  [/make ?up|\bmua\b|rias|hair|salon/i, Brush],
  [/dekor|pelaminan|bunga|florist|lighting/i, Flower2],
  [/kater|cater|konsumsi|makan|buffet|kue/i, UtensilsCrossed],
  [/foto|video|dokumentasi|sinemat|album/i, Camera],
  [/busana|baju|kebaya|gaun|beskap|\bjas\b|seragam|dress/i, Shirt],
  [/cincin|perhiasan|emas/i, Gem],
  [/mahar|mas kawin/i, HandCoins],
  [/seserahan|hantaran|hadiah/i, Gift],
  [/undangan/i, Mail],
  [/souvenir|suvenir|cendera/i, Package],
  [/hotel|akomodasi|penginapan|villa|resort/i, Hotel],
  [/pesawat|tiket|honeymoon|bulan madu|travel|tour/i, Plane],
  [/transport|mobil|kendaraan|bensin/i, Car],
  [/venue|gedung|tempat|ballroom|sewa|plataran/i, Building],
  [/hiburan|musik|band|\bmc\b|organ|sound/i, Music],
  [/admin|dokumen|kua|berkas|surat/i, FileText],
  [/adat|prosesi|siraman|pengajian/i, Sparkles],
  [/keluarga|tamu|panitia|\bwo\b|organizer/i, Users],
  [/vip|premium|eksklusif/i, Crown],
]

export function posIcon(name: string, isReserve = false): LucideIcon {
  if (isReserve) return ShieldCheck
  return POS_RULES.find(([re]) => re.test(name))?.[1] ?? Tag
}

/** Pos yang umum per acara, untuk saran satu ketukan di form pos. */
export const POS_SUGGESTIONS: Record<string, string[]> = {
  lamaran: ['Make up', 'Dekorasi', 'Konsumsi', 'Seserahan', 'Cincin', 'Busana', 'Dokumentasi', 'Kue & hantaran'],
  prewedding: ['Fotografer', 'Make up', 'Busana', 'Sewa lokasi', 'Transportasi', 'Properti foto'],
  wedding: ['Venue', 'Katering', 'Dekorasi', 'Make up', 'Busana', 'Dokumentasi', 'Undangan', 'Souvenir', 'Mahar', 'Hiburan', 'Dana cadangan'],
  honeymoon: ['Tiket pesawat', 'Hotel', 'Transportasi', 'Makan', 'Wisata & aktivitas', 'Oleh-oleh'],
}
export const POS_SUGGESTIONS_DEFAULT = ['Make up', 'Dekorasi', 'Konsumsi', 'Busana', 'Dokumentasi', 'Transportasi']

/** Saran nama acara di form tambah acara. */
export const EVENT_SUGGESTIONS: { name: string; icon: string }[] = [
  { name: 'Lamaran', icon: 'heart-handshake' },
  { name: 'Prewedding', icon: 'camera' },
  { name: 'Wedding', icon: 'gem' },
  { name: 'Honeymoon', icon: 'plane' },
  { name: 'Siraman', icon: 'flower' },
  { name: 'Pengajian', icon: 'moon' },
  { name: 'Ngunduh mantu', icon: 'house' },
  { name: 'Bridal shower', icon: 'party' },
]
