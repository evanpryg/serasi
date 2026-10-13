/**
 * Pesan sekali tampil yang bertahan melewati redirect guard
 * (state navigasi bisa hilang saat guard melakukan <Navigate> sendiri).
 */
const KEY = 'serasi:flash'

export function setFlash(message: string) {
  try {
    sessionStorage.setItem(KEY, message)
  } catch {
    /* storage tidak tersedia: pesan dilewati */
  }
}

/** Baca tanpa menghapus (aman untuk initializer useState yang bisa dipanggil dua kali). */
export function peekFlash(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearFlash() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* abaikan */
  }
}
