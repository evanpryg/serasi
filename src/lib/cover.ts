import { db } from './supabase'

export const COVER_MAX_BYTES = 10 * 1024 * 1024 // batas file asli sebelum dikompres
const COVER_MAX_EDGE = 1920
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export function validateCoverFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return 'Gunakan foto berformat JPG, PNG, atau WebP.'
  if (file.size > COVER_MAX_BYTES) return 'Ukuran foto maksimal 10 MB.'
  return null
}

/**
 * Perkecil foto di browser (maks. 1920 px, WebP) sebelum diunggah.
 * Menggambar ulang ke canvas juga membuang metadata EXIF, termasuk lokasi GPS.
 */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, COVER_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak tersedia')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  if (!blob) throw new Error('Gagal memproses foto')
  return blob
}

const BUCKET = 'wedding-files'

/** Unggah foto sampul ke folder privat workspace, simpan path, hapus foto lama. */
export async function uploadCoverPhoto(weddingId: string, file: File, previousPath: string | null): Promise<string> {
  const blob = await compressImage(file)
  const path = `${weddingId}/cover-${Date.now()}.webp`
  const client = db()
  const { error: upErr } = await client.storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false })
  if (upErr) throw upErr
  const { error: dbErr } = await client.from('weddings').update({ cover_photo_path: path }).eq('id', weddingId)
  if (dbErr) {
    await client.storage.from(BUCKET).remove([path])
    throw dbErr
  }
  if (previousPath) await client.storage.from(BUCKET).remove([previousPath])
  signedCache.delete(path)
  return path
}

export async function resetCoverPhoto(weddingId: string, previousPath: string | null) {
  const client = db()
  const { error } = await client.from('weddings').update({ cover_photo_path: null }).eq('id', weddingId)
  if (error) throw error
  if (previousPath) await client.storage.from(BUCKET).remove([previousPath])
}

// Signed URL (bucket privat) di-cache agar tidak meminta ulang di setiap render.
const signedCache = new Map<string, { url: string; expires: number }>()
const SIGNED_TTL = 60 * 60

export async function signedCoverUrl(path: string): Promise<string | null> {
  const cached = signedCache.get(path)
  if (cached && cached.expires > Date.now() + 60_000) return cached.url
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL)
  if (error || !data) return null
  signedCache.set(path, { url: data.signedUrl, expires: Date.now() + SIGNED_TTL * 1000 })
  return data.signedUrl
}
