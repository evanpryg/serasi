/** Kode undangan: 8 karakter tanpa huruf/angka yang mirip (0/O, 1/I). */
const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/

export function normalizeInviteCode(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidInviteCode(raw: string): boolean {
  return CODE_RE.test(normalizeInviteCode(raw))
}

/** Tampilan mudah dibaca: ABCD-EFGH */
export function formatInviteCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

export function inviteLink(code: string): string {
  return `${window.location.origin}/join/${code}`
}

export function whatsappShareUrl(code: string, inviterName: string): string {
  const text = `Hai! ${inviterName} mengajakmu merencanakan pernikahan kita bersama di Serasi. Buka link ini untuk bergabung: ${inviteLink(code)} (kode: ${formatInviteCode(code)})`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

// Kode disimpan sementara agar tetap ada setelah daftar/konfirmasi email/login Google.
const PENDING_KEY = 'serasi:pending-invite'

export function rememberPendingInvite(code: string) {
  try {
    localStorage.setItem(PENDING_KEY, normalizeInviteCode(code))
  } catch {
    /* abaikan */
  }
}

export function pendingInvite(): string | null {
  try {
    const v = localStorage.getItem(PENDING_KEY)
    return v && isValidInviteCode(v) ? v : null
  } catch {
    return null
  }
}

export function clearPendingInvite() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    /* abaikan */
  }
}
