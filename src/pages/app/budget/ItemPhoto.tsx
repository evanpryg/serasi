import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { itemPhotoUrl, validateItemPhoto } from '@/lib/itemPhoto'

/** URL tampil untuk `proof_path` (signed URL di akun riil, data URL di demo). */
export function usePhotoUrl(path: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<{ path: string; url: string | null } | null>(null)
  useEffect(() => {
    if (!path) return
    let active = true
    void itemPhotoUrl(path).then((url) => active && setResolved({ path, url }))
    return () => {
      active = false
    }
  }, [path])
  return path && resolved?.path === path ? resolved.url : null
}

/** Gambar dengan ruang tersimpan (tanpa lompatan tata letak) dan fade-in saat termuat. */
export function PhotoImg({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <span className={cn('block overflow-hidden bg-surface-muted', className)}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn('size-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </span>
  )
}

/** Foto layar penuh. Tutup dengan tombol, ketuk latar, atau Escape. */
export function PhotoLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={alt} className="animate-fade-up fixed inset-0 z-[60] flex items-center justify-center bg-ink/85 p-4" onClick={onClose}>
      <img src={src} alt={alt} className="max-h-[85dvh] max-w-full rounded-2xl object-contain shadow-pop" onClick={(e) => e.stopPropagation()} />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Tutup foto"
        className="absolute right-3 top-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
      >
        <X className="size-5" aria-hidden />
      </button>
    </div>,
    document.body,
  )
}

/**
 * Pilih foto di dalam form. Belum diunggah: file disimpan dulu dan diunggah saat form disimpan.
 * `current` = foto yang sudah ada (path); `file` = foto baru yang dipilih; `removed` = pengguna menghapus foto.
 */
export function PhotoPicker({
  current,
  file,
  removed,
  onPick,
  onRemove,
}: {
  current: string | null
  file: File | null
  removed: boolean
  onPick: (file: File) => void
  onRemove: () => void
}) {
  const inputId = useId()
  const [error, setError] = useState<string | null>(null)
  const savedUrl = usePhotoUrl(removed ? null : current)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setFileUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const preview = fileUrl ?? savedUrl
  const has = Boolean(file || (current && !removed))

  return (
    <div>
      <span className="text-sm font-semibold text-ink">
        Foto <span className="text-xs font-normal text-ink-subtle">(opsional)</span>
      </span>
      <div className="mt-1.5 flex items-center gap-2">
        <label
          htmlFor={inputId}
          className={cn(
            'flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border px-1.5 text-sm font-semibold transition-colors focus-within:ring-3 focus-within:ring-primary/15',
            has ? 'border-border bg-surface text-ink hover:border-border-strong' : 'border-dashed border-border-strong text-primary hover:bg-primary-soft/50',
          )}
        >
          {has ? (
            <PhotoImg src={preview} alt="Pratinjau foto item" className="size-8 shrink-0 rounded-lg" />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center">
              <ImagePlus className="size-4.5" aria-hidden />
            </span>
          )}
          <span className="truncate">{has ? 'Ganti foto' : 'Tambah foto'}</span>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const picked = e.target.files?.[0]
              e.target.value = ''
              if (!picked) return
              const invalid = validateItemPhoto(picked)
              setError(invalid)
              if (!invalid) onPick(picked)
            }}
          />
        </label>
        {has && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Hapus foto"
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-ink-subtle hover:bg-danger-soft hover:text-danger"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
