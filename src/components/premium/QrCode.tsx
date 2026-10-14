/** Render QRIS untuk checkout. File terpisah agar library QR hanya dimuat di halaman Premium. */
import { useMemo } from 'react'
import qrcode from 'qrcode-generator'
import { cn } from '@/lib/cn'

const QUIET = 4

function qrModules(value: string) {
  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()
  return { n: qr.getModuleCount(), isDark: (r: number, c: number) => qr.isDark(r, c) }
}

/**
 * Kode QR sebagai SVG (tajam di layar mana pun). Sengaja hitam murni di atas putih,
 * tidak ikut token tema: pemindai QRIS butuh kontras maksimal.
 */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { d, size } = useMemo(() => {
    const { n, isDark } = qrModules(value)
    let path = ''
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) if (isDark(r, c)) path += `M${c + QUIET} ${r + QUIET}h1v1h-1z`
    }
    return { d: path, size: n + QUIET * 2 }
  }, [value])

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" className={cn('block bg-white', className)}>
      <rect width={size} height={size} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  )
}

/** Gambar PNG berisi QR + nominal, untuk "Scan dari galeri" saat membayar dari HP yang sama. */
export async function qrPngBlob(value: string, caption: string, subcaption: string): Promise<Blob> {
  const { n, isDark } = qrModules(value)
  const scale = 12
  const qrPx = (n + QUIET * 2) * scale
  const canvas = document.createElement('canvas')
  canvas.width = qrPx
  canvas.height = qrPx + 120
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak tersedia')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000000'
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (isDark(r, c)) ctx.fillRect((c + QUIET) * scale, (r + QUIET) * scale, scale, scale)
  ctx.textAlign = 'center'
  ctx.font = 'bold 44px system-ui, sans-serif'
  ctx.fillText(caption, canvas.width / 2, qrPx + 40)
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillStyle = '#444444'
  ctx.fillText(subcaption, canvas.width / 2, qrPx + 90)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Gagal membuat gambar')
  return blob
}
