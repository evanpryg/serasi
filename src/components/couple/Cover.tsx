import { useEffect, useRef, useState } from 'react'
import { Camera, ImageUp, Loader2, RotateCcw } from 'lucide-react'
import { AnimatePresence, m } from '@/components/motion'
import { useWorkspace } from '@/auth/WorkspaceProvider'
import { DEFAULT_COVER } from '@/lib/config'
import { resetCoverPhoto, signedCoverUrl, uploadCoverPhoto, validateCoverFile } from '@/lib/cover'
import { cn } from '@/lib/cn'
import { SIDE_TONE, resolveSide } from '@/lib/side'
import type { Member } from '@/auth/WorkspaceProvider'

/** URL foto sampul: foto pasangan (signed URL privat) atau foto bawaan. */
export function useCoverUrl(path: string | null): { url: string | null; isDefault: boolean } {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    if (!path) {
      setUrl(null)
      return
    }
    void signedCoverUrl(path).then((u) => active && setUrl(u))
    return () => {
      active = false
    }
  }, [path])
  return { url, isDefault: !path || !url }
}

/** Gambar sampul dengan fade-in saat termuat. */
export function CoverImage({ path, alt, className, imgClassName }: { path: string | null; alt: string; className?: string; imgClassName?: string }) {
  const { url } = useCoverUrl(path)
  const src = url ?? DEFAULT_COVER.jpg
  // "Termuat" dikaitkan ke src tertentu: gambar dari cache bisa memicu onLoad sebelum efek berjalan.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const loaded = loadedSrc === src
  return (
    <div className={cn('overflow-hidden bg-surface-muted', className)}>
      <picture className="block h-full w-full">
        {!url && <source srcSet={DEFAULT_COVER.webp} type="image/webp" />}
        <m.img
          key={src}
          src={src}
          alt={alt}
          decoding="async"
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0 && loadedSrc !== src) setLoadedSrc(src)
          }}
          onLoad={() => setLoadedSrc(src)}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      </picture>
    </div>
  )
}

/** Tombol ganti / kembalikan foto sampul. */
export function CoverPhotoControls({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const { wedding, refresh } = useWorkspace()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null)
  if (!wedding) return null

  async function onFile(file: File | undefined) {
    if (!file || !wedding) return
    const invalid = validateCoverFile(file)
    if (invalid) return setMessage({ tone: 'error', text: invalid })
    setBusy(true)
    setMessage(null)
    try {
      await uploadCoverPhoto(wedding.id, file, wedding.cover_photo_path)
      await refresh()
      setMessage({ tone: 'ok', text: 'Foto sampul diperbarui.' })
    } catch {
      setMessage({ tone: 'error', text: 'Foto gagal diunggah. Coba lagi.' })
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function onReset() {
    if (!wedding) return
    setBusy(true)
    try {
      await resetCoverPhoto(wedding.id, wedding.cover_photo_path)
      await refresh()
      setMessage({ tone: 'ok', text: 'Kembali ke foto bawaan.' })
    } catch {
      setMessage({ tone: 'error', text: 'Gagal mengembalikan foto. Coba lagi.' })
    } finally {
      setBusy(false)
    }
  }

  const btn =
    tone === 'light'
      ? 'bg-white/90 text-ink hover:bg-white shadow-sm backdrop-blur'
      : 'bg-surface text-ink border border-border hover:bg-surface-muted'

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      <div className="flex gap-2">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void onFile(e.target.files?.[0])} />
        {wedding.cover_photo_path && (
          <button type="button" onClick={() => void onReset()} disabled={busy} className={cn('flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors disabled:opacity-60', btn)} aria-label="Kembalikan foto sampul bawaan">
            <RotateCcw className="size-4" aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={cn('flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-60', btn)}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : wedding.cover_photo_path ? <Camera className="size-4" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
          {wedding.cover_photo_path ? 'Ganti foto' : 'Pakai foto prewedding'}
        </button>
      </div>
      <AnimatePresence>
        {message && (
          <m.p
            role={message.tone === 'error' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className={cn('rounded-full px-3 py-1 text-xs font-semibold', message.tone === 'error' ? 'bg-danger text-white' : 'bg-white/90 text-success')}
          >
            {message.text}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Avatar foto atau inisial; warna mengikuti peran (owner hijau, partner maroon) seperti dua buku nikah. */
export function MemberAvatar({
  member,
  size = 'md',
  className,
}: {
  member: Pick<Member, 'name' | 'role' | 'avatarUrl'>
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}) {
  const [imgError, setImgError] = useState(false)
  const initials = member.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
  const sizes = {
    sm: 'size-8 text-xs',
    md: 'size-11 text-sm',
    lg: 'size-16 text-lg',
    xl: 'size-20 text-2xl',
    '2xl': 'size-24 text-3xl',
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-white select-none',
        SIDE_TONE[resolveSide(member)].bg,
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {member.avatarUrl && !imgError ? (
        <img
          key={member.avatarUrl}
          src={member.avatarUrl}
          alt={member.name}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </span>
  )
}

/**
 * Wrapper avatar yang menambahkan tombol kamera kecil di pojok kanan bawah,
 * sehingga user bisa mengganti foto profil langsung dari daftar anggota.
 * Hanya tampil untuk member yang merupakan diri sendiri (isMe).
 */
export function AvatarUploadButton({
  member,
  size = 'md',
  onUpload,
  loading = false,
  className,
}: {
  member: Pick<Member, 'name' | 'role' | 'avatarUrl' | 'isMe'>
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  onUpload: (file: File) => void
  loading?: boolean
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraSize = size === 'sm' ? 'size-5' : size === 'md' ? 'size-6' : 'size-7'
  const iconSize = size === 'sm' ? 'size-2.5' : size === 'md' ? 'size-3' : 'size-3.5'

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <MemberAvatar member={member} size={size} />
      {member.isMe && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-label={`Ganti foto profil ${member.name}`}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            title="Ganti foto profil"
            className={cn(
              'absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border-2 border-white bg-surface shadow-sm transition-colors hover:bg-surface-muted disabled:opacity-60',
              cameraSize,
            )}
          >
            {loading ? (
              <Loader2 className={cn(iconSize, 'animate-spin text-ink-muted')} aria-hidden />
            ) : (
              <Camera className={cn(iconSize, 'text-ink')} aria-hidden />
            )}
          </button>
        </>
      )}
      {/* Overlay upload spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
          <Loader2 className="size-4 animate-spin text-white" aria-hidden />
        </div>
      )}
    </div>
  )
}

