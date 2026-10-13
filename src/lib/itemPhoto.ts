import { db } from './supabase'
import { getCurrentDemoAccount } from './demoData'
import { blobToDataUrl } from './avatar'

/**
 * Foto item anggaran (foto barang, tangkapan layar toko, atau bukti bayar).
 * Disimpan di kolom `expenses.proof_path`:
 * - akun riil: path di bucket privat `wedding-files/<wedding_id>/items/…` (dibaca lewat signed URL);
 * - akun demo: data URL WebP kecil di localStorage.
 */
const BUCKET = 'wedding-files'
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
export const ITEM_PHOTO_MAX_BYTES = 15 * 1024 * 1024

export function validateItemPhoto(file: File): string | null {
  if (file.type && !ACCEPTED.includes(file.type) && !file.type.startsWith('image/')) return 'Pilih file gambar (JPG, PNG, atau WebP).'
  if (file.size > ITEM_PHOTO_MAX_BYTES) return 'Ukuran foto maksimal 15 MB.'
  return null
}

/** Perkecil ke sisi terpanjang `maxEdge` px dan ubah ke WebP. Menggambar ulang juga membuang EXIF (lokasi GPS). */
async function shrink(file: File, maxEdge: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak tersedia')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (!blob) throw new Error('Gagal memproses foto')
  return blob
}

/** Unggah foto dan kembalikan nilai untuk `proof_path`. */
export async function uploadItemPhoto(weddingId: string, file: File): Promise<string> {
  const invalid = validateItemPhoto(file)
  if (invalid) throw new Error(invalid)

  if (getCurrentDemoAccount()) return blobToDataUrl(await shrink(file, 640, 0.78))

  const blob = await shrink(file, 1280, 0.82)
  const path = `${weddingId}/items/${crypto.randomUUID()}.webp`
  const { error } = await db().storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false })
  if (error) throw error
  return path
}

/** Hapus file lama dari storage (diam-diam; file yatim tidak memengaruhi data). */
export async function removeItemPhoto(path: string | null | undefined) {
  if (!path || path.startsWith('data:') || getCurrentDemoAccount()) return
  await db().storage.from(BUCKET).remove([path])
}

const cache = new Map<string, { url: string; expires: number }>()
const TTL = 60 * 60

export async function itemPhotoUrl(path: string): Promise<string | null> {
  if (path.startsWith('data:')) return path
  const hit = cache.get(path)
  if (hit && hit.expires > Date.now() + 60_000) return hit.url
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(path, TTL)
  if (error || !data) return null
  cache.set(path, { url: data.signedUrl, expires: Date.now() + TTL * 1000 })
  return data.signedUrl
}
