export const APP_NAME = 'Serasi'
export const APP_TAGLINE = 'Wedding planner untuk berdua'

/** Foto sampul bawaan; pasangan bisa menggantinya dengan foto prewedding. */
export const DEFAULT_COVER = { webp: '/images/default-cover.webp', jpg: '/images/default-cover.jpg' }

export const CONTACT_EMAIL: string | undefined = import.meta.env.VITE_CONTACT_EMAIL || undefined

/**
 * QRIS statis merchant (isi QR di stiker QRIS, bukan rahasia). Saat checkout nominal
 * disisipkan sehingga menjadi QR dinamis (lib/qris). Ganti lewat VITE_QRIS_PAYLOAD.
 */
export const QRIS_PAYLOAD: string =
  import.meta.env.VITE_QRIS_PAYLOAD ||
  '00020101021126600016ID.CO.SHOPEE.WWW0118936009180001387499020713874990303UMI51440014ID.CO.QRIS.WWW0215ID10210817576970303UMI5204539953033605802ID5909Starlight6006JEMBER61056816762070703A01630410FD'

/** Opsional: nomor WhatsApp admin (format 628…) untuk konfirmasi pembayaran lebih cepat. */
export const PAYMENT_WHATSAPP: string | undefined = /^628\d{7,12}$/.test(import.meta.env.VITE_PAYMENT_WHATSAPP ?? '')
  ? import.meta.env.VITE_PAYMENT_WHATSAPP
  : undefined

/** Halaman tempat pengguna boleh dikembalikan setelah login (cegah open redirect). */
export function isSafeAppPath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    (path.startsWith('/app/') || /^\/join\/[A-Za-z0-9-]{8,9}$/.test(path)) &&
    !path.startsWith('//') &&
    !path.includes('\\') &&
    !path.includes('://')
  )
}
