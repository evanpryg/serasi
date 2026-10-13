export const APP_NAME = 'Serasi'
export const APP_TAGLINE = 'Wedding planner untuk berdua'

/** Foto sampul bawaan; pasangan bisa menggantinya dengan foto prewedding. */
export const DEFAULT_COVER = { webp: '/images/default-cover.webp', jpg: '/images/default-cover.jpg' }

export const CONTACT_EMAIL: string | undefined = import.meta.env.VITE_CONTACT_EMAIL || undefined

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
