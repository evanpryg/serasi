import { db } from './supabase'
import { getCurrentDemoAccount } from './demoData'
import { updateDemoMemberAvatar } from './demoStore'

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const AVATAR_ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ACCEPTED.includes(file.type)) {
    return 'Gunakan foto profil berformat JPG, PNG, atau WebP.'
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'Ukuran foto profil maksimal 5 MB.'
  }
  return null
}

/**
 * Memotong foto menjadi bujur sangkar (1:1) di tengah dan mengompres ke WebP.
 * Menghilangkan metadata EXIF untuk privasi (seperti koordinat GPS).
 */
export async function compressAvatar(file: File, maxEdge = 400): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const minSide = Math.min(bitmap.width, bitmap.height)
  const sx = Math.round((bitmap.width - minSide) / 2)
  const sy = Math.round((bitmap.height - minSide) / 2)
  const targetSize = Math.min(maxEdge, minSide)

  const canvas = document.createElement('canvas')
  canvas.width = targetSize
  canvas.height = targetSize

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas tidak tersedia')
  }

  // Aktifkan smoothing berkualitas tinggi
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  if (!blob) throw new Error('Gagal memproses foto profil')
  return blob
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Gagal membaca data gambar'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Gagal membaca data gambar'))
    reader.readAsDataURL(blob)
  })
}

export type UploadAvatarParams = {
  userId: string
  file: File
  weddingId?: string
  previousUrl?: string | null
}

/**
 * Unggah foto profil pengguna:
 * - Pada akun demo: dikompresi ke WebP 256px dan disimpan di localStorage (instan).
 * - Pada akun riil: dikompresi dan diunggah ke Supabase Storage (bucket avatars / fallback wedding-files),
 *   kemudian URL disimpan ke tabel public.profiles dan user_metadata.
 */
export async function uploadProfileAvatar({ userId, file, weddingId }: UploadAvatarParams): Promise<string> {
  const validationError = validateAvatarFile(file)
  if (validationError) throw new Error(validationError)

  const demo = getCurrentDemoAccount()
  if (demo) {
    // Demo mode: simpan sebagai data URL WebP resolusi 256x256 (~15 KB)
    const blob = await compressAvatar(file, 256)
    const dataUrl = await blobToDataUrl(blob)
    updateDemoMemberAvatar(demo.id, userId, dataUrl)
    return dataUrl
  }

  const blob = await compressAvatar(file, 400)
  const client = db()
  const timestamp = Date.now()

  // 1. Coba upload ke bucket 'avatars' (publik)
  const avatarPath = `${userId}/avatar-${timestamp}.webp`
  const { error: avatarErr } = await client.storage
    .from('avatars')
    .upload(avatarPath, blob, { contentType: 'image/webp', upsert: true })

  let finalUrl: string

  if (!avatarErr) {
    const { data } = client.storage.from('avatars').getPublicUrl(avatarPath)
    finalUrl = data.publicUrl
  } else if (weddingId) {
    // 2. Fallback: jika bucket avatars belum dibuat, gunakan bucket wedding-files
    const fallbackPath = `${weddingId}/avatar-${userId}-${timestamp}.webp`
    const { error: fallbackErr } = await client.storage
      .from('wedding-files')
      .upload(fallbackPath, blob, { contentType: 'image/webp', upsert: true })
    if (fallbackErr) throw fallbackErr

    const { data: signed, error: signErr } = await client.storage
      .from('wedding-files')
      .createSignedUrl(fallbackPath, 60 * 60 * 24 * 365) // 1 tahun
    if (signErr || !signed) throw signErr ?? new Error('Gagal membuat URL foto')
    finalUrl = signed.signedUrl
  } else {
    throw avatarErr
  }

  // Perbarui tabel profiles dan auth metadata
  const [profRes, metaRes] = await Promise.all([
    client.from('profiles').update({ avatar_url: finalUrl }).eq('id', userId),
    client.auth.updateUser({ data: { avatar_url: finalUrl } }),
  ])

  if (profRes.error) throw profRes.error
  if (metaRes.error) throw metaRes.error

  return finalUrl
}

export type DeleteAvatarParams = {
  userId: string
  weddingId?: string
  previousUrl?: string | null
}

/**
 * Hapus foto profil dan kembalikan ke avatar inisial bawaan.
 */
export async function deleteProfileAvatar({ userId }: DeleteAvatarParams): Promise<void> {
  const demo = getCurrentDemoAccount()
  if (demo) {
    updateDemoMemberAvatar(demo.id, userId, null)
    return
  }

  const client = db()
  const [profRes, metaRes] = await Promise.all([
    client.from('profiles').update({ avatar_url: null }).eq('id', userId),
    client.auth.updateUser({ data: { avatar_url: null } }),
  ])

  if (profRes.error) throw profRes.error
  if (metaRes.error) throw metaRes.error
}
