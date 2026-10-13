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
  [/(^|\.)shopee\.co\.id$|(^|\.)shp\.ee$/, 'Shopee'],
  [/(^|\.)tokopedia\.com$|(^|\.)tokopedia\.link$/, 'Tokopedia'],
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

export type LinkPreview = {
  /** "Shopee", "Tokopedia", atau domain. */
  store: string
  /** Nama produk yang terbaca dari alamatnya; null jika tidak ada (mis. link pendek). */
  title: string | null
  /** Nama toko (Tokopedia menaruhnya di segmen pertama). */
  shop: string | null
  /** Link pencarian, bukan halaman produk. */
  isSearch: boolean
}

function slugToText(slug: string): string | null {
  let text = slug
  try {
    text = decodeURIComponent(slug)
  } catch {
    /* biarkan apa adanya */
  }
  text = text
    .replace(/-i\.\d+\.\d+$/, '') // Shopee: Nama-Produk-i.123.456
    .replace(/\.html?$/, '')
    .replace(/[-_+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Butuh huruf; ID angka/kode acak (link pendek) tidak berguna sebagai judul.
  if (!/[a-z]{3,}/i.test(text) || !/\s/.test(text)) return null
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Pratinjau tanpa jaringan: nama toko + nama produk dibaca dari alamatnya.
 * Marketplace (Shopee/Tokopedia) memblokir pengambilan gambar dari luar,
 * jadi foto produk diunggah sendiri oleh pengguna.
 */
export function linkPreview(url: string): LinkPreview {
  const store = linkLabel(url)
  try {
    const u = new URL(url)
    const query = u.searchParams.get('keyword') ?? u.searchParams.get('q') ?? u.searchParams.get('search')
    if (query) return { store, title: query.trim(), shop: null, isSearch: true }
    const parts = u.pathname.split('/').filter(Boolean)
    const last = parts.at(-1) ?? ''
    const title = last ? slugToText(last) : null
    const shop = store === 'Tokopedia' && parts.length >= 2 ? (parts[0] ?? null) : null
    return { store, title, shop, isSearch: false }
  } catch {
    return { store, title: null, shop: null, isSearch: false }
  }
}
