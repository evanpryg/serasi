/**
 * Tautan toko pada item anggaran. Pengguna sering menempel "shopee.co.id/…" tanpa https,
 * jadi skema ditambahkan otomatis. Hanya http(s) yang diterima (sama dengan constraint DB).
 */
export function normalizeLink(raw: string): { ok: true; url: string | null } | { ok: false } {
  const text = raw.trim()
  if (!text) return { ok: true, url: null }
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false }
    if (!url.hostname.includes('.')) return { ok: false }
    return { ok: true, url: url.toString() }
  } catch {
    return { ok: false }
  }
}

const STORE_NAMES: [RegExp, string][] = [
  [/(^|\.)shopee\.co\.id$/, 'Shopee'],
  [/(^|\.)tokopedia\.com$/, 'Tokopedia'],
  [/(^|\.)tiktok\.com$/, 'TikTok Shop'],
  [/(^|\.)lazada\.co\.id$/, 'Lazada'],
  [/(^|\.)blibli\.com$/, 'Blibli'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)wa\.me$|(^|\.)whatsapp\.com$/, 'WhatsApp'],
]

/** "https://www.shopee.co.id/abc" → "Shopee"; domain lain → "toko-abc.com". */
export function linkLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return STORE_NAMES.find(([re]) => re.test(host))?.[1] ?? host
  } catch {
    return 'Link'
  }
}
