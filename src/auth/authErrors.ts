import type { AuthError } from '@supabase/supabase-js'

/**
 * Terjemahkan error Supabase Auth ke pesan yang aman & mudah dipahami.
 * Pesan tidak membocorkan apakah sebuah email terdaftar atau tidak.
 */
export function authErrorMessage(error: AuthError | Error | null | undefined): string {
  if (!error) return 'Terjadi kesalahan. Silakan coba lagi.'
  const code = 'code' in error ? (error.code as string | undefined) : undefined
  const msg = error.message?.toLowerCase() ?? ''

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials'))
    return 'Email atau password tidak cocok.'
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed'))
    return 'Email belum dikonfirmasi. Buka link konfirmasi yang kami kirim ke email kamu.'
  if (code === 'weak_password' || msg.includes('password should'))
    return 'Password terlalu lemah. Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.'
  if (code === 'same_password') return 'Password baru harus berbeda dari password lama.'
  if (code?.startsWith('over_') || msg.includes('rate limit') || msg.includes('too many'))
    return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'
  if (code === 'signup_disabled') return 'Pendaftaran sedang ditutup sementara.'
  if (code === 'otp_expired' || msg.includes('expired') || msg.includes('invalid flow state'))
    return 'Link sudah kedaluwarsa atau pernah dipakai. Silakan minta link baru.'
  if (msg.includes('fetch') || msg.includes('network')) return 'Tidak dapat terhubung. Periksa koneksi internetmu.'
  return 'Terjadi kesalahan. Silakan coba lagi.'
}

const POST_AUTH_KEY = 'serasi:post-auth-redirect'

export function rememberPostAuthPath(path: string | undefined) {
  try {
    if (path) sessionStorage.setItem(POST_AUTH_KEY, path)
    else sessionStorage.removeItem(POST_AUTH_KEY)
  } catch {
    /* storage tidak tersedia: abaikan */
  }
}

export function consumePostAuthPath(): string | null {
  try {
    const value = sessionStorage.getItem(POST_AUTH_KEY)
    sessionStorage.removeItem(POST_AUTH_KEY)
    return value
  } catch {
    return null
  }
}
